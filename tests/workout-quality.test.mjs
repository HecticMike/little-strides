import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSession,finish,freshState,planSession,recovery,eligibleExercises,position,freeze,resume,skip,replace,performedMovements,setFeedback,validateBackup,progress,setExerciseHold,canResumeSession} from '../src/engine.mjs';
import {EXERCISES} from '../src/catalog.mjs';
import {activitySummary} from '../src/activity.mjs';
import {TEST_SETTINGS} from './fixtures.mjs';
const at=10_000_000,settings={...TEST_SETTINGS,muted:false,volume:.35};
function completed(minutes=7,history=[],time=at,custom=settings){const state=freshState();state.settings=custom;state.history=history;state.active=createSession(minutes,history,time,{settings:custom});return finish(state,true,time+minutes*60_000);}
test('no automatic enable, blanket legacy acknowledgement ignored, provisional candidates stay locked',()=>{
  assert.throws(()=>createSession(10));
  assert.throws(()=>createSession(10,[],at,{settings:{exerciseReviewVersion:1}}));
  assert.throws(()=>createSession(10,[],at,{settings:{enabledExercises:['push','squat']}}));
  const s=createSession(10,[],at,{settings});assert.ok(s.segments.filter(b=>b.kind==='work').every(b=>!['push','squat'].includes(b.exerciseId)));
});
test('all exact lengths include preparation, rest/transitions and wind-down; current catalogue stays standing',()=>{
  for(const minutes of [7,10,15,20]){const s=createSession(minutes,[],at,{settings});assert.equal(s.segments.reduce((n,b)=>n+b.durationMs,0),minutes*60_000);assert.equal(s.segments[0].kind,'prepare');assert.equal(s.segments.at(-1).kind,'cooldown');assert.ok(s.segments.some(b=>b.kind==='rest'));assert.ok(s.segments.filter(b=>b.kind==='work').every(b=>EXERCISES.find(e=>e.id===b.exerciseId).position==='standing'));}
});
test('multiple same-day sessions retain repeatable movement and do not repeat recovering strengthening',()=>{
  const first=completed(),now=at+500_000;
  const second=createSession(10,first.history,now,{settings});
  assert.ok(second.segments.filter(b=>b.kind==='work').every(b=>['march','reach'].includes(b.exerciseId)));
  assert.ok(second.segments.some(b=>b.exerciseId==='reach'));assert.ok(planSession(10,first.history,now,settings).notes.some(note=>/strengthening is recovering/.test(note)));
});
test('next-day rolling restriction releases only after the configured recovery window',()=>{
  const first=completed();assert.ok(recovery(first.history,at+25*3600_000,settings).resting.includes('legs'));
  assert.ok(!eligibleExercises(first.history,at+25*3600_000,settings).some(e=>e.id==='calf'));
  assert.ok(eligibleExercises(first.history,at+49*3600_000,settings).some(e=>e.id==='calf'));
  assert.ok(recovery(first.history,at+49*3600_000,{...settings,recovery:{strengthHours:72}}).resting.includes('legs'));
});
test('cumulative repeatable limits offer shorter supported durations or rest without filler',()=>{
  const justMarch={...settings,enabledExercises:['march']};
  const long=planSession(20,[],at,justMarch);assert.equal(long.segments,null);assert.deepEqual(long.availableMinutes,[7,10]);
  const first=completed(10,[],at,justMarch),second=planSession(7,first.history,at+700_000,justMarch);
  assert.equal(second.segments,null);assert.deepEqual(second.availableMinutes,[]);assert.match(second.reason,/limit|recovering/);
  const capped={...settings,recovery:{maxRepeatableSeconds:90}};assert.equal(planSession(20,[],at,capped).segments,null);
});
test('partial time before skip is preserved, rest contributes no work, and real reps remain unknown',()=>{
  let s=createSession(7,[],at,{settings});s=skip(s,at+s.segments[0].durationMs+10_000);
  const state=freshState();state.active=freeze(s,at+s.segments[0].durationMs+10_000);const h=finish(state,false,at+s.segments[0].durationMs+10_000).history[0];
  assert.equal(h.activeMs,10_000);const m=h.movements[0];assert.equal(m.status,'partial');assert.equal(m.actualMs,10_000);assert.equal(m.skippedMs,s.segments[1].durationMs-10_000);assert.equal(m.repetitions,null);assert.equal(h.completed,false);
});
test('replacement retains both original and performed movements and eligibility is enforced',()=>{
  let s=createSession(7,[],at,{settings});s=replace(s,at+s.segments[0].durationMs+10_000,{settings});
  assert.equal(s.plan[1].exerciseId,'march');assert.equal(s.segments[1].exerciseId,'reach');
  const actual=performedMovements(s,at+s.segments[0].durationMs+25_000);assert.equal(actual[0].exerciseId,'march');assert.equal(actual[0].actualMs,10_000);assert.equal(actual[1].exerciseId,'reach');assert.equal(actual[1].actualMs,15_000);
  const unavailable=replace(s,at+55_000,{settings:{enabledExercises:[]}});assert.match(unavailable.replacementMessage,/No suitable/);
});
test('pauses/interruption do not inflate actual activity or movement end timestamps',()=>{
  let s=createSession(7,[],at,{settings});s=freeze(s,at+s.segments[0].durationMs+5_000);s=resume(s,at+s.segments[0].durationMs+65_000);
  const actual=performedMovements(s,at+s.segments[0].durationMs+70_000).filter(m=>m.actualMs>0);assert.equal(actual[0].actualMs,10_000);assert.equal(actual[0].endedAt,at+s.segments[0].durationMs+70_000);
});
test('feedback and joint flags persist and temporarily exclude affected candidates',()=>{
  const state=completed();const result=setFeedback(state,state.history[0].id,'discomfort',['knees'],at+500_000);
  const roundtrip=validateBackup({format:'little-strides',schemaVersion:1,data:result});assert.deepEqual(roundtrip.history[0].feedback,result.history[0].feedback);
  assert.deepEqual(eligibleExercises(result.history,at+501_000,settings).map(e=>e.id),['reach']);
  assert.equal(progress(result.history),1);assert.throws(()=>setFeedback(result,result.history[0].id,'approved',[]));
});
test('invalid movement totals and feedback cannot overwrite a valid backup',()=>{
  const state=completed();state.history[0].movements[0].actualMs=999_000;
  assert.throws(()=>validateBackup({format:'little-strides',schemaVersion:1,data:state}));
});
test('pacing sound can be muted while transition audio and the saved master volume remain active',async()=>{
  const {Cues}=await import('../src/audio.mjs');const cues=new Cues();let plays=0,gain;
  cues.settings={muted:false,volume:.2,paceMuted:true};cues.buffers={pace:{},transition:{}};
  cues.context={state:'running',destination:{},createBufferSource:()=>({connect(){},start(){plays++;}}),createGain:()=>{gain={gain:{value:0},connect(){}};return gain;}};
  cues.play('pace');assert.equal(plays,0);cues.play('transition');assert.equal(plays,1);assert.equal(gain.gain.value,.2);cues.settings.muted=true;cues.play('transition');assert.equal(plays,1);
});
test('legacy history and interrupted checkpoints remain readable without invented precise outcomes',()=>{
  const state=freshState(),segments=[];for(let i=0;i<7;i++)segments.push({kind:'work',exerciseId:'march',durationMs:45000},{kind:'rest',exerciseId:'march',durationMs:15000});
  const h={schemaVersion:1,id:'legacy-record',deviceId:state.deviceId,startedAt:at,endedAt:at+420000,minutes:7,elapsedMs:420000,activeMs:315000,completed:true,groups:['mobility'],segments,events:[]};
  state.history=[h];state.active={id:'legacy-active',minutes:7,startedAt:at+500000,segments,elapsedMs:10000,runningSince:null,checkpointAt:at+510000,status:'paused',reason:'paused',events:[]};
  const restored=validateBackup({format:'little-strides',schemaVersion:1,data:state});assert.deepEqual(restored.history[0],h);assert.equal(restored.active.id,'legacy-active');assert.equal(restored.history[0].movements,undefined);
});

