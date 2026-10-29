import {comebackAppearance} from './comeback-stages.mjs';
import {exercise} from './catalog.mjs';
import {rewardedWorkouts,migrateWorld,validWorld} from './gameplay.mjs';
export const COMEBACK_MILESTONES=[
 {at:0,name:'Starting out',note:'There is room for a small beginning.'},
 {at:8,name:'Finding your rhythm',note:'Returning is becoming part of your story.'},
 {at:24,name:'Finding your form',note:'You have made space for movement, your way.'},
 {at:48,name:'Moving with confidence',note:'Your experience stays with you, including on quieter days.'},
 {at:96,name:'Your stronger chapter',note:'A fictional character milestone, built from many small efforts.'},
];
export function comebackCredit(record,ledger){
 if(ledger)return ledger.entries.find(e=>e.sessionId===record?.id)?.units||0;
 if(!record||record.mode==='preview'||typeof record.id!=='string')return 0;
 if(record.qualityVersion!==3)return rewardedWorkouts([record]).length?1:0;
 const planned=record.segments?.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0)||0;
 if(!Number.isFinite(planned)||planned<=0||!Array.isArray(record.movements))return 0;
 let actual=0;for(const m of record.movements){if(!Number.isFinite(m.actualMs)||!Number.isFinite(m.plannedMs)||m.actualMs<0||m.actualMs>m.plannedMs)return 0;if(exercise(m.exerciseId)?.selectable)actual+=m.actualMs;}
 return Math.min(1,actual/planned);
}
export function comebackProgress(input=[]){
 const history=Array.isArray(input)?input:input.history||[],ledger=Array.isArray(input)?null:input.comeback;
 const records=new Map();if(ledger){for(const e of ledger.entries)if(e.units>0)records.set(e.sessionId,e.units);}else for(const h of history){const credit=comebackCredit(h);if(credit>0)records.set(h.id,Math.max(records.get(h.id)||0,credit));}
 const units=[...records.values()].reduce((n,v)=>n+v,0);let milestone=0;for(let i=0;i<COMEBACK_MILESTONES.length;i++)if(units+1e-9>=COMEBACK_MILESTONES[i].at)milestone=i;
 const next=COMEBACK_MILESTONES[milestone+1]||null;
 return {units,sessionCount:records.size,milestone,current:COMEBACK_MILESTONES[milestone],next,fraction:next?Math.max(0,Math.min(1,(units-COMEBACK_MILESTONES[milestone].at)/(next.at-COMEBACK_MILESTONES[milestone].at))):1,appearance:comebackAppearance(units),unlocks:ledger?.milestones||[]};
}
export const creditLabel=(record,ledger)=>{const n=comebackCredit(record,ledger);return n>0?(n===1?'1 comeback step earned':n<.01?'Less than 0.01 comeback step earned':n.toFixed(2)+' comeback step earned'):'Activity saved; your existing progress is kept.';};
// V1 is an immutable earning policy, not the current clinical eligibility catalogue.
// New catalogue entries require a new policy; locked V1 candidates are deliberately absent.
export const COMEBACK_POLICY_V1=Object.freeze(['march','calf','reach','abdominal-bracing','pelvic-tilt','heel-slide','glute-bridge']);
const v1=new Set(COMEBACK_POLICY_V1),num=n=>Number.isFinite(n)&&n>=0;
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const real=h=>h&&typeof h.id==='string'&&h.mode!=='preview';
export function frozenSmallPlan(h){
 const floor=new Set(['abdominal-bracing','pelvic-tilt','heel-slide']),ids=h.segments.filter(b=>b.kind==='work').map(b=>b.exerciseId);
 return ids.length>0&&ids.every(id=>id==='reach'||floor.has(id))&&new Set(ids.map(id=>id==='reach'?'standing':'floor')).size===1;
}
export function frozenFullActivity(h){
 const planned=h.segments?.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0)||0;
 return planned>0&&Array.isArray(h.movements)&&h.movements.reduce((n,m)=>n+m.actualMs,0)===planned&&h.movements.every(m=>m.actualMs===m.plannedMs&&v1.has(m.exerciseId));
}
function timberEvidence(h){return real(h)&&h.completed&&h.activeMs>=30000&&h.elapsedMs===h.minutes*60000&&(h.qualityVersion!==3||frozenFullActivity(h));}
function evidence(h,allowed){
 if(h.qualityVersion===3&&h.engineVersion===2&&h.movementAccounting!=='legacy-estimate'){
  const plannedMs=h.segments.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0);
  const used=h.movements.filter(m=>m.actualMs>0&&allowed.has(m.exerciseId)),eligibleIds=[...new Set(used.map(m=>m.exerciseId))].sort();
  const actualMs=used.reduce((n,m)=>n+m.actualMs,0);
  return {basis:'recorded-movement',plannedMs,actualMs,eligibleIds,units:plannedMs?Math.min(1,actualMs/plannedMs):0};
 }
 // Older partial timings cannot be reconstructed reliably. Preserve genuine full rewards only.
 return {basis:timberEvidence(h)?'legacy-completion':'unverified-legacy',plannedMs:null,actualMs:null,eligibleIds:[],units:timberEvidence(h)?1:0};
}
function milestones(entries,migratedAt){
 let total=0,index=1;const result=[{threshold:0,unlockedAt:migratedAt,sessionId:null}];
 for(const entry of entries){total+=entry.units;while(index<COMEBACK_MILESTONES.length&&total+1e-9>=COMEBACK_MILESTONES[index].at){result.push({threshold:COMEBACK_MILESTONES[index++].at,unlockedAt:entry.earnedAt,sessionId:entry.sessionId});}}
 return result;
}
function archive(state,now){
 const world=structuredClone(migrateWorld(state)),earnedTimberIds=[...new Set(state.history.filter(timberEvidence).map(h=>h.id))];
 const spent=new Set([...world.workshop.spentRewardIds,...world.projects.flatMap(p=>p.rewardIds)]);
 return {version:1,capturedAt:now,sourceSessionIds:state.history.map(h=>h.id),world,earnedTimberIds,unspentTimberIds:earnedTimberIds.filter(id=>!spent.has(id))};
}
function entryFor(h,origin,now){
 const allowed=origin==='migration'?v1:new Set(COMEBACK_POLICY_V1.filter(id=>exercise(id)?.selectable));
 return {sessionId:h.id,ruleVersion:1,origin,earnedAt:h.endedAt,recordedAt:now,...evidence(h,allowed)};
}
export function migrateComeback(state,now=Date.now()){
 let ledger=state.comeback||{version:1,migratedAt:now,entries:[],milestones:[],legacy:archive(state,now)};
 const known=new Set(ledger.entries.map(e=>e.sessionId)),missing=state.history.filter(h=>real(h)&&!known.has(h.id)).sort((a,b)=>a.endedAt-b.endedAt||a.id.localeCompare(b.id));
 if(state.comeback&&!missing.length)return state;
 const entries=[...ledger.entries];for(const h of missing){if(known.has(h.id))continue;known.add(h.id);entries.push(entryFor(h,'migration',now));}
 ledger={...ledger,entries,milestones:milestones(entries,ledger.migratedAt)};
 return {...state,comeback:ledger};
}
export function awardComeback(state,record,now=Date.now()){
 if(!state.comeback||!real(record)||state.comeback.entries.some(e=>e.sessionId===record.id))return state;
 const entries=[...state.comeback.entries,entryFor(record,'session',now)];
 return {...state,comeback:{...state.comeback,entries,milestones:milestones(entries,state.comeback.migratedAt)}};
}
export function validComeback(state){
 const c=state.comeback;if(c===undefined)return true;
 if(!c||c.version!==1||!num(c.migratedAt)||!Array.isArray(c.entries)||c.entries.length>state.history.length||!Array.isArray(c.milestones))return false;
 const history=new Map(state.history.map(h=>[h.id,h])),seen=new Set();
 for(const e of c.entries){
  const h=history.get(e?.sessionId);
  if(!h||!real(h)||seen.has(e.sessionId)||e.ruleVersion!==1||!['migration','session'].includes(e.origin)||e.earnedAt!==h.endedAt||!num(e.recordedAt)||!num(e.units)||e.units>1||!Array.isArray(e.eligibleIds)||e.eligibleIds.some(id=>!v1.has(id))||new Set(e.eligibleIds).size!==e.eligibleIds.length)return false;
  seen.add(e.sessionId);const expected=evidence(h,e.origin==='migration'?v1:new Set(e.eligibleIds));
  if(!['basis','plannedMs','actualMs','eligibleIds','units'].every(k=>equal(e[k],expected[k])))return false;
 }
 const expectedMilestones=milestones(c.entries,c.migratedAt);
 if(c.milestones.length!==expectedMilestones.length||c.milestones.some((m,i)=>!m||['threshold','unlockedAt','sessionId'].some(k=>m[k]!==expectedMilestones[i][k])))return false;
 const old=c.legacy;
 if(!old||old.version!==1||old.capturedAt!==c.migratedAt||!Array.isArray(old.sourceSessionIds)||new Set(old.sourceSessionIds).size!==old.sourceSessionIds.length||old.sourceSessionIds.some(id=>!history.has(id))||!Array.isArray(old.earnedTimberIds)||!Array.isArray(old.unspentTimberIds)||new Set(old.earnedTimberIds).size!==old.earnedTimberIds.length||old.earnedTimberIds.some(id=>!timberEvidence(history.get(id)))||!validWorld(old.world,state.history,old.earnedTimberIds))return false;
 if(!equal(old.earnedTimberIds,old.sourceSessionIds.filter(id=>timberEvidence(history.get(id)))))return false;
 const spent=new Set([...old.world.workshop.spentRewardIds,...old.world.projects.flatMap(p=>p.rewardIds)]);
 return equal(old.unspentTimberIds,old.earnedTimberIds.filter(id=>!spent.has(id)));
}
