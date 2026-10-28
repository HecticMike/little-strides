import React, { useEffect, useRef, useMemo } from 'react';
import { EXERCISES, JOINTS, recoveryConfig, SESSION_FOCUSES, normaliseFocus, planningMetadata } from './catalog.mjs';
import {exerciseEligibility,planSession} from './scheduler.mjs';
import {Icon} from './Icon.jsx';
import {rewardOutcome,TIMBER_RULE} from './gameplay.mjs';
import {activityTotals,minutesOf} from './activity.mjs';
export function ExerciseReview({ settings, history=[], now=Date.now(), onToggle, onFlag, onFocus, onRecovery, onAccept, onCancel, busy, purpose }) {
  const ref=useRef();useEffect(()=>{ref.current.showModal();},[]);
  const config=recoveryConfig(settings),choices=exerciseEligibility(history,now,settings),plan=useMemo(()=>planSession(purpose==='small-start'?3:10,history,now,settings),[history,settings,purpose,Math.floor(now/60000)]);
  return <dialog ref={ref} className="exercise-review" aria-labelledby="review-title" onCancel={e=>{e.preventDefault();onCancel();}}>
    <h2 id="review-title">Review this unreviewed routine</h2><p>Nothing is enabled automatically. User opt-in is not clinical approval. No candidate here has professional approval recorded. Wall-push, squat and the modified dead bug remain locked.</p><FocusSelect value={settings.sessionFocus} onChange={onFocus} disabled={busy} label="Routine focus"/>
    <div className="exercise-options">{['Core & Strength','Cardio & Movement','Mobility & Recovery'].map(category=><section key={category} aria-label={category}><h3>{category}</h3>{category==='Core & Strength'&&<p className="small muted">Core candidates require individual review and opt-in. Their illustrations are stylised and unvalidated; follow the written instructions. Artwork does not approve suitability. Gentle activation is not counted as strengthening or cardio.</p>}{choices.filter(e=>e.category===category).sort((a,b)=>Number(b.selectable)-Number(a.selectable)).map(e=><article key={e.id}>
      <label><input type="checkbox" aria-label={'Enable '+e.name} checked={(settings.enabledExercises||[]).includes(e.id)&&e.selectable&&!e.hold} disabled={busy||!e.selectable||!!e.hold} onChange={event=>onToggle(e.id,event.target.checked)}/><strong>{e.name}</strong></label>
      <span className="pill">{!e.selectable?'Locked · pending review':e.hold?'Held · reassessment needed':(settings.enabledExercises||[]).includes(e.id)?'Unreviewed · user-enabled':'Unreviewed · opt-in required'}</span><p>{e.cue}</p><p className="small muted">{e.considerations}</p>
      <details><summary>Purpose, loading and artwork</summary><p className="small">{e.loadKind} · {e.pattern} · {e.position} · {e.muscles.join(', ')}. Joints: {e.joints.join(', ')}. Artwork: {e.artStatus}. Pacing does not measure repetitions.</p><p className="small">Planning window: {planningMetadata(e,settings).minSeconds}–{planningMetadata(e,settings).maxSeconds}s; rest at least {planningMetadata(e,settings).restSeconds}s. Unreviewed software defaults, not a clinical dose. Joint time is a conservative exposure proxy, not equivalent force.</p>{e.instructions&&<ol>{e.instructions.map((step,i)=><li key={i}>{step}</li>)}</ol>}{e.purpose&&<p>{e.purpose}</p>}{e.pacing&&<p>{e.pacing}</p>}{e.shoulderAlternative&&<p>{e.shoulderAlternative}</p>}{e.assessment&&<p><strong>Individual assessment:</strong> {e.assessment}</p>}{e.sourceUrl&&<><a href={e.sourceUrl} target="_blank" rel="noreferrer">{e.sourceTitle} (online reference)</a><p className="small muted">{e.sourceContext} Source publication does not approve this app or your suitability.</p></>}</details>
      {!['eligible','disabled','locked'].includes(e.status)&&<p className="small" role="status">{e.reason}{e.availableAt?' until '+new Date(e.availableAt).toLocaleString():''}.</p>}
      {e.selectable&&(e.hold?<button disabled={busy} aria-label={'Reassess '+e.name} onClick={()=>{if(confirm('Reassess '+e.name+'? This clears the review hold but does not approve or enable the exercise. Recovery and recent joint-discomfort limits still apply.'))onFlag(e.id,false);}}>Reassess movement</button>:<button disabled={busy} aria-label={'Flag '+e.name+' as uncomfortable'} onClick={()=>onFlag(e.id,true)}>Flag as uncomfortable</button>)}
    </article>)}</section>)}</div>
    <details><summary>Conservative recovery settings</summary><p className="small">These configurable limits do not guarantee safety or assess readiness.</p>
      <label>Strength recovery<select aria-label="Strength recovery hours" disabled={busy} value={config.strengthHours} onChange={e=>onRecovery({...config,strengthHours:Number(e.target.value)})}>{[48,72,96].map(n=><option key={n} value={n}>{n} hours</option>)}</select></label>
      <label>Rolling repeatable limit<select aria-label="Repeatable limit minutes" disabled={busy} value={config.maxRepeatableSeconds/60} onChange={e=>onRecovery({...config,maxRepeatableSeconds:Number(e.target.value)*60})}>{[5,10,15,20].map(n=><option key={n} value={n}>{n} min per movement / 24h</option>)}</select></label>
      <label>Rolling joint-exposure limit<select aria-label="Joint exposure limit minutes" disabled={busy} value={config.maxJointSeconds/60} onChange={e=>onRecovery({...config,maxJointSeconds:Number(e.target.value)*60})}>{[5,10,15,20].map(n=><option key={n} value={n}>{n} min timed exposure per joint / 24h</option>)}</select></label>
      <p className="small muted">Strength: up to {config.maxStrengthSeconds} seconds per group / 24h. Reported joint discomfort has a minimum {config.discomfortHours}-hour hold and stays excluded until reassessed. Core candidates are floor-based; other movements are standing. No equipment required; mat optional.</p>
    </details>
    {!plan.segments&&<p className="small" role="status">{purpose==='small-start'?'3':'10'}-minute session: {plan.reason}{plan.availableMinutes.length?' Available: '+plan.availableMinutes.join(', ')+' minutes.':''}</p>}
    <div className="review-actions"><button disabled={busy||(purpose!=='settings'&&!choices.some(e=>e.status==='eligible'&&(purpose==='small-start'?['activation','mobility'].includes(e.loadKind):settings.sessionFocus!=='core'||e.focus==='core')))} className="primary" onClick={onAccept}>{purpose==='settings'?'Save choices':'Use enabled movements'}</button><button disabled={busy} onClick={onCancel}>Go back</button></div>
  </dialog>;
}
export function MovementRecord({record}) {
  if(!record.movements)return <p className="small muted">Legacy record: exact movement outcomes were not recorded.</p>;
  return <details className="movement-record"><summary>Completed and skipped movements</summary>{record.movementAccounting==='legacy-estimate'&&<p className="small muted">Legacy session: movement times are conservative estimates.</p>}<ul>{record.movements.map((m,i)=><li key={i}><strong>{EXERCISES.find(e=>e.id===m.exerciseId)?.name}</strong><span>{m.exerciseId!==m.plannedExerciseId?'Replaces planned '+EXERCISES.find(e=>e.id===m.plannedExerciseId)?.name+' · ':''}{m.status} · {Math.round(m.actualMs/1000)} / {Math.round(m.plannedMs/1000)} s timed{m.skippedMs?' · '+Math.round(m.skippedMs/1000)+' s skipped':''}</span></li>)}</ul><p className="small muted">Repetition pacing is a cue. Actual repetitions were not measured or recorded.</p></details>;
}
export function SessionCompletion({record,onFeedback,onDone,onVillage,busy,project}) {
  const f=record.feedback,total=activityTotals([record]),outcome=rewardOutcome(record);
  return <section className="card completion" aria-label="Session completion">
    <p className="eyebrow">{outcome.earned?'A LITTLE MORE LIGHT FOR HEARTHWOOD':'YOUR VILLAGE PROGRESS IS KEPT'}</p>
    <h2>{record.completed?'Session complete':'Session saved'}</h2><p>{outcome.reason}</p>
    <p>{Math.round(record.activeMs/1000)} seconds of timed movement.</p>
    <p className="small">How did that feel? Optional, one tap.</p><div className="comfort-options">{[['comfortable','Comfortable'],['difficult','Too hard'],['discomfort','Discomfort']].map(([id,name])=><button key={id} disabled={busy} aria-pressed={f?.comfort===id} onClick={()=>onFeedback(id,id===f?.comfort?f.joints:[])}>{name}</button>)}</div>
    {f?.comfort==='discomfort'&&<details open><summary>Affected joints (optional)</summary><div className="joint-options">{JOINTS.map(j=><button key={j} disabled={busy} aria-pressed={f.joints.includes(j)} onClick={()=>onFeedback(f.comfort,f.joints.includes(j)?f.joints.filter(x=>x!==j):[...f.joints,j])}>{j}</button>)}</div></details>}
    {f&&<p className="small muted" role="status">Feedback saved on this device.</p>}{record.discomfort&&<p className="small muted">Discomfort holds stay in place until reassessed in exercise choices.</p>}
    <button className="primary completion-done" disabled={busy} onClick={onDone}>Done</button>
    {outcome.earned>0&&onVillage&&<button disabled={busy} onClick={onVillage}>Use timber at the workshop</button>}
    {project&&<details className="completion-project"><summary>Use timber or preview your next project</summary>{project}</details>}
    <details><summary>Activity details</summary><p className="small">Aerobic movement: {minutesOf(total.aerobicMs)} min · Strengthening: {minutesOf(total.strengthMs)} min · Activation: {minutesOf(total.activationMs)} min · Mobility: {minutesOf(total.mobilityMs)} min</p><MovementRecord record={record}/></details>
    {!outcome.earned&&<details><summary>How to earn 1 timber</summary><p>{TIMBER_RULE}</p></details>}
  </section>;
}
export function FocusSelect({value,onChange,disabled,label='Session focus'}) {
  return <label className="focus-picker">{label}<select aria-label={label} value={normaliseFocus(value)} disabled={disabled} onChange={e=>onChange(e.target.value)}>{Object.entries(SESSION_FOCUSES).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>;
}
export function PlanPreview({plan,minutes}) {
  if(!plan.segments)return null;
  const active=plan.segments.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0),rest=minutes*60000-active,rows=[];
  for(const block of plan.segments){const previous=rows.at(-1);if(block.intentionalContinuation&&previous?.exerciseId===block.exerciseId){previous.durationMs+=block.durationMs;previous.winddownSeconds=block.durationMs/1000;}else rows.push({...block});}
  const clock=ms=>`${Math.floor(ms/60000)}:${String(ms/1000%60).padStart(2,'0')}`;
  return <details className="session-preview"><summary>View {plan.label.toLowerCase()} session · {minutes} min</summary><p>{clock(active)} movement · {clock(rest)} setup, rest and transitions</p><ol>{rows.map((b,i)=><li key={i}>{b.kind==='work'?exerciseName(b.exerciseId):b.label} · {b.durationMs/1000}s{b.phase==='warmup'?' · active preparation':b.phase==='winddown'?' · active wind-down':''}{b.winddownSeconds?` · final ${b.winddownSeconds}s active wind-down`:''}{b.intentionalInterval?' · repeated interval; limited alternatives':''}</li>)}</ol><p className="small muted">Pacing cues are not measured repetitions. Aerobic-labelled time does not confirm moderate intensity. Timing defaults require individual review.</p></details>;
}
const exerciseName=id=>EXERCISES.find(e=>e.id===id)?.name||'Movement';

export function RewardGoal({workshop,onVillage}){
 if(workshop.stage)return null;
 return <aside className="reward-goal" aria-label="Next village reward"><strong className="resource-heading"><Icon index={6}/>Restore the workshop: 1 timber</strong>{workshop.balance>0?<><p>{workshop.balance} timber ready. Open Village, tap Workshop, then choose Restore workshop.</p><button onClick={onVillage}>Go to Village</button></>:<><p>Finish one whole session to earn 1 timber — completing a single exercise is not enough.</p><details><summary>What counts as a whole session?</summary><p>{TIMBER_RULE}</p><p>Then open Village → Workshop → Restore workshop. Stopping early still saves your exercise history.</p></details></>}</aside>;
}