// Phase 5 uses fictional settings/history; no production candidate is unlocked.
test('discomfort persists across rolling days and feedback edits until explicit reassessment',()=>{
  let state=completed(10);state=setFeedback(state,state.history[0].id,'discomfort',['knees'],at+700_000);
  state=setFeedback(state,state.history[0].id,'comfortable',[],at+710_000);
  const later=at+8*86400_000;
  assert.ok(!eligibleExercises(state.history,later,settings).some(e=>['march','calf'].includes(e.id)));
  state=setExerciseHold(state,'march',false,later);
  assert.ok(!state.settings.enabledExercises.includes('march'),'reassessment must not enable it');
  state.settings.enabledExercises.push('march');
  assert.ok(eligibleExercises(state.history,later,state.settings).some(e=>e.id==='march'));
  assert.ok(!eligibleExercises(state.history,later,state.settings).some(e=>e.id==='calf'));
  assert.deepEqual(validateBackup({format:'little-strides',schemaVersion:1,data:state}),state);
});
test('individual discomfort flags survive JSON and cannot unlock a pending movement',()=>{
  let state=freshState();state.settings={...state.settings,...settings};state=setExerciseHold(state,'reach',true,at);
  assert.ok(!state.settings.enabledExercises.includes('reach'));
  state=setExerciseHold(state,'reach',false,at);state=setExerciseHold(state,'reach',true,at);
  assert.ok(recovery([],at,state.settings).discomfort.reach,'a new flag supersedes a same-clock reassessment');
  const restored=validateBackup({format:'little-strides',schemaVersion:1,data:state});
  assert.ok(!eligibleExercises([],at+10*86400_000,restored.settings).some(e=>e.id==='reach'));
  state=setExerciseHold(restored,'squat',false,at+1);state.settings.enabledExercises.push('squat');
  assert.ok(!eligibleExercises([],at+2,state.settings).some(e=>e.id==='squat'));
});
test('joint exposure combines actual partial strengthening and aerobic work, not planned rests',()=>{
  const now=at+3600_000;
  const history=[{id:'fictional-load',mode:'workout',endedAt:at+600_000,movements:[{exerciseId:'march',actualMs:540_000,endedAt:at+540_000},{exerciseId:'calf',actualMs:60_000,endedAt:at+600_000}]}];
  const r=recovery(history,now,settings);assert.equal(r.jointUsed.knees,600_000);assert.equal(r.used.march,540_000);
  assert.ok(!eligibleExercises(history,now,settings).some(e=>e.id==='march'));
  assert.ok(eligibleExercises(history,now,{...settings,recovery:{maxJointSeconds:900}}).some(e=>e.id==='march'));
});
test('shared muscles recover across fictional patterns and floor work is grouped when eligible',()=>{
  const fixture={...EXERCISES.find(e=>e.id==='calf'),id:'fictional-core',name:'Fictional test only',group:'upper',muscles:['trunk'],pattern:'core-control',position:'floor'};
  const other={...fixture,id:'fictional-other-core',group:'legs'};
  EXERCISES.push(fixture,other);
  try{
    const custom={...settings,enabledExercises:[...settings.enabledExercises,fixture.id,other.id]};
    const s=createSession(10,[],at,{settings:custom});
    assert.ok(s.segments.some(b=>b.exerciseId===fixture.id));
    const positions=s.segments.filter(b=>b.kind==='work').map(b=>EXERCISES.find(e=>e.id===b.exerciseId).position);
    assert.ok(positions.filter((p,i)=>i&&p!==positions[i-1]).length<=2);
    const history=[{mode:'workout',endedAt:at,movements:[{exerciseId:fixture.id,actualMs:45_000,endedAt:at}]}];
    assert.ok(!eligibleExercises(history,at+25*3600_000,custom).some(e=>e.id===other.id));
    assert.ok(eligibleExercises(history,at+49*3600_000,custom).some(e=>e.id===other.id));
  }finally{EXERCISES.pop();EXERCISES.pop();}
});
test('a mostly skipped resolved timeline earns no reward, preserving legacy earned restoration',()=>{
  let state=freshState();state.settings=settings;let s=createSession(10,[],at,{settings});s=skip(s,at+75_000);
  while(!position(s,at+75_000).done)s=skip(s,at+75_000);
  state.active=s;state=finish(state,true,at+75_000);
  assert.equal(state.history[0].activeMs,s.segments[1].durationMs);assert.equal(state.history[0].completed,false);assert.equal(progress(state.history),0);
  const tampered=structuredClone(state);tampered.history[0].completed=true;assert.equal(progress(tampered.history),0);assert.throws(()=>validateBackup({format:'little-strides',schemaVersion:1,data:tampered}));
  const legacy=structuredClone(state);delete legacy.history[0].qualityVersion;legacy.history[0].completed=true;
  assert.equal(progress(legacy.history),1);assert.doesNotThrow(()=>validateBackup({format:'little-strides',schemaVersion:1,data:legacy}));
});
test('resume and replacements cannot exceed revised remaining joint capacity',()=>{
  const s=freeze(createSession(10,[],at,{settings}),at+50_000);
  assert.equal(canResumeSession(s,[],at+100_000,settings),true);
  const tightened={...settings,recovery:{maxJointSeconds:90}};
  assert.equal(canResumeSession(s,[],at+100_000,tightened),false);
  const candidate=replace(s,at+100_000,{settings:tightened});assert.ok(candidate.replacementMessage||candidate.segments[1].exerciseId==='reach');
});
test('today/week statistics count actual purpose separately, omit previews and deduplicate',()=>{
  const morning=new Date(2026,9,27,9).getTime(),first=completed(10,[],morning),second=completed(10,first.history,morning+6*3600_000);
  assert.ok(second.history[1].movements.every(m=>m.exerciseId!=='calf'));
  const preview={...second.history[1],id:'preview-stat',mode:'preview'};
  const summary=activitySummary([...second.history,second.history[0],preview],morning+7*3600_000);
  assert.equal(summary.today.sessions,2);assert.equal(summary.week.sessions,2);assert.equal(summary.today.activeMs,second.history.reduce((n,h)=>n+h.activeMs,0));assert.equal(summary.today.strengthMs,90_000);
  assert.equal(summary.today.aerobicMs+summary.today.strengthMs+summary.today.mobilityMs+summary.today.activationMs,summary.today.activeMs);
  assert.ok(!eligibleExercises(second.history,morning+25*3600_000,settings).some(e=>e.id==='calf'));
});
test('invalid new hold, exposure and discomfort fields cannot replace a valid backup',()=>{
  const state=completed();for(const mutate of [s=>s.settings.exerciseHolds={madeup:at},s=>s.settings.exerciseReassessedAt={march:-1},s=>s.settings.recovery={maxJointSeconds:0},s=>s.history[0].discomfort={at,joints:['madeup']}]){
    const bad=structuredClone(state);mutate(bad);assert.throws(()=>validateBackup({format:'little-strides',schemaVersion:1,data:bad}));
  }
});
test('offline worker leaves private authentication to the network and falls back after cache failure',async()=>{
  const {readFileSync}=await import('node:fs'),{runInNewContext}=await import('node:vm');const events={};let network=0;
  runInNewContext(readFileSync('public/sw.js','utf8'),{self:{location:{origin:'https://test.invalid'},registration:{scope:'https://test.invalid/'},addEventListener:(n,fn)=>events[n]=fn},URL,Response,caches:{open:async()=>{throw Error('cache unavailable');}},fetch:async()=>{network++;return 'network';}});
  for(const route of ['signin-with-chatgpt','signout-with-chatgpt','callback'])events.fetch({request:{url:'https://test.invalid/'+route,method:'GET',mode:'navigate'},respondWith:()=>assert.fail('Authentication was intercepted')});
  let result;events.fetch({request:{url:'https://test.invalid/',method:'GET',mode:'navigate'},respondWith:p=>{result=p;}});assert.equal(await result,'network');assert.equal(network,1);
});
// Core candidates are unreviewed app entries; fictional opt-ins are not clinical approval.
test('NHS core candidates start disabled, have no fabricated poses and retain clinical locks',()=>{
  const state=freshState(),core=EXERCISES.filter(e=>e.focus==='core');assert.equal(core.length,5);
  for(const e of core){assert.ok(!state.settings.enabledExercises.includes(e.id));assert.equal(e.pose,null);assert.equal(e.artStatus,e.selectable?'illustrative':'missing');assert.ok(e.sourceUrl.includes('.nhs.'));assert.ok(e.instructions.length>=2);assert.notEqual(e.reviewStatus,'reviewed');}
  assert.ok(!eligibleExercises([],at,{enabledExercises:core.map(e=>e.id)}).some(e=>e.id==='modified-dead-bug'));
  assert.ok(!eligibleExercises([],at,{enabledExercises:['squat','push']}).length);
});
const coreSettings={...settings,sessionFocus:'core',enabledExercises:['abdominal-bracing','pelvic-tilt','heel-slide','glute-bridge']};
test('core plans use only opted-in core movements, distinguish activation and fit exact supported durations',()=>{
  for(const m of [7,10]){const plan=planSession(m,[],at,coreSettings);assert.ok(plan.segments);assert.equal(plan.segments.reduce((n,b)=>n+b.durationMs,0),m*60000);assert.ok(plan.segments.filter(b=>b.kind==='work').every(b=>EXERCISES.find(e=>e.id===b.exerciseId).focus==='core'));assert.equal(plan.summary.aerobic,0);assert.equal(plan.summary.strength,90000);}
  for(const m of [15,20])assert.equal(planSession(m,[],at,coreSettings).segments,null,'do not bypass combined joint limits');
  const reviewedLimits={...coreSettings,recovery:{maxJointSeconds:1200}};
  for(const m of [7,10])assert.ok(planSession(m,[],at,reviewedLimits).segments);
  assert.equal(planSession(20,[],at,reviewedLimits).segments,null,'a higher fictional cap does not justify padding beyond meaningful block limits');
});
test('same-day and next-day core strength recovers while gentle activation stays distinct',()=>{
  const config={...coreSettings,recovery:{maxJointSeconds:1200}};const first=completed(10,[],at,config);
  for(const now of [at+6*3600000,at+25*3600000]){const plan=planSession(7,first.history,now,config);assert.ok(plan.segments);assert.equal(plan.summary.strength,0);assert.ok(!plan.segments.some(b=>b.exerciseId==='glute-bridge'));}
  assert.ok(eligibleExercises(first.history,at+49*3600000,config).some(e=>e.id==='glute-bridge'));
  const second=completed(7,first.history,at+6*3600000,config);assert.equal(activitySummary(second.history,at+7*3600000).all.strengthMs,90000);
  assert.deepEqual(validateBackup({format:'little-strides',schemaVersion:1,data:second}),second);
});
test('incomplete, held and recovering core pools offer honest alternatives without filler',()=>{
  assert.equal(planSession(7,[],at,{...coreSettings,enabledExercises:['glute-bridge']}).segments,null);
  assert.match(planSession(10,[],at,{...coreSettings,enabledExercises:['march']}).reason,/No core movements enabled/);
  let state=freshState();state.settings=coreSettings;state=setExerciseHold(state,'heel-slide',true,at);
  assert.ok(!createSession(7,[],at,{settings:state.settings}).segments.some(b=>b.exerciseId==='heel-slide'));
  const first=completed(10,[],at,coreSettings);assert.equal(planSession(7,first.history,at+700000,coreSettings).segments,null);
});
test('self-paced core blocks do not invent a repetition target or use unrelated artwork',()=>{
  const s=createSession(7,[],at,{settings:coreSettings});const p=position(s,at+s.segments[0].durationMs+1000);assert.equal(p.paceTotal,0);assert.equal(p.rep,0);assert.equal(EXERCISES.find(e=>e.id===p.exerciseId).pose,null);
});
test('workflow preview is inert and cannot create history, recovery, records or rewards',async()=>{
  const {createPreviewSession,persistableState}=await import('../src/engine.mjs');const {backup}=await import('../src/storage.mjs');
  for(const m of [7,10,15,20]){
    let state=freshState();state.active=createPreviewSession(m,at);assert.ok(state.active.segments.every(b=>b.exerciseId===null));assert.equal(state.active.segments.reduce((n,b)=>n+b.durationMs,0),m*60000);
    assert.equal(persistableState(state).active,null);assert.equal(JSON.parse(backup(state)).data.active,null);
    let preview=skip(state.active,at+10000);preview=replace(preview,at+11000);assert.equal(position(preview,at+11000).previewLabel,'Alternative timer card');
    state=finish(state,true,at+m*60000);assert.equal(state.active,null);assert.equal(state.history.length,0);assert.equal(progress(state.history),0);assert.deepEqual(recovery(state.history).resting,[]);
  }
});
test('adding core opt-ins cannot hide a feasible mixed twenty-minute plan',()=>{
  const all={...settings,enabledExercises:EXERCISES.filter(e=>e.selectable).map(e=>e.id)};
  const plan=planSession(20,[],at,all);assert.ok(plan.segments);assert.equal(plan.segments.reduce((n,b)=>n+b.durationMs,0),1200000);
  const load={};for(const b of plan.segments.filter(b=>b.kind==='work'))for(const j of EXERCISES.find(e=>e.id===b.exerciseId).joints)load[j]=(load[j]||0)+b.durationMs;
  assert.ok(Object.values(load).every(ms=>ms<=600000));
});

