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
  const initial=recovery(history,now,settings),c=recoveryConfig(settings),pool=eligibleExercises(history,now,settings).filter(e=>settings.sessionFocus!=='core'||e.focus==='core');
  const profile=e=>JSON.stringify([e.position,[...e.joints].sort(),e.loadKind==='strength'?'strength:'+e.group:'repeatable']);
  const profiles=[...new Set(pool.map(profile))].map(key=>pool.filter(e=>profile(e)===key));
  const joints=[...new Set(pool.flatMap(e=>e.joints))].sort(),failed=new Set(),count=minutes-1;
  const slots=ms=>Math.max(0,Math.floor(ms/45000));
  function build(i,load,previousPosition,lastPattern){
    if(i===count)return [];
    const caps=profiles.map(es=>es[0].loadKind==='strength'?slots(c.maxStrengthSeconds*1000-(load.strength[es[0].group]||0)):es.reduce((n,e)=>n+slots(c.maxRepeatableSeconds*1000-(load.used[e.id]||0)),0));
    const jointCaps=joints.map(j=>slots(c.maxJointSeconds*1000-(load.jointUsed[j]||0))),remaining=count-i;
    const key=[remaining,...caps,...jointCaps].join(',');if(failed.has(key))return null;
    if(caps.reduce((n,x)=>n+x,0)<remaining)return null;
    for(let j=0;j<joints.length;j++)if(jointCaps[j]+profiles.reduce((n,es,k)=>n+(es[0].joints.includes(joints[j])?0:caps[k]),0)<remaining)return null;
    const choices=pool.filter(e=>fits(e,45000,load,c)),strengthSlot=i===1||(settings.sessionFocus==='core'&&i===4);
    choices.sort((a,b)=>(strengthSlot?(a.loadKind!=='strength')-(b.loadKind!=='strength'):0)||(strengthSlot?Number(!(a.loadKind==='strength'&&a.muscles?.includes('trunk')))-Number(!(b.loadKind==='strength'&&b.muscles?.includes('trunk'))):0)||(a.position!==previousPosition)-(b.position!==previousPosition)||((a.pattern||a.id)===lastPattern)-((b.pattern||b.id)===lastPattern)||((load.used[a.id]||0)-(load.used[b.id]||0)));
    // Equivalent profiles consume the same constraints. Keep the preferred
    // concrete movement, but backtrack between profiles before declaring shortage.
    const tried=new Set();
    for(const e of choices){
      const type=profile(e);if(tried.has(type))continue;tried.add(type);
      const next={used:{...load.used},strength:{...load.strength},jointUsed:{...load.jointUsed}};add(e,45000,next);
      const tail=build(i+1,next,e.position,e.pattern||e.id);
      if(tail)return [{kind:'work',exerciseId:e.id,durationMs:45000},{kind:'rest',exerciseId:e.id,durationMs:15000},...tail];
    }
    failed.add(key);return null;
  }
  const body=build(0,initial,settings.sessionFocus==='core'?'floor':'standing',null);
  return body?[{kind:'prepare',exerciseId:null,durationMs:30000},...body,{kind:'cooldown',exerciseId:null,durationMs:30000}]:null;
}
export function planSession(minutes,history=[],now=Date.now(),settings={}){
  if(!MINUTES.includes(minutes))throw new Error('Choose 7, 10, 15 or 20 minutes.');
  const plans=new Map(MINUTES.map(m=>[m,generate(m,history,now,settings)])),segments=plans.get(minutes),availableMinutes=MINUTES.filter(m=>plans.get(m));
  const enabled=EXERCISES.filter(e=>enabledExercise(e.id,settings)&&(settings.sessionFocus!=='core'||e.focus==='core'));
  const reason=segments?'':!enabled.length?(settings.sessionFocus==='core'?'No core movements enabled. Review appropriate core candidates individually or choose mixed focus.':'No movements enabled. Review and explicitly enable suitable candidates.'):availableMinutes.length?'Not enough eligible movement time for this length. Choose a shorter available session or rest.':'Enabled movements are recovering, flagged, or at their rolling activity limit. Not enough suitable time remains for seven minutes. Rest or review your choices.';
  const summary={strength:0,activation:0,mobility:0,aerobic:0};
  for(const b of segments||[])if(b.kind==='work')summary[exercise(b.exerciseId).loadKind]+=b.durationMs;
  return {segments,availableMinutes,reason,summary};
}