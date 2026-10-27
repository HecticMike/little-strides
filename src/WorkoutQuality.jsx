import React, { useEffect, useRef } from 'react';
import { EXERCISES, JOINTS, recoveryConfig } from './catalog.mjs';
export function ExerciseReview({ settings, onToggle, onRecovery, onAccept, onCancel, busy, purpose }) {
  const ref=useRef();useEffect(()=>{ref.current.showModal();},[]);
  const config=recoveryConfig(settings);
  return <dialog ref={ref} className="exercise-review" aria-labelledby="review-title" onCancel={e=>{e.preventDefault();onCancel();}}>
    <h2 id="review-title">Review this unreviewed routine</h2><p>Nothing is enabled automatically. Enabling a candidate is your choice, not clinical approval. Wall-push and squat remain locked pending review.</p>
    <div className="exercise-options">{EXERCISES.map(e=><article key={e.id}>
      <label><input type="checkbox" aria-label={'Enable '+e.name} checked={(settings.enabledExercises||[]).includes(e.id)&&e.selectable} disabled={busy||!e.selectable} onChange={event=>onToggle(e.id,event.target.checked)}/><strong>{e.name}</strong></label>
      <span className="pill">{e.selectable?'Unreviewed · opt-in required':'Locked · pending review'}</span><p>{e.cue}</p><p className="small muted">{e.loadKind} · {e.position} · {e.considerations}</p><p className="small muted">Artwork: {e.artStatus}. Timed activity and pacing do not measure repetitions.</p>
    </article>)}</div>
    <details><summary>Conservative recovery settings</summary><p className="small">These configurable limits do not guarantee safety or assess readiness.</p>
      <label>Strength recovery<select aria-label="Strength recovery hours" disabled={busy} value={config.strengthHours} onChange={e=>onRecovery({...config,strengthHours:Number(e.target.value)})}>{[48,72,96].map(n=><option key={n} value={n}>{n} hours</option>)}</select></label>
      <label>Rolling repeatable limit<select aria-label="Repeatable limit minutes" disabled={busy} value={config.maxRepeatableSeconds/60} onChange={e=>onRecovery({...config,maxRepeatableSeconds:Number(e.target.value)*60})}>{[5,10,15,20].map(n=><option key={n} value={n}>{n} min per movement / 24h</option>)}</select></label>
      <p className="small muted">Strength: up to {config.maxStrengthSeconds} seconds per group in the rolling day; discomfort flags: {config.discomfortHours} hours. All current candidates are standing. No equipment required; a mat is optional and unused.</p>
    </details>
    <button disabled={busy||(purpose!=='settings'&&!(settings.enabledExercises||[]).some(id=>EXERCISES.find(e=>e.id===id)?.selectable))} className="primary" onClick={onAccept}>{purpose==='settings'?'Save choices':'Use enabled movements'}</button><button disabled={busy} onClick={onCancel}>Go back</button>
  </dialog>;
}
export function MovementRecord({record}) {
  if(!record.movements)return <p className="small muted">Legacy record: exact movement outcomes were not recorded.</p>;
  return <details className="movement-record"><summary>Completed and skipped movements</summary><ul>{record.movements.map((m,i)=><li key={i}><strong>{EXERCISES.find(e=>e.id===m.exerciseId)?.name}</strong><span>{m.exerciseId!==m.plannedExerciseId?'Replaces planned '+EXERCISES.find(e=>e.id===m.plannedExerciseId)?.name+' · ':''}{m.status} · {Math.round(m.actualMs/1000)} / {Math.round(m.plannedMs/1000)} s timed{m.skippedMs?' · '+Math.round(m.skippedMs/1000)+' s skipped':''}</span></li>)}</ul><p className="small muted">Repetition pacing is a cue. Actual repetitions were not measured or recorded.</p></details>;
}
export function SessionCompletion({record,rewarded,onFeedback,onDone,busy}) {
  const f=record.feedback;
  return <section className="card completion" aria-label="Session completion"><h2>{record.completed?'Session complete':'Session saved'}</h2><p>{rewarded?'Session complete. 1 timber earned. Visit the workshop when ready.':'Session saved. No restoration reward earned.'}</p><p>{Math.round(record.activeMs/1000)} seconds of timed movement.</p>
    <p className="small">How did that feel? Optional, one tap.</p><div className="comfort-options">{[['comfortable','Comfortable'],['difficult','Too hard'],['discomfort','Discomfort']].map(([id,name])=><button key={id} disabled={busy} aria-pressed={f?.comfort===id} onClick={()=>onFeedback(id,id===f?.comfort?f.joints:[])}>{name}</button>)}</div>
    {f?.comfort==='discomfort'&&<details open><summary>Affected joints (optional)</summary><div className="joint-options">{JOINTS.map(j=><button key={j} disabled={busy} aria-pressed={f.joints.includes(j)} onClick={()=>onFeedback(f.comfort,f.joints.includes(j)?f.joints.filter(x=>x!==j):[...f.joints,j])}>{j}</button>)}</div></details>}
    {f&&<p className="small muted" role="status">Feedback saved on this device.</p>}<MovementRecord record={record}/><button className="primary" disabled={busy} onClick={onDone}>Done</button>
  </section>;
}