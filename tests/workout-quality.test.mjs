import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSession,finish,freshState,planSession,recovery,eligibleExercises,position,freeze,resume,skip,replace,performedMovements,setFeedback,validateBackup,progress} from '../src/engine.mjs';
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
  for(const minutes of [7,10,15,20]){const s=createSession(minutes,[],at,{settings});assert.equal(s.segments.reduce((n,b)=>n+b.durationMs,0),minutes*60_000);assert.equal(s.segments[0].kind,'prepare');assert.equal(s.segments.at(-1).kind,'cooldown');assert.equal(s.segments.filter(b=>b.kind==='rest').length,minutes-1);}
});
test('multiple same-day sessions retain repeatable movement and do not repeat recovering strengthening',()=>{
  const first=completed(),now=at+500_000;
  const second=createSession(10,first.history,now,{settings});
  assert.ok(second.segments.filter(b=>b.kind==='work').every(b=>['march','reach'].includes(b.exerciseId)));
  assert.ok(second.segments.some(b=>b.exerciseId==='reach'));
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
  let s=createSession(7,[],at,{settings});s=skip(s,at+40_000);
  const state=freshState();state.active=freeze(s,at+40_000);const h=finish(state,false,at+40_000).history[0];
  assert.equal(h.activeMs,10_000);const m=h.movements[0];assert.equal(m.status,'partial');assert.equal(m.actualMs,10_000);assert.equal(m.skippedMs,35_000);assert.equal(m.repetitions,null);assert.equal(h.completed,false);
});
test('replacement retains both original and performed movements and eligibility is enforced',()=>{
  let s=createSession(7,[],at,{settings});s=replace(s,at+40_000,{settings});
  assert.equal(s.plan[1].exerciseId,'march');assert.equal(s.segments[1].exerciseId,'reach');
  const actual=performedMovements(s,at+55_000);assert.equal(actual[0].exerciseId,'march');assert.equal(actual[0].actualMs,10_000);assert.equal(actual[1].exerciseId,'reach');assert.equal(actual[1].actualMs,15_000);
  const unavailable=replace(s,at+55_000,{settings:{enabledExercises:[]}});assert.match(unavailable.replacementMessage,/No suitable/);
});
test('pauses/interruption do not inflate actual activity or movement end timestamps',()=>{
  let s=createSession(7,[],at,{settings});s=freeze(s,at+35_000);s=resume(s,at+95_000);
  const actual=performedMovements(s,at+100_000).filter(m=>m.actualMs>0);assert.equal(actual[0].actualMs,10_000);assert.equal(actual[0].endedAt,at+100_000);
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