test('sound test explains app mute and zero volume without reporting playback', async () => {
  const { Cues } = await import('../src/audio.mjs');
  const cues = new Cues(); let enabled = 0;
  cues.enable = async () => { enabled++; };
  cues.settings = { muted: true, volume: .45 };
  assert.match(await cues.test(), /Sound is off/);
  cues.settings = { muted: false, volume: 0 };
  assert.match(await cues.test(), /volume is zero/);
  assert.equal(enabled, 0);
});

test('iPhone playback category is requested before resume and sound test uses saved volume', async t => {
  const { Cues } = await import('../src/audio.mjs');
  const old = globalThis.window;
  t.after(() => { if (old === undefined) delete globalThis.window; else globalThis.window = old; });
  const session = { type: 'auto' }; let starts = 0, volume;
  class Audio {
    state = 'suspended'; destination = {};
    async resume() { assert.equal(session.type, 'playback'); this.state = 'running'; }
    createBufferSource() { return { connect() {}, start() { starts++; } }; }
    createGain() { const gain = { gain: { value: 0 }, connect() { volume = gain.gain.value; } }; return gain; }
  }
  globalThis.window = { navigator: { audioSession: session }, AudioContext: Audio };
  const cues = new Cues(); cues.buffers = { transition: {}, pace: {} }; cues.settings.volume = .2;
  assert.match(await cues.test(), /Test tone sent/);
  assert.equal(starts, 1); assert.equal(volume, .2);
  cues.context.state = 'interrupted'; cues.context.onstatechange();
  assert.equal(cues.play('transition'), false); assert.equal(starts, 1);
});

test('unsupported audio-session settings are harmless; blocked or failed audio never reports a sent test', async t => {
  const { Cues } = await import('../src/audio.mjs');
  const old = globalThis.window;
  t.after(() => { if (old === undefined) delete globalThis.window; else globalThis.window = old; });
  const session = {}; Object.defineProperty(session, 'type', { set() { throw new Error('Unsupported'); } });
  class Audio { state = 'suspended'; async resume() {} }
  globalThis.window = { navigator: { audioSession: session }, AudioContext: Audio };
  const cues = new Cues(); cues.buffers = { transition: {}, pace: {} };
  assert.match(await cues.test(), /retry/);
  cues.context.resume = async () => { throw new Error('Blocked'); };
  assert.match(await cues.test(), /Sound unavailable/);
  assert.equal(cues.lastPlayed, undefined);
});
