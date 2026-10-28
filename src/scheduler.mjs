import { compose } from './composition.mjs';
import { EXERCISES, MINUTES, SESSION_MINUTES, exercise, enabledExercise, recoveryConfig, planningMetadata, normaliseFocus, SESSION_FOCUSES } from './catalog.mjs';
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
    else if(!fits(e,planningMetadata(e,settings).minSeconds*1000,r,c)){status='limit';reason='Not enough rolling movement or joint-exposure allowance for a block';}
    else if(!enabledExercise(e.id,settings)){status='disabled';reason='Not enabled';}
    return {...e,status,reason,availableAt,hold:r.discomfort[e.id]||null};
  });
}
export const eligibleExercises=(history=[],now=Date.now(),settings={})=>exerciseEligibility(history,now,settings).filter(e=>e.status==='eligible');
export function planSession(minutes,history=[],now=Date.now(),settings={}) {
  if(!SESSION_MINUTES.includes(minutes))throw new Error('Choose the three-minute small step, or 7, 10, 15 or 20 minutes.');
  const small=minutes===3, lengths=small?[3]:MINUTES;
  const focus=small?'recovery':normaliseFocus(settings.sessionFocus),load=recovery(history,now,settings),config=recoveryConfig(settings);
  const choices=exerciseEligibility(history,now,settings),eligible=choices.filter(e=>e.status==='eligible');
  const pool=eligible.filter(e=>focus==='core'?e.focus==='core':focus==='recovery'?['activation','mobility'].includes(e.loadKind):true);
  const enabled=EXERCISES.filter(e=>enabledExercise(e.id,settings)&&(focus!=='core'||e.focus==='core'));
  const build=m=>focus==='cardio'&&!pool.some(e=>e.loadKind==='aerobic')?null:compose(m,pool,load,config,settings,focus,{fits,add});
  const selected=build(minutes),plans=new Map([[minutes,selected]]);
  for(const m of lengths)if(m!==minutes)plans.set(m,build(m));
  const availableMinutes=lengths.filter(m=>plans.get(m));
  const reason=selected?'':small?'A three-minute step needs enough individually enabled activation or mobility in one position, within your recovery limits. Review movements or rest.':focus==='recovery'&&!pool.length?'No eligible activation or mobility movements remain for recovery focus. Choose another focus or rest.':!enabled.length?(focus==='core'?'No core movements enabled. Review appropriate core candidates individually or choose balanced focus.':'No movements enabled. Review and explicitly enable suitable candidates.'):focus==='cardio'&&!pool.some(e=>e.loadKind==='aerobic')?'No eligible aerobic movement remains for cardio focus. Choose another focus or rest.':availableMinutes.length?'Not enough eligible movement time for this length. Choose a shorter available session or rest.':pool.length?'Not enough suitable movement time remains for seven minutes under the current block/rest and exposure limits. Review your choices or rest.':'Enabled movements are recovering, flagged, or at their rolling activity limit. Not enough suitable time remains for seven minutes. Rest or review your choices.';
  const summary={strength:0,activation:0,mobility:0,aerobic:0};
  for(const b of selected?.segments||[])if(b.kind==='work')summary[exercise(b.exerciseId).loadKind]+=b.durationMs;
  const notes=[];
  if(choices.some(e=>e.focus==='core'&&e.loadKind==='strength'&&enabledExercise(e.id,settings)&&e.status==='recovering'))notes.push('Core strengthening is recovering from your previous session.');
  if(choices.some(e=>e.focus!=='core'&&e.loadKind==='strength'&&enabledExercise(e.id,settings)&&e.status==='recovering'))notes.push('Other strengthening is recovering from your previous session.');
  if(choices.some(e=>enabledExercise(e.id,settings)&&e.status==='limit'))notes.push('Rolling movement or joint-exposure allowances limit the available options.');
  if(choices.some(e=>enabledExercise(e.id,settings)&&e.status==='discomfort'))notes.push('Movements associated with discomfort are excluded until reassessed.');
  let label=small?'A smaller step':SESSION_FOCUSES[focus];
  if(small)notes.push('Activation and mobility only; not a promise of symptom prevention. The same recovery limits apply.');
  if(selected&&focus==='balanced'&&(!summary.strength||!summary.aerobic)){label=summary.strength?'Strength & mobility':summary.aerobic?'Movement & mobility':'Activation & mobility';notes.push('A balanced strength/aerobic mix is unavailable; this is an alternative composition.');}
  if(selected&&focus==='balanced'&&summary.strength&&summary.aerobic>0&&summary.aerobic<120000){label='Strength with brief movement';notes.push('Only brief marching fits. This is primarily a strength/activation session, not sustained aerobic work.');}
  if(selected&&focus==='core'&&!summary.strength){label='Core activation & mobility';notes.push('No core strengthening is included. Gentle activation is not a strength-equivalent substitute.');}
  if(selected&&!selected.segments.some(b=>b.phase==='warmup'))notes.push('No suitable active preparation is available; setup is a passive countdown, not a warm-up.');
  return {segments:selected?.segments||null,availableMinutes,reason,summary,focus,label,notes,score:selected?.score??null,alternativeFocus:!small&&!selected&&focus!=='balanced'&&compose(minutes,eligible,load,config,settings,'balanced',{fits,add})?'balanced':null};
}
