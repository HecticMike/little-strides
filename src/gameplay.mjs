import {exercise} from './catalog.mjs';
export function fullEligibleActivity(h) {
  const planned=h.segments.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0);
  return planned>0&&Array.isArray(h.movements)&&h.movements.reduce((n,m)=>n+m.actualMs,0)===planned&&h.movements.every(m=>m.actualMs===m.plannedMs&&exercise(m.exerciseId)?.selectable);
}
// Rewards are derived from unique completed workout records, never from UI events.
export function rewardedWorkouts(history) {
  const records = new Map();
  for (const h of history) if (h.completed && h.mode !== 'preview' && h.activeMs >= 30_000 && h.elapsedMs === h.minutes * 60_000 && (h.qualityVersion!==3||fullEligibleActivity(h))) records.set(h.id, h);
  return [...records.values()];
}
export const PROJECTS = [
  {id:'workshop',name:'Restore the workshop',cost:1,description:'A sound roof, warm windows and a place to begin.',frame:0},
  {id:'banner',name:'Choose a village banner',cost:1,description:'Your crest above the workshop doorway.',choices:['fern','star'],frame:1},
  {id:'garden',name:'Create a garden resting place',cost:2,description:'A timber bench among flowers or ferns.',choices:['flowers','ferns'],frame:2},
  {id:'lanterns',name:'Light the village path',cost:2,description:'Two warm lanterns welcome the evening.',frame:4},
  {id:'board',name:'Prepare a traveller’s noticeboard',cost:3,description:'A map beyond the gate, and a choice of discovery.',frame:5},
  {id:'gathering',name:'Welcome the first visitors',cost:3,description:'Rowan and Mira bring Hearthwood’s first chapter home.',frame:8},
];
export const CHAPTERS = [{name:'Home',available:true},{name:'Beyond the gate',available:false},{name:'Connections',available:false},{name:'Your Hearthwood',available:false}];
export const emptyWorld = () => ({schemaVersion:2,workshop:{stage:0,spentRewardIds:[],restoredAt:null},projects:[],discovery:{destination:null,seen:[]}});
export function migrateWorld(state) {
  if(state.world?.schemaVersion===2)return state.world;
  if(state.world!==undefined&&state.world?.schemaVersion!==1)return state.world;
  const first=state.world===undefined?rewardedWorkouts(state.history)[0]:null;
  const workshop=state.world!==undefined?state.world.workshop:(first?{stage:1,spentRewardIds:[first.id],restoredAt:first.endedAt}:emptyWorld().workshop);
  return {...emptyWorld(),workshop};
}
export function chapterState(state) {
  const world=migrateWorld(state),earned=rewardedWorkouts(state.history);
  const spent=new Set([...world.workshop.spentRewardIds,...world.projects.flatMap(p=>p.rewardIds)]);
  const completed=world.workshop.stage+world.projects.length;
  return {world,completed,next:PROJECTS[completed]||null,balance:earned.filter(h=>!spent.has(h.id)).length,earned:earned.length,complete:completed===PROJECTS.length};
}
export function workshopState(state) {
  const chapter=chapterState(state);
  return {...chapter.world.workshop,earned:chapter.earned,balance:chapter.balance};
}
export function purchaseProject(state,id,choice,now=Date.now()) {
  const chapter=chapterState(state),project=PROJECTS.find(p=>p.id===id),world=chapter.world;
  if(!project)throw new Error('Unknown village project.');
  if(id==='workshop'?world.workshop.stage:world.projects.some(p=>p.id===id))return state;
  if(chapter.next?.id!==id)throw new Error('Finish the current village project first.');
  if(project.choices&&!project.choices.includes(choice))throw new Error('Choose your preferred style first.');
  if(chapter.balance<project.cost)throw new Error('Not enough timber. Each fully completed eligible session earns 1 timber.');
  const spent=new Set([...world.workshop.spentRewardIds,...world.projects.flatMap(p=>p.rewardIds)]);
  const rewardIds=rewardedWorkouts(state.history).filter(h=>!spent.has(h.id)).slice(0,project.cost).map(h=>h.id);
  const next=id==='workshop'?{...world,workshop:{stage:1,spentRewardIds:rewardIds,restoredAt:now}}:{...world,projects:[...world.projects,{id,choice:project.choices?choice:null,rewardIds,completedAt:now}]};
  return {...state,world:next,updatedAt:now};
}
export function restoreWorkshop(state,now=Date.now()) { return purchaseProject(state,'workshop',null,now); }
export function chooseDiscovery(state,destination,now=Date.now()) {
  const world=migrateWorld(state);
  if(!['pond','watchtower'].includes(destination)||!world.projects.some(p=>p.id==='board'))throw new Error('Restore the noticeboard before choosing a discovery.');
  if(world.discovery.destination)return state;
  return {...state,world:{...world,discovery:{...world.discovery,destination}},updatedAt:now};
}
export function readDiscovery(state,id,now=Date.now()) {
  const chapter=chapterState(state);
  if(!PROJECTS.slice(0,chapter.completed).some(p=>p.id===id))throw new Error('This chapter memory is not available yet.');
  if(chapter.world.discovery.seen.includes(id))return state;
  return {...state,world:{...chapter.world,discovery:{...chapter.world.discovery,seen:[...chapter.world.discovery.seen,id]}},updatedAt:now};
}
export function validWorld(world,history,frozenRewardIds=[]) {
  if(!world||world.schemaVersion!==2||!world.workshop||!Array.isArray(world.projects)||world.projects.length>5||!world.discovery)return false;
  const w=world.workshop,ids=new Set([...rewardedWorkouts(history).map(h=>h.id),...frozenRewardIds]),used=[];
  const rewards=(values,n)=>Array.isArray(values)&&values.length===n&&values.every(id=>typeof id==='string'&&ids.has(id)&&(used.push(id),true));
  if(![0,1].includes(w.stage)||!rewards(w.spentRewardIds,w.stage)||(w.stage===0?w.restoredAt!==null:!Number.isFinite(w.restoredAt)||w.restoredAt<0))return false;
  if(!w.stage&&world.projects.length)return false;
  for(const [i,p] of world.projects.entries()){
    const spec=PROJECTS[i+1];
    if(!p||p.id!==spec.id||!Number.isFinite(p.completedAt)||p.completedAt<0||!rewards(p.rewardIds,spec.cost)||(spec.choices?!spec.choices.includes(p.choice):p.choice!==null))return false;
  }
  const d=world.discovery;
  return new Set(used).size===used.length&&[null,'pond','watchtower'].includes(d.destination)&&(!d.destination||world.projects.some(p=>p.id==='board'))&&Array.isArray(d.seen)&&new Set(d.seen).size===d.seen.length&&d.seen.every(id=>PROJECTS.slice(0,w.stage+world.projects.length).some(p=>p.id===id));
}
// One source of truth for the earning rule and its human-readable outcome.
export const TIMBER_RULE='Complete one entire 3-minute small step or 7, 10, 15 or 20-minute real session to earn 1 timber. Let the timer finish automatically; all scheduled movement must be completed. Previews, skipped activity and early-ended sessions earn no timber. Pausing and suitable replacements are allowed.';
export function rewardOutcome(record){
 if(record.mode==='preview')return {earned:0,reason:'Preview only: no exercise or timber is recorded.'};
 if(rewardedWorkouts([record]).length)return {earned:1,reason:'Session complete. 1 timber earned. Visit the workshop when ready.'};
 const planned=(record.segments||[]).filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0),actual=(record.movements||[]).reduce((n,m)=>n+m.actualMs,0);
 if(!record.activeMs)return {earned:0,reason:'Session saved; no movement time was recorded, so no timber was earned. Your village progress is unchanged.'};
 if(actual<planned)return {earned:0,reason:`Your activity is saved: ${Math.round(actual/1000)} of ${Math.round(planned/1000)} seconds of scheduled movement. No timber was earned for this partial session. Your village progress is unchanged.`};
 return {earned:0,reason:'Your activity is saved. No timber: the session ended before the final countdown finished. Your village progress is unchanged.'};
}
