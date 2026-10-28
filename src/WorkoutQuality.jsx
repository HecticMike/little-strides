import React, { useEffect, useRef } from 'react';
import { EXERCISES, JOINTS, recoveryConfig } from './catalog.mjs';
import {exerciseEligibility,planSession} from './scheduler.mjs';
import {activityTotals,minutesOf} from './activity.mjs';
export function ExerciseReview({ settings, history=[], now=Date.now(), onToggle, onFlag, onRecovery, onAccept, onCancel, busy, purpose }) {
  const ref=useRef();useEffect(()=>{ref.current.showModal();},[]);
  const config=recoveryConfig(settings),choices=exerciseEligibility(history,now,settings),plan=planSession(10,history,now,settings);
  return <dialog ref={ref} className="exercise-review" aria-labelledby="review-title" onCancel={e=>{e.preventDefault();onCancel();}}>
    <h2 id="review-title">Review this unreviewed routine</h2><p>Nothing is enabled automatically. User opt-in is not clinical approval. No candidate here has professional approval recorded. Wall-push and squat remain locked.</p>
    <div className="exercise-options">{['Core & Strength','Cardio & Movement','Mobility & Recovery'].map(category=><section key={category} aria-label={category}><h3>{category}</h3>{category==='Core & Strength'&&<p className="small muted">No selectable core exercise is available. The current catalogue cannot provide a core or full-body strength routine.</p>}{choices.filter(e=>e.category===category).sort((a,b)=>Number(b.selectable)-Number(a.selectable)).map(e=><article key={e.id}>
      <label><input type="checkbox" aria-label={'Enable '+e.name} checked={(settings.enabledExercises||[]).includes(e.id)&&e.selectable&&!e.hold} disabled={busy||!e.selectable||!!e.hold} onChange={event=>onToggle(e.id,event.target.checked)}/><strong>{e.name}</strong></label>
      <span className="pill">{!e.selectable?'Locked · pending review':e.hold?'Held · reassessment needed':(settings.enabledExercises||[]).includes(e.id)?'Unreviewed · user-enabled':'Unreviewed · opt-in required'}</span><p>{e.cue}</p><p className="small muted">{e.considerations}</p>
      <details><summary>Purpose, loading and artwork</summary><p className="small">{e.loadKind} · {e.pattern} · {e.position} · {e.muscles.join(', ')}. Joints: {e.joints.join(', ')}. Artwork: {e.artStatus}. Pacing does not measure repetitions.</p></details>
      {!['eligible','disabled','locked'].includes(e.status)&&<p className="small" role="status">{e.reason}{e.availableAt?' until '+new Date(e.availableAt).toLocaleString():''}.</p>}
      {e.selectable&&(e.hold?<button disabled={busy} aria-label={'Reassess '+e.name} onClick={()=>{if(confirm('Reassess '+e.name+'? This clears the review hold but does not approve or enable the exercise. Recovery and recent joint-discomfort limits still apply.'))onFlag(e.id,false);}}>Reassess movement</button>:<button disabled={busy} aria-label={'Flag '+e.name+' as uncomfortable'} onClick={()=>onFlag(e.id,true)}>Flag as uncomfortable</button>)}
    </article>)}</section>)}</div>
    <details><summary>Conservative recovery settings</summary><p className="small">These configurable limits do not guarantee safety or assess readiness.</p>
      <label>Strength recovery<select aria-label="Strength recovery hours" disabled={busy} value={config.strengthHours} onChange={e=>onRecovery({...config,strengthHours:Number(e.target.value)})}>{[48,72,96].map(n=><option key={n} value={n}>{n} hours</option>)}</select></label>
      <label>Rolling repeatable limit<select aria-label="Repeatable limit minutes" disabled={busy} value={config.maxRepeatableSeconds/60} onChange={e=>onRecovery({...config,maxRepeatableSeconds:Number(e.target.value)*60})}>{[5,10,15,20].map(n=><option key={n} value={n}>{n} min per movement / 24h</option>)}</select></label>
      <label>Rolling joint-exposure limit<select aria-label="Joint exposure limit minutes" disabled={busy} value={config.maxJointSeconds/60} onChange={e=>onRecovery({...config,maxJointSeconds:Number(e.target.value)*60})}>{[5,10,15,20].map(n=><option key={n} value={n}>{n} min timed exposure per joint / 24h</option>)}</select></label>
      <p className="small muted">Strength: up to {config.maxStrengthSeconds} seconds per group / 24h. Reported joint discomfort has a minimum {config.discomfortHours}-hour hold and stays excluded until reassessed. All current candidates are standing; no equipment required.</p>
    </details>
    {!plan.segments&&<p className="small" role="status">10-minute session: {plan.reason}{plan.availableMinutes.length?' Available: '+plan.availableMinutes.join(', ')+' minutes.':''}</p>}
    <div className="review-actions"><button disabled={busy||(purpose!=='settings'&&!choices.some(e=>e.status==='eligible'))} className="primary" onClick={onAccept}>{purpose==='settings'?'Save choices':'Use enabled movements'}</button><button disabled={busy} onClick={onCancel}>Go back</button></div>
  </dialog>;
}
export function MovementRecord({record}) {
  if(!record.movements)return <p className="small muted">Legacy record: exact movement outcomes were not recorded.</p>;
  return <details className="movement-record"><summary>Completed and skipped movements</summary>{record.movementAccounting==='legacy-estimate'&&<p className="small muted">Legacy session: movement times are conservative estimates.</p>}<ul>{record.movements.map((m,i)=><li key={i}><strong>{EXERCISES.find(e=>e.id===m.exerciseId)?.name}</strong><span>{m.exerciseId!==m.plannedExerciseId?'Replaces planned '+EXERCISES.find(e=>e.id===m.plannedExerciseId)?.name+' · ':''}{m.status} · {Math.round(m.actualMs/1000)} / {Math.round(m.plannedMs/1000)} s timed{m.skippedMs?' · '+Math.round(m.skippedMs/1000)+' s skipped':''}</span></li>)}</ul><p className="small muted">Repetition pacing is a cue. Actual repetitions were not measured or recorded.</p></details>;
}
export function SessionCompletion({record,rewarded,onFeedback,onDone,busy}) {
  const f=record.feedback,total=activityTotals([record]);
  return <section className="card completion" aria-label="Session completion"><h2>{record.completed?'Session complete':'Session saved'}</h2><p>{rewarded?'Session complete. 1 timber earned. Visit the workshop when ready.':'Session saved. No restoration reward earned.'}</p><p>{Math.round(record.activeMs/1000)} seconds of timed movement.</p><p className="small">Aerobic movement: {minutesOf(total.aerobicMs)} min · Strengthening: {minutesOf(total.strengthMs)} min · Mobility: {minutesOf(total.mobilityMs)} min</p>
    <p className="small">How did that feel? Optional, one tap.</p><div className="comfort-options">{[['comfortable','Comfortable'],['difficult','Too hard'],['discomfort','Discomfort']].map(([id,name])=><button key={id} disabled={busy} aria-pressed={f?.comfort===id} onClick={()=>onFeedback(id,id===f?.comfort?f.joints:[])}>{name}</button>)}</div>
    {f?.comfort==='discomfort'&&<details open><summary>Affected joints (optional)</summary><div className="joint-options">{JOINTS.map(j=><button key={j} disabled={busy} aria-pressed={f.joints.includes(j)} onClick={()=>onFeedback(f.comfort,f.joints.includes(j)?f.joints.filter(x=>x!==j):[...f.joints,j])}>{j}</button>)}</div></details>}
    {f&&<p className="small muted" role="status">Feedback saved on this device.</p>}{record.discomfort&&<p className="small muted">Discomfort holds stay in place until reassessed in exercise choices.</p>}<MovementRecord record={record}/><button className="primary" disabled={busy} onClick={onDone}>Done</button>
  </section>;
}