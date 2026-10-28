import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { EXERCISES, EXERCISE_REVIEW_VERSION, planSession, eligibleExercises, performedMovements, setFeedback, setExerciseHold, canResumeSession, MINUTES, exercise, createSession, createPreviewSession, elapsed, duration, position, freeze, resume, restore, skip, replace, finish, recovery, progress, freshState, validateBackup } from './engine.mjs';
import { loadState, saveState, backup } from './storage.mjs';
import { avatarAtlas, avatarStage, avatarFrame, avatarFingerprint, CHARACTER } from './avatar.mjs';
import { Cues } from './audio.mjs';
import { ScreenLock } from './wake.mjs';
import { workshopState, restoreWorkshop } from './gameplay.mjs';
import { watchOffline } from './offline.mjs';
import { ExerciseReview, FocusSelect, PlanPreview, SessionCompletion, RewardGoal } from './WorkoutQuality.jsx';
import {Icon} from './Icon.jsx';
import { CoreIllustration } from './CoreIllustration.jsx';
import { enabledExercise } from './catalog.mjs';
import {Journal} from './Journal.jsx';
import './style.css';
import './functional.css';

const cues = new Cues(), wake = new ScreenLock();
const clock = ms => { const seconds = Math.ceil(Math.max(0, ms) / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };
const time = ms => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
function Avatar({ pose = 'stand', stage = 0, outfit = 'adventure' }) {
  const ref = useRef(), [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    Promise.all([avatarAtlas(),avatarAtlas(outfit)]).then(([canonical,atlas]) => {
      if (disposed) return;
      const ctx = ref.current.getContext('2d'), frame = avatarFrame(pose, stage);
      ctx.clearRect(0, 0, CHARACTER.frameWidth, CHARACTER.frameHeight); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(atlas, frame.x, frame.y, frame.w, frame.h, 0, 0, CHARACTER.frameWidth, CHARACTER.frameHeight);
      ref.current.dataset.avatarFingerprint = avatarFingerprint(canonical, stage);
      ref.current.dataset.outfitFingerprint = avatarFingerprint(atlas, stage);
      ref.current.dataset.ready = 'true'; setFailed(false);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [pose, stage, outfit]);
  return <><canvas className="avatar" ref={ref} width={CHARACTER.frameWidth} height={CHARACTER.frameHeight} role="img" data-outfit={outfit} data-avatar-id={CHARACTER.id} data-avatar-stage={CHARACTER.stages[stage].id} data-pose={pose} aria-label={CHARACTER.stages[stage].name + ' wayfarer: stylised ' + pose + ' pose'} />{failed && <span className="art-fallback">Artwork unavailable. Follow the written cue.</span>}</>;
}
function Village({ completed, workshop, onRestore, busy }) {
  const ref = useRef(), gameRef = useRef();
  const [interaction, setInteraction] = useState({ place: 'Training green', phase: 'idle' });
  const [ready, setReady] = useState(false);
  const stage = avatarStage(completed), place = interaction.place;
  useEffect(() => {
    let disposed = false;
    import('./village.mjs').then(async ({ createVillage }) => {
      if (disposed) return;
      const game = await createVillage(ref.current, stage, completed, info => { if (!disposed) { setInteraction(info); setReady(true); } }, workshop.stage);
      if (disposed) game.destroy(true); else gameRef.current = game;
    }).catch(() => { if (!disposed) setInteraction({ place: 'Village could not load. Your workouts are still available.', phase: 'error' }); });
    return () => { disposed = true; gameRef.current?.destroy(true); gameRef.current = null; };
  }, [completed, stage]);
  useEffect(() => { gameRef.current?.events.emit('workshop-stage', workshop.stage); }, [workshop.stage]);
  const visit = name => gameRef.current?.events.emit('visit', name);
  const closeWorkshop = () => { gameRef.current?.events.emit('dismiss-interaction'); setInteraction({ place: 'Training green', phase: 'idle' }); };
  return <section className="village-page">
    <p className="eyebrow">YOUR VILLAGE</p><h1>Hearthwood</h1>
    <div className="village-status"><span><Icon index={5} />{CHARACTER.stages[stage].name}</span><span><Icon index={6}/>{workshop.balance} timber</span></div>
    <div className="village-canvas" ref={ref} role="img" aria-label="Hearthwood pixel village. Tap a clear path to walk; tap a building to approach and interact." />
    <p className="muted village-hint">Tap a path to walk. The gold crest marks the workshop.</p>
    <div className="places">{['Training green', 'Garden', 'Workshop'].map(p => <button key={p} disabled={!ready} aria-pressed={place === p} onClick={() => visit(p)}>{p}</button>)}</div>
    <article className={'card workshop-card ' + (place === 'Workshop' ? 'workshop-panel' : '')} aria-live="polite"><div className="workshop-card-heading"><h2>{place}</h2>{place === 'Workshop' && <button className="text-button" aria-label="Close workshop" onClick={closeWorkshop}>Close</button>}</div>
      {interaction.phase === 'approaching' && <p>Walking to {place.toLowerCase()}…</p>}
      {place === 'Workshop' ? <>
        <p>{workshop.stage ? 'Workshop restored. A warm roof, lit windows and your guild banner. Saved on this device.' : 'Restore the roof, light the windows and raise your guild banner. Cost: 1 timber. Earn it by completing one whole real session; let its timer finish automatically.'}</p>
        <p className="workshop-balance"><Icon index={6}/>{workshop.balance} timber available</p>
        {!workshop.stage && <button className="primary" disabled={busy || interaction.phase !== 'arrived' || workshop.balance < 1} onClick={onRestore}>{workshop.balance ? 'Restore workshop · 1 timber' : 'Need 1 timber'}</button>}
      </> : <p>{place === 'Garden' ? completed + ' rewarded workouts have planted ' + Math.min(12, completed) + ' flowers. Your garden grows while you restore the workshop.' : 'Your next short workout starts in Today. Earn one timber per rewarded workout, then spend it at the workshop.'}</p>}
    </article>
    <p className="small muted">Beginner · Adventurer · Veteran. Character rewards are fictional; they do not measure your real body.</p>
  </section>;
}
function App() {
  const [data, setData] = useState(null), current = useRef(null);
  const [tab, setTab] = useState('Today'), [minutes, setMinutes] = useState(10);
  const [now, setNow] = useState(Date.now()), [error, setError] = useState('');
  const [notice, setNotice] = useState(''), [offline, setOffline] = useState(!navigator.onLine);
  const [offlineSetup, setOfflineSetup] = useState({ status: 'checking', message: '' }), [offlineAttempt, setOfflineAttempt] = useState(0), [install, setInstall] = useState(null);
  const cached = offlineSetup.status === 'ready';
  const [pendingReview, setPendingReview] = useState(null);
  const [completionId,setCompletionId] = useState(null), [sessionWarning,setSessionWarning] = useState('');
  const finishing = useRef(false);
  const [busy, setBusy] = useState(false), busyRef = useRef(false), [otherTab, setOtherTab] = useState(false);
  const [saving, setSaving] = useState(false), writes = useRef(0);
  const lastTick = useRef(Date.now()), lastSave = useRef(0), lastCue = useRef(''), importRef = useRef();
  const proposal=useMemo(()=>data&&!data.active?planSession(minutes,data.history,now,data.settings):null,[minutes,data?.history,data?.settings,!!data?.active,Math.floor(now/60000)]);
  const set = value => { current.current = value; setData(value); };
  async function commit(value, optimistic = true) {
    if (optimistic) set(value);
    writes.current++; setSaving(true);
    try { await saveState(value); if (!optimistic) set(value); setError(''); return true; }
    catch {
      const s = current.current;
      const safe = s.active ? { ...s, active: freeze(s.active, Math.min(Date.now(),lastTick.current), 'interrupted') } : s;
      set(safe); wake.release();
      setError('Local saving failed. ' + (s.active ? 'Your workout is paused. ' : 'Your change is not confirmed as saved. ') + 'Export a backup or retry saving before continuing.');
      return false;
    }
    finally { writes.current--; if (!writes.current) setSaving(false); }
  }
  function interrupt(at = Math.min(Date.now(),lastTick.current)) {
    if(finishing.current)return;
    const s = current.current;
    if (s?.active?.status === 'running') {
      lastCue.current = '';
      void commit({ ...s, active: freeze(s.active, at, 'interrupted'), updatedAt: at });
      wake.release();
    }
  }
  cues.onInterruption = () => interrupt();
  useEffect(() => {
    let releaseLock;
    const boot = async () => {
      try {
        const s = await loadState();
        const restored = { ...s, active: restore(s.active) };
        set(restored); await commit(restored);
        navigator.storage?.persist?.().catch(() => {});
      } catch { setError('Local data could not be opened. Retry loading; existing data has not been replaced.'); }
    };
    if (navigator.locks) navigator.locks.request('little-strides-writer', { ifAvailable: true }, async lock => {
      if (!lock) { setOtherTab(true); return; }
      await boot(); await new Promise(resolve => { releaseLock = resolve; });
    }).catch(() => setError('Could not open local storage. Reload to retry.'));
    else void boot();
    const connectivity = () => setOffline(!navigator.onLine);
    const visibility = () => {
      if (document.hidden) interrupt();
      else { lastTick.current = Date.now(); if (current.current?.active?.status === 'running') void wake.acquire(); }
    };
    const pagehide = () => interrupt();
    const offerInstall = e => { e.preventDefault(); setInstall(e); };
    window.addEventListener('online', connectivity); window.addEventListener('offline', connectivity);
    document.addEventListener('visibilitychange', visibility); window.addEventListener('pagehide', pagehide);
    window.addEventListener('beforeinstallprompt', offerInstall);
    return () => {
      releaseLock?.(); wake.release();
      window.removeEventListener('online', connectivity); window.removeEventListener('offline', connectivity);
      document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('beforeinstallprompt', offerInstall);
    };
  }, []);
  useEffect(() => {
    if (import.meta.env.PROD) return watchOffline(setOfflineSetup, __BUILD_ID__);
    setOfflineSetup({ status: 'error', message: 'Offline caching is available in the production build. Run npm run build and npm run preview.' });
  }, [offlineAttempt]);
  useEffect(() => {
    const timer = setInterval(() => {
      const t = Date.now(), previous = lastTick.current;
      lastTick.current = t; setNow(t);
      const s = current.current;
      if (!s?.active || s.active.status !== 'running') return;
      if (t - previous > 2500 || t < previous) { interrupt(previous); return; }
      const p = position(s.active, t);
      if (p.done) {
        if (finishing.current) return;
        finishing.current = true; wake.release();
        const stopped={...s,active:freeze(s.active,t)};set(stopped);
        const next = finish(stopped, true, t);
        void commit(next, false).then(saved => {
          if (saved) {cues.play('transition');setCompletionId(s.active.mode==='preview'?null:s.active.id);setNotice(s.active.mode==='preview'?'Workflow preview finished. No exercise recorded or rewards granted.':progress(next.history) > progress(s.history) ? 'Session complete. 1 timber earned. Visit the workshop when ready.' : 'Session saved. No restoration reward earned.');}
          finishing.current = false;
        });
        return;
      }
      const cueKey = `${p.index}:${p.kind === 'work' ? p.rep : 0}`;
      if (cueKey !== lastCue.current) {
        if (lastCue.current) cues.play(cueKey.split(':')[0] !== lastCue.current.split(':')[0] ? 'transition' : 'pace');
        lastCue.current = cueKey;
      }
      if (t - lastSave.current >= 1000) {
        lastSave.current = t;
        void commit({ ...s, active: { ...s.active, checkpointAt: t }, updatedAt: t });
      }
    }, 250);
    return () => clearInterval(timer);
  }, []);
  async function action(fn) {
    if (busyRef.current) return;
    busyRef.current = true; setBusy(true);
    try { await fn(); } finally { busyRef.current = false; setBusy(false); }
  }
  async function begin() {
    if (!(current.current.settings.enabledExercises||[]).length) { setPendingReview('start'); return; }
    const proposal=planSession(minutes,current.current.history,Date.now(),current.current.settings);
    if (!proposal.segments) {setNotice(proposal.reason);return;}
    setCompletionId(null);setSessionWarning('');
    await cues.enable();
    cues.settings = current.current.settings;
    const t = Date.now(); lastTick.current = t; lastCue.current = '';
    const saved = await commit({ ...current.current, active: createSession(minutes, current.current.history, t, {settings:current.current.settings}), updatedAt: t });
    if (saved) { cues.play('transition'); void wake.acquire(); }
  }
  async function beginPreview(){
    if(current.current.active)return;
    setCompletionId(null);setSessionWarning('');setNotice('');await cues.enable();
    const at=Date.now();lastTick.current=at;lastCue.current='';
    if(await commit({...current.current,active:createPreviewSession(minutes,at),updatedAt:at})){cues.play('transition');void wake.acquire();}
  }
  async function toggle() {
    const s = current.current, t = Date.now();
    if (s.active.status === 'running') {
      wake.release(); await commit({ ...s, active: freeze(s.active, t), updatedAt: t });
    } else {
      const remaining=s.active.segments.slice(position(s.active).index).filter(b=>b.kind==='work');
      if (s.active.mode!=='preview'&&remaining.some(b=>!enabledExercise(b.exerciseId,s.settings))) {setSessionWarning('This saved plan contains disabled or pending-review movements. Skip or replace those blocks, or end it and start an eligible routine.');setPendingReview('resume');return;}
      if(!canResumeSession(s.active,s.history,t,s.settings)){setSessionWarning('A remaining movement is recovering, flagged or at its rolling limit. Replace or skip it, or end and generate a suitable routine.');return;}
      setSessionWarning('');
      await cues.enable();
      lastTick.current = Date.now(); lastCue.current = '';
      if (await commit({ ...current.current, active: resume(current.current.active), updatedAt: Date.now() })) void wake.acquire();
    }
  }
  async function acceptReview() {
    await cues.enable();
    const purpose = pendingReview;
    const next = { ...current.current, settings: { ...current.current.settings, exerciseReviewVersion: EXERCISE_REVIEW_VERSION }, updatedAt: Date.now() };
    if (await commit(next)) { setPendingReview(null); if (purpose === 'resume') {const remaining=next.active.segments.slice(position(next.active).index).filter(b=>b.kind==='work');if(remaining.every(b=>enabledExercise(b.exerciseId,next.settings)))await toggle();} else if(purpose!=='settings') await begin(); }
  }
  async function endWorkout() {
    if (!confirm(current.current.active.mode==='preview'?'End this workflow preview? Nothing will be recorded.':'End this session early? Your activity will be saved, but no timber is earned. A full session must finish automatically.')) return;
    const snapshot=current.current, at=Date.now(), id=snapshot.active.id;
    // Freeze synchronously so neither the checkpoint timer nor visibility events
    // can enqueue an old active snapshot after the final history write.
    const stopped={...snapshot,active:freeze(snapshot.active,at),updatedAt:at};
    set(stopped);wake.release();
    if(await commit(finish(stopped,false,at),false)){setCompletionId(snapshot.active.mode==='preview'?null:id);if(snapshot.active.mode==='preview')setNotice('Workflow preview finished. No exercise recorded or rewards granted.');}
  }
  async function replaceMovement() {
    const next=replace(current.current.active,Date.now(),{history:current.current.history,settings:current.current.settings});
    setSessionWarning(next.replacementMessage||'');await commit({...current.current,active:next});
  }
  async function feedback(id,comfort,joints) {await commit(setFeedback(current.current,id,comfort,joints),false);}
  async function restoreBuilding() {
    try {
      const next = restoreWorkshop(current.current);
      if (await commit(next, false)) setNotice('');
    } catch (e) { setNotice(e.message); }
  }
  function settings(change) {
    const next = { ...current.current, settings: { ...current.current.settings, ...change }, updatedAt: Date.now() };
    cues.settings = next.settings; void commit(next);
  }
  function exportData() {
    const next = { ...current.current, lastExportAt: Date.now() };
    const url = URL.createObjectURL(new Blob([backup(next)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `little-strides-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    void commit(next); setNotice('Backup download requested. Save the file somewhere safe.');
  }
  async function importData(file) {
    if (!file) return;
    try {
      if (file.size > 20_000_000) throw new Error('Backup is too large (maximum 20 MB).');
      const imported = validateBackup(JSON.parse(await file.text()));
      if (!confirm('Replace this device’s local history and interrupted session with this backup?')) return;
      const next = { ...imported, deviceId: current.current.deviceId, active: restore(imported.active), updatedAt: Date.now() };
      if (await commit(next)) { cues.settings = next.settings; setNotice('Backup restored on this device.'); }
    } catch (e) { setNotice(e instanceof SyntaxError ? 'That file is not valid JSON. Your data is unchanged.' : e.message); }
    finally { if (importRef.current) importRef.current.value = ''; }
  }
  if (otherTab) return <main className="loading"><h1>Already open</h1><p>Close the other Little Strides tab, then reload here to keep your progress safe.</p><button onClick={() => location.reload()}>Reload</button></main>;
  if (!data) return <main className="loading"><h1>Little Strides</h1><p>{error || 'Opening your village…'}</p>{error && <button onClick={() => location.reload()}>Retry loading</button>}</main>;
  cues.settings = data.settings;
  const count = progress(data.history), stage = avatarStage(count), s = data.active, workshop = workshopState(data);
  const p = s ? position(s, now) : null, e = p && !p.done ? exercise(p.exerciseId) : null;

  const completedRecord=data.history.find(h=>h.id===completionId);
  const audioControls = <div className="audio-controls">
    <button disabled={saving} aria-label={data.settings.muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={data.settings.muted} onClick={() => settings({ muted: !data.settings.muted })}>{data.settings.muted ? 'Sound off' : 'Sound on'}</button>
    <label>Volume<input aria-label="Cue volume" type="range" min="0" max="1" step="0.05" value={data.settings.volume} onChange={event => settings({ volume: Number(event.target.value) })} /></label>
  </div>;
  return <div className={`app ${s ? 'in-session' : ''}`}>
    {pendingReview && <ExerciseReview purpose={pendingReview} settings={data.settings} history={data.history} now={now} busy={busy||saving} onFlag={(id,flag)=>action(()=>commit(setExerciseHold(current.current,id,flag)))} onToggle={(id,on)=>settings({enabledExercises:on?[...new Set([...(current.current.settings.enabledExercises||[]),id])]:(current.current.settings.enabledExercises||[]).filter(x=>x!==id)})} onFocus={value=>settings({sessionFocus:value})} onRecovery={value=>settings({recovery:value})} onCancel={() => setPendingReview(null)} onAccept={() => action(acceptReview)} />}
    {error && <div className="error" role="alert">{error}<div className="row"><button onClick={() => action(() => commit(current.current))}>Retry saving</button><button onClick={exportData}>Export backup</button></div></div>}
    {s ? <main className="workout">
      <header className="workout-heading"><span className="brand">{s.mode === 'preview' ? 'PREVIEW · NO REWARDS' : 'LITTLE STRIDES'}</span><span className="pill">{clock(duration(s) - elapsed(s, now))} left</span></header>
      <section className="exercise-heading"><p className="eyebrow">{s.status === 'paused' ? 'PAUSED' : p?.kind === 'prepare' ? 'GET READY' : p?.kind === 'cooldown' ? 'WIND DOWN' : p?.kind === 'rest' ? 'REST / TRANSITION' : p?.phase==='warmup'?'ACTIVE PREPARATION':p?.phase==='winddown'?'ACTIVE WIND-DOWN':'TIMED MOVEMENT'}</p><h1>{p?.done ? 'All done' : p?.kind === 'prepare' ? 'Preparation' : p?.kind === 'cooldown' ? 'Wind down' : p?.kind === 'rest' ? 'Take a breath' : s.mode==='preview'?(p?.previewLabel||'Preview timer card'):e?.name}</h1></section>
      <div className="exercise-art">{s.mode==='preview'?<div className="text-only-art"><strong>Workflow preview</strong><p>No exercise is prescribed. Try the timer controls without performing a movement.</p></div>:p?.kind==='work'&&e?.illustration?<CoreIllustration id={e.illustration} name={e.name} stage={stage}/>:p?.kind==='work'&&(!e?.pose||e?.artStatus!=='stylised')?<div className="text-only-art"><strong>Text-only exercise</strong><p>No reliable demonstration is available. Read the written instructions and suitability notes; do not copy an unrelated character pose.</p></div>:<Avatar pose={p?.kind==='work'?e.pose:'stand'} stage={stage} outfit="training" />}<div className="countdown" role="timer" aria-label="Seconds remaining">{Math.ceil((p?.remainingMs || 0) / 1000)}<small>SEC</small></div><span className="pose-note">{s.mode==='preview'?'Workflow only · no records or rewards':p?.kind==='work'&&e?.illustration?'Illustration only · not a validated demonstration':p?.kind==='work'&&(!e?.pose||e?.artStatus!=='stylised')?'Demonstration unavailable · text instructions only':'Stylised pose · timed activity, not measured repetitions'}</span></div>
      <section className="workout-readout" aria-label="Exercise timing"><span className="reps">{p?.kind === 'work' ? s.mode==='preview'?'WORKFLOW PREVIEW':p.paceTotal?`PACE ${p.rep} / ${p.paceTotal}`:'SELF-PACED · NO REP TARGET' : p?.kind === 'prepare' ? 'PREPARATION' : p?.kind === 'cooldown' ? 'WIND DOWN' : `REST · ${(p?.durationMs||0)/1000} SEC`}</span><p>{s.mode==='preview'?'Workflow preview only. No exercise is prescribed or recorded.':p?.kind === 'prepare' ? 'Setup only: check your space and get ready for ' + (exercise(s.segments.find(b=>b.kind==='work')?.exerciseId)?.name||'your next movement') + '.' : p?.kind === 'cooldown' ? 'Movement finished. Settle comfortably; this countdown is not recorded activity.' : p?.kind === 'rest' ? (p.transition?'Change position comfortably; pause if you need longer. Next: ':'Rest. Next: ') + (exercise(s.segments.slice(p.index+1).find(b=>b.kind==='work')?.exerciseId)?.name||'wind down') + '.' : e?.cue}</p></section>
      <div className="workout-footer">
        {s.reason === 'interrupted' && <p className="recovery" role="status">{s.mode==='preview'?'Preview paused; nothing was recorded.':'Interrupted session saved. Time away was not counted. Resume when ready.'}</p>}
        {sessionWarning&&<div className="recovery" role="status">{sessionWarning}<button onClick={()=>setPendingReview('resume')}>Review choices and recovery</button></div>}{audioControls}
        <div className="workout-actions"><button disabled={busy || finishing.current || !!error} onClick={() => action(toggle)} className="primary">{s.status === 'running' ? 'Pause' : 'Resume'}</button><button disabled={busy || finishing.current || !!error} onClick={() => action(() => commit({ ...current.current, active: skip(current.current.active) }))}>Skip</button><button disabled={busy || finishing.current || !!error || p?.kind !== 'work' || p?.done} onClick={() => action(replaceMovement)}>Replace</button></div>
        <div className="session-meta"><button className="text-button" disabled={busy||finishing.current} onClick={() => action(endWorkout)}>End session</button><span>{s.status === 'running' ? wake.status : 'Resume to continue'}</span></div>
      </div>
    </main> : <>
      <header className="app-header"><a className="brand" href="./"><Icon index={0} />LITTLE STRIDES</a><span className="pill">{cached ? offline ? 'Offline' : 'Offline ready' : offlineSetup.status === 'error' ? 'Offline unavailable' : offlineSetup.status === 'update' ? 'Update ready' : 'Preparing offline'}</span></header>
      <main className="page" key={tab} data-tab={tab}>
        {offlineSetup.message && <div className="offline-warning" role="status">{offlineSetup.message}{offlineSetup.status === 'error' && <button onClick={() => setOfflineAttempt(n => n + 1)}>Retry offline setup</button>}</div>}
        {notice && !(tab==='Today'&&completedRecord) && <div className="notice" role="status">{notice}<button aria-label="Dismiss notice" onClick={() => setNotice('')}>×</button></div>}
        {tab === 'Today' && <>
          {completedRecord&&<SessionCompletion record={completedRecord} onVillage={!workshop.stage?()=>{setCompletionId(null);setNotice('');setTab('Village');}:undefined} busy={busy||saving} onFeedback={(comfort,joints)=>action(()=>feedback(completedRecord.id,comfort,joints))} onDone={()=>{setCompletionId(null);setNotice('');}}/>}
          <h1>Your next stride</h1><p className="intro milestone">{workshop.stage ? stage === 2 ? 'Workshop restored · Veteran outfit unlocked.' : 'Workshop restored · Next outfit in ' + ((stage + 1) * 3 - count) + ' complete sessions.' : workshop.balance ? workshop.balance + ' timber ready → Village → Workshop → Restore.' : 'Next: finish one whole session → earn 1 timber.'}</p>
          <div className="home-scene"><span className="scene-label">HEARTHWOOD · VILLAGE GREEN</span><Avatar stage={stage} /><span className="hero-stage"><Icon index={5} />{CHARACTER.stages[stage].name}</span></div>
          <section className="plan"><div className="row between"><h2>Choose your quest</h2><FocusSelect value={data.settings.sessionFocus} onChange={value=>settings({sessionFocus:value})} disabled={busy||saving}/></div><div className="duration-options" aria-label="Workout duration">{MINUTES.map(m => <button key={m} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>{m}<small>MIN</small></button>)}</div><button className="primary start" disabled={busy || !!error || ((data.settings.enabledExercises||[]).length>0&&!proposal.segments)} onClick={() => action(begin)}>{busy ? 'Preparing…' : 'Start ' + minutes + '-minute session'}<Icon index={0} /></button><p className="reward-promise">Finish this whole {minutes}-minute session to earn 1 timber.</p><p className="muted plan-description">{proposal.reason||proposal.label}</p>{proposal.notes.map(note=><p key={note} className="small muted">{note}</p>)}{proposal.alternativeFocus&&<button onClick={()=>settings({sessionFocus:proposal.alternativeFocus})}>Consider balanced focus</button>}<PlanPreview plan={proposal} minutes={minutes}/><button className="text-button review-link" onClick={()=>setPendingReview('settings')}>Review or disable movements</button>{!proposal.segments&&proposal.availableMinutes.filter(m=>m<minutes).length>0&&<div className="shorter-options">{proposal.availableMinutes.filter(m=>m<minutes).map(m=><button key={m} onClick={()=>setMinutes(m)}>Use {m} minutes</button>)}<p className="small muted">Or rest; no recovering movement is repeated to fill time.</p></div>}<button className="text-button review-link" disabled={busy||!!error} onClick={()=>action(beginPreview)}>Preview workflow — no exercise recorded</button><p className="small muted">{data.settings.sessionFocus==='core'?'Core focus: floor movements, mat optional.':'Review floor and standing movements individually.'}</p></section>
          <RewardGoal workshop={workshop} onVillage={()=>setTab('Village')}/><div className="progress-strip"><Icon index={4} /><div><strong>{count} little strides</strong><p>{workshop.balance + ' timber available · ' + CHARACTER.stages[stage].name}</p></div><span className="stage">{stage + 1}/3</span></div>
        </>}
        {tab === 'Village' && <Village completed={count} workshop={workshop} busy={busy || saving || !!error} onRestore={() => action(restoreBuilding)} />}
        {tab === 'Journal' && <Journal history={data.history} settings={data.settings} now={now}/>}
        {tab === 'Settings' && <><p className="eyebrow">MAKE YOURSELF AT HOME</p><h1>Your settings</h1><section className="card"><h2>Exercises and recovery</h2><p>Unreviewed candidates require individual opt-in. Wall-push and squat are locked pending review.</p><button onClick={()=>setPendingReview('settings')}>Review or disable movements</button></section><section className="card"><h2>Workout sound</h2>{audioControls}<button onClick={() => action(async () => { await cues.enable(); cues.play('transition'); setNotice(cues.status); })}>Test sound</button><label className="pace-option"><input aria-label="Pacing sound" type="checkbox" checked={!data.settings.paceMuted} onChange={event=>settings({paceMuted:!event.target.checked})}/>Pacing sound (transition cues stay on)</label><p className="small muted">{cues.status}. Sound only plays during active workouts.</p></section><section className="card"><h2>Stored on this device</h2><p>Your history and interrupted sessions live locally. Cloud sync is not connected.</p><p className="small muted">{data.lastExportAt ? `Last export requested ${new Date(data.lastExportAt).toLocaleString()}. Keep the downloaded JSON file.` : 'No backup exported yet. Browser data can be cleared; keep a JSON backup.'}</p><div className="row"><button onClick={exportData}>Export JSON</button><button onClick={() => importRef.current.click()}>Import JSON</button></div><input hidden ref={importRef} type="file" accept="application/json,.json" onChange={event => action(() => importData(event.target.files[0]))} /></section><section className="card"><h2>Install Little Strides</h2><span className="pill" aria-label="Release stage">Alpha 0.1</span><p>Open this private site on your phone and sign in with the same ChatGPT account. Then add it to your Home Screen and open its icon.</p><p>{cached ? 'Core app, village, artwork and sounds are cached for offline use.' : offlineSetup.message || 'Caching the app, art and sounds. This check times out after 20 seconds; failures can be retried.'}</p>{install ? <button onClick={async () => { await install.prompt(); setInstall(null); }}>Install app</button> : <p className="small muted">iPhone: Safari → Share → Add to Home Screen; leave Open as Web App on if shown. Android: Chrome → menu → Install and create shortcut → Install (or Add to Home screen).</p>}<p className="small muted">Wait for Offline ready before testing without a connection. History is stored on this device; export JSON before removing the app or clearing browser data. Screen lock and sounds still need a real-phone check.</p></section></>}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">{['Today', 'Village', 'Journal', 'Settings'].map((name, icon) => <button key={name} aria-current={tab === name ? 'page' : undefined} onClick={() => { setTab(name); if (name === 'Village') setNotice(''); }}><Icon index={icon} />{name}</button>)}</nav>
    </>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
