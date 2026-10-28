import {exercise} from './catalog.mjs';
export function activityTotals(records){
  const total={sessions:0,activeMs:0,aerobicMs:0,strengthMs:0,mobilityMs:0,unclassifiedMs:0};
  for(const h of records){
    if(h.mode==='preview')continue;
    if(h.completed&&h.activeMs>0)total.sessions++;
    total.activeMs+=h.activeMs;
    if(!h.movements){total.unclassifiedMs+=h.activeMs;continue;}
    for(const m of h.movements){const kind=exercise(m.exerciseId)?.loadKind;const key=kind==='aerobic'?'aerobicMs':kind==='strength'?'strengthMs':['mobility','activation'].includes(kind)?'mobilityMs':'unclassifiedMs';total[key]+=m.actualMs;}
  }return total;
}
export function activitySummary(history,now=Date.now()){
  const records=[...new Map(history.filter(h=>h.mode!=='preview'&&h.endedAt<=now).map(h=>[h.id,h])).values()];
  const day=new Date(now);day.setHours(0,0,0,0);const week=new Date(day);week.setDate(week.getDate()-(week.getDay()+6)%7);
  const recent=new Map();
  for(const m of records.flatMap(h=>h.movements||[]).filter(m=>m.actualMs>0).sort((a,b)=>b.endedAt-a.endedAt))if(!recent.has(m.exerciseId))recent.set(m.exerciseId,m);
  const discomfort=records.map(h=>h.discomfort||(h.feedback?.comfort==='discomfort'?{at:h.feedback.updatedAt,joints:h.feedback.joints}:null)).filter(Boolean);
  const joints={};for(const r of discomfort)for(const j of r.joints)joints[j]=(joints[j]||0)+1;
  return {today:activityTotals(records.filter(h=>h.endedAt>=day.getTime())),week:activityTotals(records.filter(h=>h.endedAt>=week.getTime())),all:activityTotals(records),recent:[...recent.values()].slice(0,6),discomfortReports:discomfort.length,joints};
}
export const minutesOf=ms=>(ms/60_000).toFixed(1);