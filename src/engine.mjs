import { emptyWorld, migrateWorld, validWorld, rewardedWorkouts } from './gameplay.mjs';
import { MINUTES, EXERCISES, EXERCISE_REVIEW_VERSION, JOINTS, exercise, enabledExercise, recoveryConfig } from './catalog.mjs';
import { recovery, planSession, eligibleExercises } from './scheduler.mjs';
export { MINUTES, EXERCISES, EXERCISE_REVIEW_VERSION, exercise, recovery, planSession, eligibleExercises };
export const freshState=()=>({schemaVersion:1,deviceId:crypto.randomUUID(),active:null,history:[],world:emptyWorld(),settings:{muted:false,volume:.45,enabledExercises:[]},updatedAt:Date.now(),lastExportAt:null});
export function createSession(minutes,history=[],now=Date.now(),{mode='workout',settings={}}={}){
  if(!['workout','preview'].includes(mode))throw new Error('Unknown session mode.');
  const plan=planSession(minutes,history,now,settings);
  if(!plan.segments){const error=new Error(plan.reason);error.availableMinutes=plan.availableMinutes;throw error;}
  return {id:crypto.randomUUID(),engineVersion:2,mode,minutes,startedAt:now,segments:plan.segments,plan:structuredClone(plan.segments),elapsedMs:0,runningSince:now,checkpointAt:now,status:'running',reason:null,events:[],timeline:[{at:now,position:0}]};
}
export const duration=s=>s.segments.reduce((n,b)=>n+b.durationMs,0);
export const elapsed=(s,now=Date.now())=>Math.min(duration(s),Math.max(0,s.elapsedMs+(s.status==='running'?Math.max(0,now-s.runningSince):0)));
export function position(s,now=Date.now()){
  let remaining=elapsed(s,now);
  for(let index=0;index<s.segments.length;index++){
    const segment=s.segments[index];
    if(remaining<segment.durationMs)return {...segment,index,segmentElapsedMs:remaining,remainingMs:segment.durationMs-remaining,rep:Math.floor(remaining/3000)+1};
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
export function replace(s,now=Date.now(),{history=[],settings={}}={}){
  const p=position(s,now);if(p.done||p.kind!=='work')return s;
  const movements=performedMovements(s,now),record={mode:s.mode,endedAt:now,activeMs:0,groups:[],movements};
  const candidates=eligibleExercises([...history,record],now,settings).filter(e=>e.id!==p.exerciseId&&e.position===exercise(p.exerciseId).position&&e.loadKind!=='strength');
  const config=recoveryConfig(settings),prior=recovery(history,now,settings);
  const fits=e=>{
    const draft={...s,status:'paused',elapsedMs:duration(s),segments:s.segments.map((b,i)=>i===p.index?{...b,exerciseId:e.id}:b),events:[...s.events,{type:'replace',index:p.index,fromExerciseId:p.exerciseId,exerciseId:e.id,segmentElapsedMs:p.segmentElapsedMs,at:now}]};
    const projected=performedMovements(draft,now);
    const load=projected.filter(m=>m.exerciseId===e.id).reduce((n,m)=>n+m.actualMs,0);
    return load+(prior.used[e.id]||0)<=config.maxRepeatableSeconds*1000;
  };
  const suitable=candidates.filter(fits);
  const id=suitable.find(e=>e.id===exercise(p.exerciseId).alternative)?.id||suitable[0]?.id;
  if(!id)return {...s,replacementMessage:'No suitable enabled replacement remains. Pause, skip or end this session.'};
  return {...s,replacementMessage:null,segments:s.segments.map((b,i)=>i===p.index?{...b,exerciseId:id}:b),events:[...s.events,{type:'replace',index:p.index,fromExerciseId:p.exerciseId,exerciseId:id,segmentElapsedMs:p.segmentElapsedMs,at:now}]};
}
export function finish(state,completed,now=Date.now()){
  const s=state.active;if(!s)return state;
  const consumed=elapsed(s,now),movements=performedMovements(s,now),activeMs=movements.reduce((n,m)=>n+m.actualMs,0);
  const groups=[...new Set(movements.filter(m=>m.actualMs>0).map(m=>exercise(m.exerciseId).group))];
  const record={schemaVersion:1,...(s.engineVersion===2?{engineVersion:2,plan:s.plan,timeline:s.timeline}:{}),id:s.id,deviceId:state.deviceId,startedAt:s.startedAt,endedAt:now,minutes:s.minutes,elapsedMs:consumed,activeMs,mode:s.mode||'workout',completed:completed&&consumed===duration(s),groups,segments:s.segments,events:s.events,...(s.engineVersion===2?{movements}:{movementAccounting:'legacy-estimate'})};
  return {...state,active:null,history:[...state.history.filter(h=>h.id!==s.id),record],updatedAt:now};
}
export const progress=history=>rewardedWorkouts(history).length;
export function setFeedback(state,id,comfort,joints=[],now=Date.now()){
  if(!['comfortable','difficult','discomfort'].includes(comfort)||!Array.isArray(joints)||!joints.every(j=>JOINTS.includes(j)))throw new Error('Invalid comfort feedback.');
  return {...state,history:state.history.map(h=>h.id===id?{...h,feedback:{comfort,joints:[...new Set(joints)],updatedAt:now}}:h),updatedAt:now};
}
export function validateBackup(input) {
  const fail = () => { throw new Error('This is not a valid Little Strides backup. Your current data is unchanged.'); };
  const num = n => Number.isFinite(n) && n >= 0;
  const legacySegmentsOk = (segments, minutes) => Array.isArray(segments) && segments.length === minutes * 2 && segments.every((b, i) => b && exercise(b.exerciseId) && b.kind === (i % 2 ? 'rest' : 'work') && b.durationMs === (i % 2 ? 15_000 : 45_000));
  const segmentsOk=(segments,minutes,version)=>version!==2?legacySegmentsOk(segments,minutes):Array.isArray(segments)&&segments.length===minutes*2&&segments.reduce((n,b)=>n+b.durationMs,0)===minutes*60_000&&segments.every((b,i)=>b&&((i===0&&b.kind==='prepare'||i===segments.length-1&&b.kind==='cooldown')?b.exerciseId===null&&b.durationMs===30_000:exercise(b.exerciseId)&&b.kind===(i%2?'work':'rest')&&b.durationMs===(i%2?45_000:15_000)));
  const eventsOk = (events, count) => Array.isArray(events) && events.length <= 20_000 && events.every(e => e && ['replace', 'skip'].includes(e.type) && Number.isInteger(e.index) && e.index >= 0 && e.index < count && num(e.at) && (e.type !== 'replace' || exercise(e.exerciseId)));
  const identity = x => x && typeof x.id === 'string' && x.id.length > 0 && x.id.length <= 100;
  if (!input || input.format !== 'little-strides' || input.schemaVersion !== 1) fail();
  const s = input.data;
  if (!s || s.schemaVersion !== 1 || typeof s.deviceId !== 'string' || s.deviceId.length > 100 || !num(s.updatedAt) || !(s.lastExportAt === null || num(s.lastExportAt)) || !s.settings || typeof s.settings.muted !== 'boolean' || !num(s.settings.volume) || s.settings.volume > 1 || !Array.isArray(s.history) || s.history.length > 100_000) fail();
  const ids = new Set();
  for (const h of s.history) {
    if (!(h.mode === undefined || ['workout', 'preview'].includes(h.mode)) || !identity(h) || ids.has(h.id) || h.schemaVersion !== 1 || typeof h.deviceId !== 'string' || !MINUTES.includes(h.minutes) || !num(h.startedAt) || !num(h.endedAt) || h.endedAt < h.startedAt || !num(h.elapsedMs) || h.elapsedMs > h.minutes * 60_000 || !num(h.activeMs) || h.activeMs > h.elapsedMs || typeof h.completed !== 'boolean' || !Array.isArray(h.groups) || !h.groups.every(g => ['upper', 'legs', 'mobility'].includes(g)) || !segmentsOk(h.segments, h.minutes, h.engineVersion) || !eventsOk(h.events, h.segments.length)) fail();
    ids.add(h.id);
  }
  if (s.active !== null) {
    const a = s.active;
    if (!(a.mode === undefined || ['workout', 'preview'].includes(a.mode)) || !identity(a) || ids.has(a.id) || !MINUTES.includes(a.minutes) || !num(a.startedAt) || !num(a.checkpointAt) || a.checkpointAt < a.startedAt || !num(a.elapsedMs) || a.elapsedMs > a.minutes * 60_000 || !['running', 'paused'].includes(a.status) || !(a.reason === null || ['paused', 'interrupted'].includes(a.reason)) || (a.status === 'running' ? !num(a.runningSince) || a.runningSince > a.checkpointAt : a.runningSince !== null) || !segmentsOk(a.segments, a.minutes, a.engineVersion) || !eventsOk(a.events, a.segments.length)) fail();
  }
  if (!(s.settings.exerciseReviewVersion === undefined || Number.isInteger(s.settings.exerciseReviewVersion) && s.settings.exerciseReviewVersion >= 1 && s.settings.exerciseReviewVersion <= EXERCISE_REVIEW_VERSION)) fail();
  if(s.settings.paceMuted!==undefined&&typeof s.settings.paceMuted!=='boolean')fail();
  if(s.settings.enabledExercises!==undefined&&(!Array.isArray(s.settings.enabledExercises)||!s.settings.enabledExercises.every(id=>exercise(id))))fail();
  if(s.settings.recovery!==undefined){const c=recoveryConfig(s.settings);if(![24,48,72,96].includes(c.strengthHours)||![24,48,72,96].includes(c.discomfortHours)||c.windowHours!==24||!Number.isFinite(c.maxStrengthSeconds)||c.maxStrengthSeconds<45||c.maxStrengthSeconds>180||!Number.isFinite(c.maxRepeatableSeconds)||c.maxRepeatableSeconds<90||c.maxRepeatableSeconds>1200)fail();}
  for(const h of [...s.history,...(s.active?[s.active]:[])]){
    if(h.engineVersion!==undefined&&h.engineVersion!==2)fail();
    if(h.engineVersion===2&&(!segmentsOk(h.plan,h.minutes,2)||!Array.isArray(h.timeline)||h.timeline.length>10000||!h.timeline.length||h.timeline.some((a,i)=>!num(a.at)||!num(a.position)||a.position>h.minutes*60_000||(i>0&&(a.at<h.timeline[i-1].at||a.position<h.timeline[i-1].position)))||h.events.some(e=>!num(e.segmentElapsedMs)||e.segmentElapsedMs>h.segments[e.index].durationMs)))fail();
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
