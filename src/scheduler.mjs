import { EXERCISES, MINUTES, exercise, enabledExercise, recoveryConfig } from './catalog.mjs';
export function recovery(history,now=Date.now(),settings={}) {
  const config=recoveryConfig(settings), until={}, used={}, strength={}, jointsUntil={}, flagged={};
  for(const h of history){
    if(h.mode==='preview')continue;
    if(h.feedback?.comfort==='discomfort'&&!h.feedback.joints.length)for(const m of h.movements||[])if(m.actualMs>0)flagged[m.exerciseId]=Math.max(flagged[m.exerciseId]||0,h.feedback.updatedAt+config.discomfortHours*3600_000);
    if(h.feedback?.comfort==='discomfort')for(const joint of h.feedback.joints)jointsUntil[joint]=Math.max(jointsUntil[joint]||0,h.feedback.updatedAt+config.discomfortHours*3600_000);
    if(h.movements){
      for(const m of h.movements){
        if(m.actualMs<=0)continue;
        const e=exercise(m.exerciseId),end=m.endedAt||h.endedAt;
        if(end>now)continue;
        if(e.loadKind==='strength')until[e.group]=Math.max(until[e.group]||0,end+config.strengthHours*3600_000);
        if(end>now-config.windowHours*3600_000){used[e.id]=(used[e.id]||0)+m.actualMs;if(e.loadKind==='strength')strength[e.group]=(strength[e.group]||0)+m.actualMs;}
      }
    }else if(h.activeMs>0){
      // Old records lack movement-level timestamps: retain conservative group recovery.
      for(const group of h.groups||[])if(group!=='mobility')until[group]=Math.max(until[group]||0,h.endedAt+config.strengthHours*3600_000);
      if(h.endedAt>now-config.windowHours*3600_000)for(const id of new Set(h.segments.filter(b=>b.kind==='work').map(b=>b.exerciseId)))used[id]=(used[id]||0)+h.activeMs;
    }
  }
  return {until,used,strength,jointsUntil,flagged,resting:Object.keys(until).filter(g=>until[g]>now)};
}
export function eligibleExercises(history=[],now=Date.now(),settings={}) {
  const r=recovery(history,now,settings),config=recoveryConfig(settings);
  return EXERCISES.filter(e=>enabledExercise(e.id,settings)&&!(r.flagged[e.id]>now)&&!e.joints.some(j=>r.jointsUntil[j]>now)&&(e.loadKind!=='strength'||!(r.until[e.group]>now))&&(e.loadKind==='strength'?(r.strength[e.group]||0)<config.maxStrengthSeconds*1000:(r.used[e.id]||0)<config.maxRepeatableSeconds*1000));
}
function generate(minutes,history,now,settings){
  const r=recovery(history,now,settings),config=recoveryConfig(settings),pool=eligibleExercises(history,now,settings),used={...r.used},strength={...r.strength};
  const segments=[{kind:'prepare',exerciseId:null,durationMs:30_000}];let previousPosition='standing',last=null;
  for(let i=0;i<minutes-1;i++){
    const choices=pool.filter(e=>e.loadKind==='strength'?(strength[e.group]||0)+45_000<=config.maxStrengthSeconds*1000:(used[e.id]||0)+45_000<=config.maxRepeatableSeconds*1000);
    // Include strengthening when available; never use exhausted strength work as filler.
    choices.sort((a,b)=>(a.position!==previousPosition)-(b.position!==previousPosition)||(i===1?(a.loadKind!=='strength')-(b.loadKind!=='strength'):0)||(a.id===last)-(b.id===last)||((used[a.id]||0)-(used[b.id]||0)));
    const e=choices[0];if(!e)return null;
    segments.push({kind:'work',exerciseId:e.id,durationMs:45_000},{kind:'rest',exerciseId:e.id,durationMs:15_000});
    used[e.id]=(used[e.id]||0)+45_000;if(e.loadKind==='strength')strength[e.group]=(strength[e.group]||0)+45_000;
    previousPosition=e.position;last=e.id;
  }
  segments.push({kind:'cooldown',exerciseId:null,durationMs:30_000});return segments;
}
export function planSession(minutes,history=[],now=Date.now(),settings={}){
  if(!MINUTES.includes(minutes))throw new Error('Choose 7, 10, 15 or 20 minutes.');
  const plans=new Map(MINUTES.map(m=>[m,generate(m,history,now,settings)])),segments=plans.get(minutes),availableMinutes=MINUTES.filter(m=>plans.get(m));
  const enabled=EXERCISES.filter(e=>enabledExercise(e.id,settings));
  const reason=segments?'':!enabled.length?'No movements enabled. Review and explicitly enable suitable candidates.':availableMinutes.length?'Not enough eligible movement time for this length. Choose a shorter available session or rest.':'Enabled movements are recovering, flagged, or at their rolling activity limit. Rest or review your choices.';
  return {segments,availableMinutes,reason};
}