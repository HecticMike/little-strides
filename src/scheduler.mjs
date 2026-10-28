import { EXERCISES, MINUTES, exercise, enabledExercise, recoveryConfig } from './catalog.mjs';
export function recovery(history,now=Date.now(),settings={}) {
  const config=recoveryConfig(settings),until={},used={},strength={},jointsUntil={},flagged={},musclesUntil={},jointUsed={},discomfort={};
  const hold=(id,at,source)=>{if(at<=now&&!(settings.exerciseReassessedAt?.[id]>=at)&&(!discomfort[id]||discomfort[id].at<=at))discomfort[id]={at,source};};
  for(const [id,at] of Object.entries(settings.exerciseHolds||{}))hold(id,at,'Flagged in exercise choices');
  for(const h of history){
    if(h.mode==='preview')continue;
    const report=h.discomfort||(h.feedback?.comfort==='discomfort'?{at:h.feedback.updatedAt,joints:h.feedback.joints}:null);
    if(report&&report.at<=now){
      const affected=report.joints.length?EXERCISES.filter(e=>e.joints.some(j=>report.joints.includes(j))).map(e=>e.id):[...new Set(h.movements?h.movements.filter(m=>m.actualMs>0).map(m=>m.exerciseId):h.activeMs>0?h.segments.filter(b=>b.kind==='work').map(b=>b.exerciseId):[])];
      for(const id of affected){hold(id,report.at,'Reported session discomfort');flagged[id]=Math.max(flagged[id]||0,report.at+config.discomfortHours*3600_000);}
      for(const j of report.joints)jointsUntil[j]=Math.max(jointsUntil[j]||0,report.at+config.discomfortHours*3600_000);
    }
    if(h.movements){
      for(const m of h.movements){
        if(m.actualMs<=0)continue;
        const e=exercise(m.exerciseId),end=m.endedAt||h.endedAt;if(!e||end>now)continue;
        if(e.loadKind==='strength'){
          until[e.group]=Math.max(until[e.group]||0,end+config.strengthHours*3600_000);
          for(const muscle of e.muscles||[])musclesUntil[muscle]=Math.max(musclesUntil[muscle]||0,end+config.strengthHours*3600_000);
        }
        if(end>now-config.windowHours*3600_000){
          used[e.id]=(used[e.id]||0)+m.actualMs;
          if(e.loadKind==='strength')strength[e.group]=(strength[e.group]||0)+m.actualMs;
          for(const j of e.joints)jointUsed[j]=(jointUsed[j]||0)+m.actualMs;
        }
      }
    }else if(h.activeMs>0&&h.endedAt<=now){
      // Older records cannot honestly be split by movement or purpose.
      for(const group of h.groups||[])if(group!=='mobility')until[group]=Math.max(until[group]||0,h.endedAt+config.strengthHours*3600_000);
      if(h.endedAt>now-config.windowHours*3600_000)for(const id of new Set(h.segments.filter(b=>b.kind==='work').map(b=>b.exerciseId))){
        used[id]=(used[id]||0)+h.activeMs;
        for(const j of exercise(id)?.joints||[])jointUsed[j]=(jointUsed[j]||0)+h.activeMs;
      }
    }
  }
  return {until,used,strength,jointsUntil,flagged,musclesUntil,jointUsed,discomfort,resting:Object.keys(until).filter(g=>until[g]>now)};
}
const fits=(e,ms,load,c)=>(e.loadKind==='strength'?(load.strength[e.group]||0)+ms<=c.maxStrengthSeconds*1000:(load.used[e.id]||0)+ms<=c.maxRepeatableSeconds*1000)&&e.joints.every(j=>(load.jointUsed[j]||0)+ms<=c.maxJointSeconds*1000);
const add=(e,ms,load)=>{load.used[e.id]=(load.used[e.id]||0)+ms;if(e.loadKind==='strength')load.strength[e.group]=(load.strength[e.group]||0)+ms;for(const j of e.joints)load.jointUsed[j]=(load.jointUsed[j]||0)+ms;};
export function capacityFits(movements,history,now,settings){
  const load=recovery(history,now,settings),c=recoveryConfig(settings);
  for(const m of movements){const e=exercise(m.exerciseId);if(!e||!fits(e,m.actualMs,load,c))return false;add(e,m.actualMs,load);}return true;
}
export function exerciseEligibility(history=[],now=Date.now(),settings={}){
  const r=recovery(history,now,settings),c=recoveryConfig(settings);
  return EXERCISES.map(e=>{
    const strengthUntil=e.loadKind==='strength'?Math.max(r.until[e.group]||0,...(e.muscles||[]).map(m=>r.musclesUntil[m]||0)):0;
    const jointUntil=Math.max(0,...e.joints.map(j=>r.jointsUntil[j]||0));
    let status='eligible',reason='Eligible under your current choices';let availableAt=null;
    if(!e.selectable){status='locked';reason='Locked pending suitability and artwork review';}
    else if(r.discomfort[e.id]){status='discomfort';reason='Discomfort hold: reassess this movement before enabling it';}
    else if(strengthUntil>now){status='recovering';reason='Strength recovery';availableAt=strengthUntil;}
    else if(jointUntil>now){status='recovering';reason='Minimum hold after reported joint discomfort';availableAt=jointUntil;}
    else if(!fits(e,45_000,r,c)){status='limit';reason='Not enough rolling movement or joint-exposure allowance for a block';}
    else if(!enabledExercise(e.id,settings)){status='disabled';reason='Not enabled';}
    return {...e,status,reason,availableAt,hold:r.discomfort[e.id]||null};
  });
}
export const eligibleExercises=(history=[],now=Date.now(),settings={})=>exerciseEligibility(history,now,settings).filter(e=>e.status==='eligible');
function generate(minutes,history,now,settings){
  const load=recovery(history,now,settings),c=recoveryConfig(settings),pool=eligibleExercises(history,now,settings);
  const segments=[{kind:'prepare',exerciseId:null,durationMs:30_000}];let previousPosition='standing',lastPattern=null;
  for(let i=0;i<minutes-1;i++){
    const choices=pool.filter(e=>fits(e,45_000,load,c));
    choices.sort((a,b)=>(i===1?(a.loadKind!=='strength')-(b.loadKind!=='strength'):0)||(i===1?Number(!(a.loadKind==='strength'&&a.muscles?.includes('trunk')))-Number(!(b.loadKind==='strength'&&b.muscles?.includes('trunk'))):0)||(a.position!==previousPosition)-(b.position!==previousPosition)||((a.pattern||a.id)===lastPattern)-((b.pattern||b.id)===lastPattern)||((load.used[a.id]||0)-(load.used[b.id]||0)));
    const e=choices[0];if(!e)return null;
    segments.push({kind:'work',exerciseId:e.id,durationMs:45_000},{kind:'rest',exerciseId:e.id,durationMs:15_000});
    add(e,45_000,load);previousPosition=e.position;lastPattern=e.pattern||e.id;
  }
  segments.push({kind:'cooldown',exerciseId:null,durationMs:30_000});return segments;
}
export function planSession(minutes,history=[],now=Date.now(),settings={}){
  if(!MINUTES.includes(minutes))throw new Error('Choose 7, 10, 15 or 20 minutes.');
  const plans=new Map(MINUTES.map(m=>[m,generate(m,history,now,settings)])),segments=plans.get(minutes),availableMinutes=MINUTES.filter(m=>plans.get(m));
  const enabled=EXERCISES.filter(e=>enabledExercise(e.id,settings));
  const reason=segments?'':!enabled.length?'No movements enabled. Review and explicitly enable suitable candidates.':availableMinutes.length?'Not enough eligible movement time for this length. Choose a shorter available session or rest.':'Enabled movements are recovering, flagged, or at their rolling activity limit. Not enough suitable time remains for seven minutes. Rest or review your choices.';
  return {segments,availableMinutes,reason};
}