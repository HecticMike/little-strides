import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MINUTES, exercise, createSession, elapsed, duration, position, freeze, resume, restore, skip, replace, finish, recovery, progress, freshState, validateBackup } from './engine.mjs';
import { loadState, saveState, backup } from './storage.mjs';
import { avatarAtlas, avatarStage, avatarFrame, avatarFingerprint, CHARACTER } from './avatar.mjs';
import { Cues } from './audio.mjs';
import { ScreenLock } from './wake.mjs';
import './style.css';

const cues = new Cues(), wake = new ScreenLock();
const clock = ms => { const seconds = Math.ceil(Math.max(0, ms) / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; };
const time = ms => new Date(ms).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
function Icon({ index, className = '' }) {
  return <span aria-hidden="true" className={'pixel-icon ' + className} style={{ '--icon': index }} />;
}
function Avatar({ pose = 'stand', stage = 0 }) {
  const ref = useRef(), [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false;
    avatarAtlas().then(atlas => {
      if (disposed) return;
      const ctx = ref.current.getContext('2d'), frame = avatarFrame(pose, stage);
      ctx.clearRect(0, 0, 48, 64); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(atlas, frame.x, frame.y, frame.w, frame.h, 0, 0, 48, 64);
      ref.current.dataset.avatarFingerprint = avatarFingerprint(atlas, stage);
      ref.current.dataset.ready = 'true'; setFailed(false);
    }).catch(() => { if (!disposed) setFailed(true); });
    return () => { disposed = true; };
  }, [pose, stage]);
  return <><canvas className="avatar" ref={ref} width="48" height="64" role="img" data-avatar-id={CHARACTER.id} data-avatar-stage={CHARACTER.stages[stage].id} data-pose={pose} aria-label={CHARACTER.stages[stage].name + ' wayfarer: stylised ' + pose + ' pose'} />{failed && <span className="art-fallback">Artwork unavailable. Follow the written cue.</span>}</>;
}
function Village({ completed }) {
  const ref = useRef(), gameRef = useRef();
  const [place, setPlace] = useState('Training green');
  const stage = avatarStage(completed);
  useEffect(() => {
    let disposed = false;
    import('./village.mjs').then(async ({ createVillage }) => {
      if (disposed) return;
      const game = await createVillage(ref.current, stage, completed, setPlace);
      if (disposed) game.destroy(true); else gameRef.current = game;
    }).catch(() => { if (!disposed) setPlace('Village could not load. Your workouts are still available.'); });
    return () => { disposed = true; gameRef.current?.destroy(true); gameRef.current = null; };
  }, [completed, stage]);
  const visit = name => { setPlace(name); gameRef.current?.events.emit('visit', name); };
  return <section className="village-page">
    <p className="eyebrow">THE HEARTHWOOD CHRONICLES</p><h1>Your little<br />corner of the realm.</h1>
    <div className="village-status"><span><Icon index={5} />{CHARACTER.stages[stage].name}</span><span>{completed} strides</span></div>
    <div className="village-canvas" ref={ref} role="img" aria-label="Hearthwood pixel village. Tap a path to walk, or a building to visit." />
    <p className="muted village-hint">Tap a path to explore. Choose a building below.</p>
    <div className="places">{['Training green', 'Garden', 'Workshop'].map(p => <button key={p} aria-pressed={place === p} onClick={() => visit(p)}>{p}</button>)}</div>
    <article className="card" aria-live="polite"><h2>{place}</h2><p>{place === 'Garden' ? completed + ' completed sessions have planted ' + Math.min(12, completed) + ' flowers in your garden.' : place === 'Workshop' ? completed ? 'Restored! Your first stride brought warm windows, a new roof and the guild banner to the workshop.' : 'A quiet workshop, waiting for a new chapter. Complete your first stride to restore it.' : 'A sheltered training lodge beside the village green. Your next short adventure starts in Today.'}</p></article>
    <p className="small muted">Beginner · Adventurer · Veteran. Character rewards are fictional; they do not measure your real body.</p>
  </section>;
}
function App() {
  const [data, setData] = useState(null), current = useRef(null);
  const [tab, setTab] = useState('Today'), [minutes, setMinutes] = useState(10);
  const [now, setNow] = useState(Date.now()), [error, setError] = useState('');
  const [notice, setNotice] = useState(''), [offline, setOffline] = useState(!navigator.onLine);
  const [cached, setCached] = useState(false), [install, setInstall] = useState(null);
  const [busy, setBusy] = useState(false), busyRef = useRef(false), [otherTab, setOtherTab] = useState(false);
  const [saving, setSaving] = useState(false), writes = useRef(0);
  const lastTick = useRef(Date.now()), lastSave = useRef(0), lastCue = useRef(''), importRef = useRef();
  const set = value => { current.current = value; setData(value); };
  async function commit(value) {
    set(value);
    writes.current++; setSaving(true);
    try { await saveState(value); setError(''); return true; }
    catch {
      const s = current.current;
      const safe = s.active ? { ...s, active: freeze(s.active, Date.now(), 'interrupted') } : s;
      set(safe); wake.release();
      setError('Local saving failed. Your workout is paused. Export a backup or retry saving before continuing.');
      return false;
    }
    finally { writes.current--; if (!writes.current) setSaving(false); }
  }
  function interrupt(at = Date.now()) {
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
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker.register('./sw.js').then(async registration => {
        await navigator.serviceWorker.ready;
        const check = () => caches.has('little-strides-' + __BUILD_ID__).then(setCached);
        await check();
        navigator.serviceWorker.addEventListener('controllerchange', check);
        if (registration.waiting && !current.current?.active) setNotice('An update is ready. Close and reopen the app after your workout.');
      }).catch(() => setNotice('Offline setup failed. Stay online and reload to retry.'));
    }
    return () => {
      releaseLock?.(); wake.release();
      window.removeEventListener('online', connectivity); window.removeEventListener('offline', connectivity);
      document.removeEventListener('visibilitychange', visibility); window.removeEventListener('pagehide', pagehide);
      window.removeEventListener('beforeinstallprompt', offerInstall);
    };
  }, []);
  useEffect(() => {
    const timer = setInterval(() => {
      const t = Date.now(), previous = lastTick.current;
      lastTick.current = t; setNow(t);
      const s = current.current;
      if (!s?.active || s.active.status !== 'running') return;
      if (t - previous > 2500 || t < previous) { interrupt(previous); return; }
      const p = position(s.active, t);
      if (p.done) { wake.release(); cues.play('transition'); void commit(finish(s, true, t)); setNotice('Session complete. Your village has grown a little.'); return; }
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
    await cues.enable();
    cues.settings = current.current.settings;
    const t = Date.now(); lastTick.current = t; lastCue.current = '';
    const saved = await commit({ ...current.current, active: createSession(minutes, current.current.history, t), updatedAt: t });
    if (saved) { cues.play('transition'); void wake.acquire(); }
  }
  async function toggle() {
    const s = current.current, t = Date.now();
    if (s.active.status === 'running') {
      wake.release(); await commit({ ...s, active: freeze(s.active, t), updatedAt: t });
    } else {
      await cues.enable();
      lastTick.current = Date.now(); lastCue.current = '';
      if (await commit({ ...current.current, active: resume(current.current.active), updatedAt: Date.now() })) void wake.acquire();
    }
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
  const count = progress(data.history), stage = avatarStage(count), s = data.active;
  const p = s ? position(s, now) : null, e = p && !p.done ? exercise(p.exerciseId) : null;
  const resting = recovery(data.history, now);
  const audioControls = <div className="audio-controls">
    <button disabled={saving} aria-label={data.settings.muted ? 'Unmute sound' : 'Mute sound'} aria-pressed={data.settings.muted} onClick={() => settings({ muted: !data.settings.muted })}>{data.settings.muted ? 'Sound off' : 'Sound on'}</button>
    <label>Volume<input aria-label="Cue volume" type="range" min="0" max="1" step="0.05" value={data.settings.volume} onChange={event => settings({ volume: Number(event.target.value) })} /></label>
  </div>;
  return <div className={`app ${s ? 'in-session' : ''}`}>
    {error && <div className="error" role="alert">{error}<div className="row"><button onClick={() => action(() => commit(current.current))}>Retry saving</button><button onClick={exportData}>Export backup</button></div></div>}
    {s ? <main className="workout">
      <header className="workout-heading"><span className="brand">LITTLE STRIDES</span><span className="pill">{clock(duration(s) - elapsed(s, now))} left</span></header>
      <section className="exercise-heading"><p className="eyebrow">{s.status === 'paused' ? 'PAUSED' : p?.kind === 'rest' ? 'BREATHE & RESET' : `MOVE ${Math.floor((p?.index || 0) / 2) + 1} OF ${s.minutes}`}</p><h1>{p?.done ? 'All done' : p?.kind === 'rest' ? 'Take a breath' : e?.name}</h1></section>
      <div className="exercise-art"><Avatar pose={p?.kind === 'rest' ? 'stand' : e?.pose || 'stand'} stage={stage} /><span className="pose-note">Stylised game pose · follow the written cue</span></div>
      <section className="workout-readout" aria-label="Exercise timing"><div className="countdown" role="timer" aria-label="Seconds remaining">{Math.ceil((p?.remainingMs || 0) / 1000)}<small>SEC</small></div><span className="reps">{p?.kind === 'work' ? `PACE ${p.rep} / 15` : 'REST · 15 SEC'}</span><p>{p?.kind === 'rest' ? 'Relax your shoulders. Get ready for the next move.' : e?.cue}</p></section>
      <div className="workout-footer">
        {s.reason === 'interrupted' && <p className="recovery" role="status">Interrupted session saved. Time away was not counted. Resume when ready.</p>}
        {audioControls}
        <div className="workout-actions"><button disabled={busy || !!error} onClick={() => action(toggle)} className="primary">{s.status === 'running' ? 'Pause' : 'Resume'}</button><button disabled={busy || !!error} onClick={() => action(() => commit({ ...current.current, active: skip(current.current.active) }))}>Skip</button><button disabled={busy || !!error || p?.kind !== 'work' || p?.done} onClick={() => action(() => commit({ ...current.current, active: replace(current.current.active) }))}>Replace</button></div>
        <div className="session-meta"><button className="text-button" onClick={() => action(async () => { if (confirm('End this session and save it as partial?')) { wake.release(); await commit(finish(current.current, false)); } })}>End session</button><span>{s.status === 'running' ? wake.status : 'Resume to continue'}</span></div>
      </div>
    </main> : <>
      <header className="app-header"><a className="brand" href="./"><Icon index={0} />LITTLE STRIDES</a><span className="pill">{offline ? 'Offline' : cached ? 'Offline ready' : 'Preparing offline'}</span></header>
      <main className="page">
        {notice && <div className="notice" role="status">{notice}<button aria-label="Dismiss notice" onClick={() => setNotice('')}>×</button></div>}
        {tab === 'Today' && <>
          <p className="eyebrow">THE HEARTHWOOD CHRONICLES</p><h1>A small quest.<br /><em>A stronger story.</em></h1><p className="intro">Take a little time. Return with a little magic.</p>
          <div className="home-scene"><span className="scene-label">HEARTHWOOD · VILLAGE GREEN</span><Avatar stage={stage} /><span className="hero-stage"><Icon index={5} />{CHARACTER.stages[stage].name}</span></div>
          <section className="plan"><div className="row between"><h2>Choose your quest</h2><span className="muted">No equipment</span></div><div className="duration-options" aria-label="Workout duration">{MINUTES.map(m => <button key={m} aria-pressed={minutes === m} onClick={() => setMinutes(m)}>{m}<small>MIN</small></button>)}</div><p className="muted plan-description">{resting.resting.length ? 'An easy mobility day. Recently used muscle groups are resting.' : 'Gentle full-body moves · 45 seconds on, 15 seconds rest'}</p><button className="primary start" disabled={busy || !!error} onClick={() => action(begin)}>{busy ? 'Preparing…' : 'Start ' + minutes + '-minute session'}<Icon index={0} /></button><p className="small muted">Move within a comfortable range. Pause whenever you need.</p></section>
          <div className="progress-strip"><Icon index={4} /><div><strong>{count} little strides</strong><p>{count ? 'Your next chapter is taking root.' : 'First quest reward: restore the workshop.'}</p></div><span className="stage">{stage + 1}/3</span></div>
        </>}
        {tab === 'Village' && <Village completed={count} />}
        {tab === 'Journal' && <><p className="eyebrow">EVERY LITTLE STRIDE COUNTS</p><h1>Your journal</h1><article className="card"><h2>Suggested recovery</h2><p>{resting.resting.length ? 'Your next session uses easy mobility while these groups rest:' : 'Your next session includes a gentle mix of moves.'}</p>{resting.resting.map(g => <p key={g}>{g === 'legs' ? 'Legs' : 'Upper body'} · varied moves return {new Date(resting.until[g]).toLocaleDateString()} at {time(resting.until[g])}</p>)}<p className="small muted">A simple 24-hour variety rule, not a measure of physical readiness.</p></article><h2 className="section-title">Session history</h2>{data.history.length === 0 ? <p className="muted">Your first session will appear here.</p> : <ul className="history">{[...data.history].reverse().map(h => <li key={h.id}><div><strong>{h.minutes}-minute stride</strong><p>{new Date(h.endedAt).toLocaleDateString()} · {Math.floor(h.activeMs / 1000)} seconds moving</p></div><span className="pill">{h.completed ? 'Complete' : 'Partial'}</span></li>)}</ul>}</>}
        {tab === 'Settings' && <><p className="eyebrow">MAKE YOURSELF AT HOME</p><h1>Your settings</h1><section className="card"><h2>Workout sound</h2>{audioControls}<button onClick={() => action(async () => { await cues.enable(); cues.play('transition'); setNotice(cues.status); })}>Test sound</button><p className="small muted">{cues.status}. Sound only plays during active workouts.</p></section><section className="card"><h2>Stored on this device</h2><p>Your history and interrupted sessions live locally. Cloud sync is not connected.</p><p className="small muted">{data.lastExportAt ? `Last export requested ${new Date(data.lastExportAt).toLocaleString()}. Keep the downloaded JSON file.` : 'No backup exported yet. Browser data can be cleared; keep a JSON backup.'}</p><div className="row"><button onClick={exportData}>Export JSON</button><button onClick={() => importRef.current.click()}>Import JSON</button></div><input hidden ref={importRef} type="file" accept="application/json,.json" onChange={event => action(() => importData(event.target.files[0]))} /></section><section className="card"><h2>Install Little Strides</h2><p>{cached ? 'Core app, village, artwork and sounds are cached for offline use.' : 'Keep the app open online until “Offline ready” appears.'}</p>{install ? <button onClick={async () => { await install.prompt(); setInstall(null); }}>Install app</button> : <p className="small muted">iPhone: Safari → Share → Add to Home Screen. Android: Chrome menu → Install app / Add to Home screen.</p>}<p className="small muted">Use HTTPS on your phone. Screen lock and sounds depend on device and browser settings.</p></section></>}
      </main>
      <nav className="bottom-nav" aria-label="Main navigation">{['Today', 'Village', 'Journal', 'Settings'].map((name, icon) => <button key={name} aria-current={tab === name ? 'page' : undefined} onClick={() => setTab(name)}><Icon index={icon} />{name}</button>)}</nav>
    </>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);
