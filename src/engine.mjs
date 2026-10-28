import { emptyWorld, migrateWorld, validWorld, rewardedWorkouts, fullEligibleActivity } from './gameplay.mjs';
import { MINUTES, SESSION_MINUTES, EXERCISES, EXERCISE_REVIEW_VERSION, JOINTS, exercise, enabledExercise, recoveryConfig, planningMetadata } from './catalog.mjs';
import { recovery, planSession, eligibleExercises, capacityFits } from './scheduler.mjs';
export { MINUTES, SESSION_MINUTES, EXERCISES, EXERCISE_REVIEW_VERSION, exercise, recovery, planSession, eligibleExercises };
import {withSuggestions} from './suggestions.mjs';
export const freshState=()=>({schemaVersion:1,deviceId:crypto.randomUUID(),active:null,history:[],world:emptyWorld(),settings:withSuggestions({muted:false,volume:.45}),updatedAt:Date.now(),lastExportAt:null});
export function createSession(minutes,history=[],now=Date.now(),{mode='workout',settings={},plannedSwaps=[]}={}){
  if(!['workout','preview'].includes(mode))throw new Error('Unknown session mode.');
  let plan=planSession(minutes,history,now,settings);
  for(const swap of plannedSwaps)plan={...plan,segments:swapPlannedMovement(plan.segments,swap.index,swap.exerciseId,{minutes,history,now,settings})};
  if(!plan.segments){const error=new Error(plan.reason);error.availableMinutes=plan.availableMinutes;throw error;}
  return {id:crypto.randomUUID(),qualityVersion:3,engineVersion:2,compositionVersion:1,focus:plan.focus,focusLabel:plan.label,mode,minutes,startedAt:now,segments:plan.segments,plan:structuredClone(plan.segments),elapsedMs:0,runningSince:now,checkpointAt:now,status:'running',reason:null,events:[],timeline:[{at:now,position:0}]};
}
export function createPreviewSession(minutes=10,now=Date.now()){
  if(!SESSION_MINUTES.includes(minutes))throw new Error('Choose 7, 10, 15 or 20 minutes.');
  const segments=[{kind:'prepare',exerciseId:null,durationMs:30000}];
  for(let i=0;i<minutes-1;i++)segments.push({kind:'work',exerciseId:null,previewLabel:'Sample timer card',durationMs:45000},{kind:'rest',exerciseId:null,durationMs:15000});
  segments.push({kind:'cooldown',exerciseId:null,durationMs:30000});
  return {id:crypto.randomUUID(),engineVersion:2,mode:'preview',minutes,startedAt:now,segments,plan:structuredClone(segments),elapsedMs:0,runningSince:now,checkpointAt:now,status:'running',reason:null,events:[],timeline:[{at:now,position:0}]};
}
export const persistableState=state=>state.active?.mode==='preview'?{...state,active:null}:state;
export const duration=s=>s.segments.reduce((n,b)=>n+b.durationMs,0);
export const elapsed=(s,now=Date.now())=>Math.min(duration(s),Math.max(0,s.elapsedMs+(s.status==='running'?Math.max(0,now-s.runningSince):0)));
export function position(s,now=Date.now()){
  let remaining=elapsed(s,now);
  for(let index=0;index<s.segments.length;index++){
    const segment=s.segments[index];
    if(remaining<segment.durationMs){const pace=exercise(segment.exerciseId)?.paceMs??3000;return {...segment,index,segmentElapsedMs:remaining,remainingMs:segment.durationMs-remaining,rep:pace?Math.floor(remaining/pace)+1:0,paceTotal:pace?Math.ceil(segment.durationMs/pace):0};}
    remaining-=segment.durationMs;
  }
  return {done:true,index:s.segments.length,remainingMs:0};
}
export function freeze(s,now=Date.now(),reason='paused'){
  const value=elapsed(s,now);
  return {...s,elapsedMs:value,runningSince:null,checkpointAt:now,status:'paused',reason};
}
export function resume(s,now=Date.now()){
  return {...s,runningSince:now,checkpointAt:now,status:'running',reason:null,...(s.engineVersion===2?{timeline:[...s.timeline,{at:now,position:s.elapsedMs}]}:{})};
}
export const restore=s=>s?freeze(s,s.checkpointAt,'interrupted'):null;
export function skip(s,now=Date.now()){
  const p=position(s,now);if(p.done)return s;
  const next=s.segments.slice(0,p.index+1).reduce((n,b)=>n+b.durationMs,0);
  return {...s,elapsedMs:next,runningSince:s.status==='running'?now:null,checkpointAt:now,events:[...s.events,{type:'skip',index:p.index,at:now,segmentElapsedMs:p.segmentElapsedMs}],...(s.engineVersion===2?{timeline:[...s.timeline,{at:now,position:next}]}:{})};
}
function wallTime(s,offset,now){
  if(s.engineVersion!==2)return now;
  const anchor=[...s.timeline].reverse().find(a=>a.position<=offset)||{at:s.startedAt,position:0};
  return Math.min(now,anchor.at+offset-anchor.position);
}
export function performedMovements(s,now=Date.now()){
  const consumed=elapsed(s,now),result=[];let start=0;
  for(const [index,b]of s.segments.entries()){
    if(b.kind==='work'){
      const skipEvent=s.events.find(e=>e.type==='skip'&&e.index===index),replacements=s.events.filter(e=>e.type==='replace'&&e.index===index);
      const total=Math.min(b.durationMs,Math.max(0,consumed-start)),actualEnd=skipEvent?skipEvent.segmentElapsedMs||0:total;
      const original=s.plan?.[index]?.exerciseId||replacements[0]?.fromExerciseId||b.exerciseId;
      const parts=[{exerciseId:original,offset:0},...replacements.map(e=>({exerciseId:e.exerciseId,offset:e.segmentElapsedMs||0}))];
      parts.forEach((part,i)=>{
        const end=parts[i+1]?.offset??b.durationMs,plannedMs=end-part.offset,actualMs=Math.max(0,Math.min(actualEnd,end)-part.offset);
        const status=i<parts.length-1?'replaced':actualMs===plannedMs?'completed':actualMs>0?'partial':skipEvent?'skipped':'not-started';
        result.push({index,exerciseId:part.exerciseId,plannedExerciseId:original,plannedMs,actualMs,skippedMs:skipEvent?Math.max(0,plannedMs-actualMs):0,status,endedAt:actualMs?wallTime(s,start+part.offset+actualMs,now):now,repetitions:null});
      });
    }
    start+=b.durationMs;
  }
  return result;
}
export const samePurpose=(a,b)=>a.loadKind===b.loadKind&&(a.focus==='core')===(b.focus==='core');
export function plannedAlternatives(segments,index,{minutes,history=[],now=Date.now(),settings={}}){
 const block=segments?.[index],original=exercise(block?.exerciseId);if(!original||block.kind!=='work')return [];
 return eligibleExercises(history,now,settings).filter(e=>e.id!==original.id&&e.position===original.position&&samePurpose(e,original)&&(minutes!==3||['activation','mobility'].includes(e.loadKind))).filter(e=>{
  const meta=planningMetadata(e,settings);if(block.durationMs>meta.maxSeconds*1000||block.durationMs<meta.minSeconds*1000)return false;
  const next=segments.map((b,i)=>i===index?{...b,exerciseId:e.id}:b),periods=next.filter((b,i)=>b.exerciseId===e.id&&(!b.intentionalContinuation||next[i-1]?.exerciseId!==e.id));
  if(periods.length>meta.maxBlocks)return false;
  let followingRest=0;for(let i=index+1;i<next.length&&next[i].kind!=='work';i++)followingRest+=next[i].durationMs;
  if(next.slice(index+1).some(b=>b.kind==='work')&&followingRest<meta.restSeconds*1000)return false;
  const projected=next.filter(b=>b.kind==='work').map(b=>({exerciseId:b.exerciseId,actualMs:b.durationMs}));return capacityFits(projected,history,now,settings);
 });
}
export function swapPlannedMovement(segments,index,exerciseId,options){
 if(!plannedAlternatives(segments,index,options).some(e=>e.id===exerciseId))throw new Error('That same-purpose replacement no longer fits your choices or recovery limits. Refresh your suggestion.');
 return segments.map((b,i)=>i===index?{...b,exerciseId}:b);
}
export function replacementOptions(s,now=Date.now(),{history=[],settings={}}={}){
 const p=position(s,now),original=exercise(p.exerciseId);if(!original||p.kind!=='work')return [];
 const movements=performedMovements(s,now),record={mode:s.mode,endedAt:now,activeMs:0,groups:[],movements};
 return eligibleExercises([...history,record],now,settings).filter(e=>e.id!==p.exerciseId&&e.position===original.position&&samePurpose(e,original)&&(s.minutes!==3||['activation','mobility'].includes(e.loadKind))&&p.remainingMs>=planningMetadata(e,settings).minSeconds*1000&&p.remainingMs<=planningMetadata(e,settings).maxSeconds*1000).filter(e=>{
  const draft={...s,status:'paused',elapsedMs:duration(s),segments:s.segments.map((b,i)=>i===p.index?{...b,exerciseId:e.id}:b),events:[...s.events,{type:'replace',index:p.index,fromExerciseId:p.exerciseId,exerciseId:e.id,segmentElapsedMs:p.segmentElapsedMs,at:now}]};
  const meta=planningMetadata(e,settings),projected=performedMovements(draft,now);
  let periods=0;for(const movement of projected)if(movement.exerciseId===e.id&&movement.actualMs>0){const block=draft.segments[movement.index];if(!block.intentionalContinuation||draft.segments[movement.index-1]?.exerciseId!==e.id)periods++;}
  if(periods>meta.maxBlocks)return false;
  let followingRest=0;for(let i=p.index+1;i<draft.segments.length&&draft.segments[i].kind!=='work';i++)followingRest+=draft.segments[i].durationMs;
  if(draft.segments.slice(p.index+1).some(b=>b.kind==='work')&&followingRest<meta.restSeconds*1000)return false;
  return capacityFits(projected,history,now,settings);
 });
}
export function replace(s,now=Date.now(),{history=[],settings={},exerciseId}={}){
 const p=position(s,now);if(p.done||p.kind!=='work')return s;
 if(s.mode==='preview')return {...s,segments:s.segments.map((b,i)=>i===p.index?{...b,previewLabel:b.previewLabel==='Alternative timer card'?'Sample timer card':'Alternative timer card'}:b)};
 const options=replacementOptions(s,now,{history,settings}),id=exerciseId?options.find(e=>e.id===exerciseId)?.id:options[0]?.id;
 if(!id)return {...s,replacementMessage:'No suitable same-purpose replacement remains. Pause, skip or end this session.'};
 return {...s,replacementMessage:null,segments:s.segments.map((b,i)=>i===p.index?{...b,exerciseId:id}:b),events:[...s.events,{type:'replace',index:p.index,fromExerciseId:p.exerciseId,exerciseId:id,segmentElapsedMs:p.segmentElapsedMs,at:now}]};
}
export function finish(state,completed,now=Date.now()){
  const s=state.active;if(!s)return state;
  if(s.mode==='preview')return {...state,active:null,updatedAt:now};
  const consumed=elapsed(s,now),movements=performedMovements(s,now),activeMs=movements.reduce((n,m)=>n+m.actualMs,0);
  const groups=[...new Set(movements.filter(m=>m.actualMs>0).map(m=>exercise(m.exerciseId).group))];
  const record={schemaVersion:1,qualityVersion:3,...(s.compositionVersion?{compositionVersion:s.compositionVersion,focus:s.focus,focusLabel:s.focusLabel}:{}),...(s.engineVersion===2?{engineVersion:2,plan:s.plan,timeline:s.timeline}:{}),id:s.id,deviceId:state.deviceId,startedAt:s.startedAt,endedAt:now,minutes:s.minutes,elapsedMs:consumed,activeMs,mode:s.mode||'workout',completed:completed&&consumed===duration(s)&&fullEligibleActivity({segments:s.segments,movements}),groups,segments:s.segments,events:s.events,...(s.engineVersion===2?{movements}:{movements,movementAccounting:'legacy-estimate'})};
  return {...state,active:null,history:[...state.history.filter(h=>h.id!==s.id),record],updatedAt:now};
}
export const progress=history=>rewardedWorkouts(history).length;
export function setFeedback(state,id,comfort,joints=[],now=Date.now()){
  if(!['comfortable','difficult','discomfort'].includes(comfort)||!Array.isArray(joints)||!joints.every(j=>JOINTS.includes(j)))throw new Error('Invalid comfort feedback.');
  return {...state,history:state.history.map(h=>h.id===id?{...h,feedback:{comfort,joints:[...new Set(joints)],updatedAt:now},...(comfort==='discomfort'?{discomfort:{at:now,joints:[...new Set(joints)]}}:{})}:h),updatedAt:now};
}
export function setExerciseHold(state,id,flag,now=Date.now()){
  if(!exercise(id))throw new Error('Unknown movement.');
  const holds={...state.settings.exerciseHolds},reviews={...state.settings.exerciseReassessedAt};
  if(flag){holds[id]=now;delete reviews[id];}else{delete holds[id];reviews[id]=now;}
  return {...state,settings:{...state.settings,exerciseHolds:holds,exerciseReassessedAt:reviews,enabledExercises:(state.settings.enabledExercises||[]).filter(x=>x!==id)},updatedAt:now};
}
export function canResumeSession(s,history,now,settings){
  if(s.mode==='preview')return true;
  const current=position(s,now),remaining=s.segments.slice(current.index).filter(b=>b.kind==='work');
  const eligible=new Set(eligibleExercises(history,now,settings).map(e=>e.id));
  if(remaining.some(b=>!eligible.has(b.exerciseId)))return false;
  return capacityFits(performedMovements({...s,status:'paused',elapsedMs:duration(s)},now),history,now,settings);
}
export function validateBackup(input) {
  const fail = () => { throw new Error('This is not a valid Little Strides backup. Your current data is unchanged.'); };
  const num = n => Number.isFinite(n) && n >= 0;
  const legacySegmentsOk = (segments, minutes) => Array.isArray(segments) && segments.length === minutes * 2 && segments.every((b, i) => b && exercise(b.exerciseId) && b.kind === (i % 2 ? 'rest' : 'work') && b.durationMs === (i % 2 ? 15_000 : 45_000));
  const segmentsOk=(segments,minutes,version,composition)=>composition===1?Array.isArray(segments)&&segments.length>=3&&segments.length<=100&&segments[0]?.kind==='prepare'&&segments.at(-1)?.kind==='cooldown'&&segments.reduce((n,b)=>n+b.durationMs,0)===minutes*60000&&segments.every((b,i)=>b&&num(b.durationMs)&&b.durationMs>=15000&&b.durationMs<=600000&&(['prepare','cooldown','rest'].includes(b.kind)?b.exerciseId===null:b.kind==='work'&&exercise(b.exerciseId))&&(i>0&&i<segments.length-1?['work','rest'].includes(b.kind):true)):version!==2?legacySegmentsOk(segments,minutes):Array.isArray(segments)&&segments.length===minutes*2&&segments.reduce((n,b)=>n+b.durationMs,0)===minutes*60_000&&segments.every((b,i)=>b&&((i===0&&b.kind==='prepare'||i===segments.length-1&&b.kind==='cooldown')?b.exerciseId===null&&b.durationMs===30_000:exercise(b.exerciseId)&&b.kind===(i%2?'work':'rest')&&b.durationMs===(i%2?45_000:15_000)));
  const eventsOk = (events, count) => Array.isArray(events) && events.length <= 20_000 && events.every(e => e && ['replace', 'skip'].includes(e.type) && Number.isInteger(e.index) && e.index >= 0 && e.index < count && num(e.at) && (e.type !== 'replace' || exercise(e.exerciseId)));
  const identity = x => x && typeof x.id === 'string' && x.id.length > 0 && x.id.length <= 100;
  if (!input || input.format !== 'little-strides' || input.schemaVersion !== 1) fail();
  const s = input.data;
  if (!s || s.schemaVersion !== 1 || typeof s.deviceId !== 'string' || s.deviceId.length > 100 || !num(s.updatedAt) || !(s.lastExportAt === null || num(s.lastExportAt)) || !s.settings || typeof s.settings.muted !== 'boolean' || !num(s.settings.volume) || s.settings.volume > 1 || !Array.isArray(s.history) || s.history.length > 100_000) fail();
  if(s.settings.planning!==undefined&&(!s.settings.planning||Array.isArray(s.settings.planning)||typeof s.settings.planning!=='object'||Object.entries(s.settings.planning).some(([id,v])=>!exercise(id)||!v||Array.isArray(v)||typeof v!=='object'||Object.entries(v).some(([k,n])=>!['maxSeconds','preferredSeconds','restSeconds'].includes(k)||!Number.isFinite(n)||n<15||n>600||n%15))))fail();
  for(const key of ['exerciseHolds','exerciseReassessedAt'])if(s.settings[key]!==undefined&&(!s.settings[key]||Array.isArray(s.settings[key])||typeof s.settings[key]!=='object'||Object.entries(s.settings[key]).some(([id,at])=>!exercise(id)||!num(at))))fail();
  const ids = new Set();
  for (const h of s.history) {
    if (!(h.mode === undefined || ['workout', 'preview'].includes(h.mode)) || !identity(h) || ids.has(h.id) || h.schemaVersion !== 1 || typeof h.deviceId !== 'string' || !SESSION_MINUTES.includes(h.minutes) || !num(h.startedAt) || !num(h.endedAt) || h.endedAt < h.startedAt || !num(h.elapsedMs) || h.elapsedMs > h.minutes * 60_000 || !num(h.activeMs) || h.activeMs > h.elapsedMs || typeof h.completed !== 'boolean' || !Array.isArray(h.groups) || !h.groups.every(g => ['upper', 'legs', 'mobility','core'].includes(g)) || !segmentsOk(h.segments, h.minutes, h.engineVersion,h.compositionVersion) || !eventsOk(h.events, h.segments.length)) fail();
    ids.add(h.id);
  }
  if (s.active !== null) {
    const a = s.active;
    if (!(a.mode === undefined || ['workout', 'preview'].includes(a.mode)) || !identity(a) || ids.has(a.id) || !SESSION_MINUTES.includes(a.minutes) || !num(a.startedAt) || !num(a.checkpointAt) || a.checkpointAt < a.startedAt || !num(a.elapsedMs) || a.elapsedMs > a.minutes * 60_000 || !['running', 'paused'].includes(a.status) || !(a.reason === null || ['paused', 'interrupted'].includes(a.reason)) || (a.status === 'running' ? !num(a.runningSince) || a.runningSince > a.checkpointAt : a.runningSince !== null) || !segmentsOk(a.segments, a.minutes, a.engineVersion,a.compositionVersion) || !eventsOk(a.events, a.segments.length)) fail();
  }
  if (!(s.settings.exerciseReviewVersion === undefined || Number.isInteger(s.settings.exerciseReviewVersion) && s.settings.exerciseReviewVersion >= 1 && s.settings.exerciseReviewVersion <= EXERCISE_REVIEW_VERSION)) fail();
  if(s.settings.sessionFocus!==undefined&&!['mixed','balanced','core','cardio','recovery'].includes(s.settings.sessionFocus))fail();
  if(s.settings.suggestionVersion!==undefined&&s.settings.suggestionVersion!==1)fail();
  if(s.settings.selectionMode!==undefined&&!['suggested','personal'].includes(s.settings.selectionMode))fail();
  if(s.settings.ambience!==undefined&&typeof s.settings.ambience!=='boolean')fail();
  if(s.settings.paceMuted!==undefined&&typeof s.settings.paceMuted!=='boolean')fail();
  if(s.settings.enabledExercises!==undefined&&(!Array.isArray(s.settings.enabledExercises)||!s.settings.enabledExercises.every(id=>exercise(id))))fail();
  if(s.settings.recovery!==undefined){const c=recoveryConfig(s.settings);if(![24,48,72,96].includes(c.strengthHours)||![24,48,72,96].includes(c.discomfortHours)||c.windowHours!==24||!Number.isFinite(c.maxStrengthSeconds)||c.maxStrengthSeconds<45||c.maxStrengthSeconds>180||!Number.isFinite(c.maxRepeatableSeconds)||c.maxRepeatableSeconds<90||c.maxRepeatableSeconds>1200||!Number.isFinite(c.maxJointSeconds)||c.maxJointSeconds<90||c.maxJointSeconds>2400)fail();}
  for(const h of [...s.history,...(s.active?[s.active]:[])]){
    if(h.qualityVersion!==undefined&&h.qualityVersion!==3)fail();
    if(h.minutes===3&&h.mode!=='preview'&&(h.compositionVersion!==1||h.focus!=='recovery'||h.segments[0].durationMs!==30000||h.segments.at(-1).durationMs!==30000||new Set(h.segments.filter(b=>b.kind==='work').map(b=>exercise(b.exerciseId)?.position)).size>1||h.segments.some(b=>b.kind==='work'&&!['activation','mobility'].includes(exercise(b.exerciseId)?.loadKind))))fail();
    if(h.qualityVersion===3&&h!==s.active&&(!Array.isArray(h.movements)||(h.completed&&!fullEligibleActivity(h))))fail();
    if(h.discomfort!==undefined&&(!h.discomfort||!num(h.discomfort.at)||!Array.isArray(h.discomfort.joints)||!h.discomfort.joints.every(j=>JOINTS.includes(j))))fail();
    if(h.compositionVersion!==undefined&&(h.compositionVersion!==1||h.engineVersion!==2||!['balanced','core','cardio','recovery'].includes(h.focus)))fail();
    if(h.engineVersion!==undefined&&h.engineVersion!==2)fail();
    if(h.engineVersion===2&&(!segmentsOk(h.plan,h.minutes,2,h.compositionVersion)||!Array.isArray(h.timeline)||h.timeline.length>10000||!h.timeline.length||h.timeline.some((a,i)=>!num(a.at)||!num(a.position)||a.position>h.minutes*60_000||(i>0&&(a.at<h.timeline[i-1].at||a.position<h.timeline[i-1].position)))||h.events.some(e=>!num(e.segmentElapsedMs)||e.segmentElapsedMs>h.segments[e.index].durationMs)))fail();
    if(h.movements!==undefined){
      if(!Array.isArray(h.movements)||h.movements.length>10000||h.movements.some(m=>!m||!Number.isInteger(m.index)||!h.segments[m.index]||h.segments[m.index].kind!=='work'||!exercise(m.exerciseId)||!exercise(m.plannedExerciseId)||!num(m.actualMs)||!num(m.plannedMs)||m.actualMs>m.plannedMs||!num(m.skippedMs)||m.skippedMs>m.plannedMs||m.actualMs+m.skippedMs>m.plannedMs||!num(m.endedAt)||m.endedAt>h.endedAt||m.repetitions!==null||!['completed','partial','skipped','not-started','replaced'].includes(m.status))||h.movements.reduce((n,m)=>n+m.actualMs,0)!==h.activeMs)fail();
      for(let i=0;i<h.segments.length;i++)if(h.movements.filter(m=>m.index===i).reduce((n,m)=>n+m.plannedMs,0)>(h.segments[i]?.durationMs||0))fail();
    }
    if(h.feedback!==undefined&&(!h.feedback||!['comfortable','difficult','discomfort'].includes(h.feedback.comfort)||!Array.isArray(h.feedback.joints)||!h.feedback.joints.every(j=>JOINTS.includes(j))||!num(h.feedback.updatedAt)))fail();
  }
  const world = migrateWorld(s);
  if (!validWorld(world, s.history)) fail();
  return structuredClone({ ...s, world });
}
