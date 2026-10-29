import {test} from 'node:test';import assert from 'node:assert/strict';
import {freshState,createSession,finish,duration,validateBackup,setExerciseHold,plannedAlternatives,canResumeSession,freeze} from '../src/engine.mjs';
import {exercise} from '../src/catalog.mjs';import {planSession,exerciseEligibility} from '../src/scheduler.mjs';
import {withTrainingProfile,recommendationSettings,setTodayAdjustment,setTrainingObservation} from '../src/training.mjs';
const at=Date.parse('2026-10-29T10:00:00Z'),hour=3600000;
const start=()=>withTrainingProfile(freshState());
const plan=(s,m=10,t=at)=>planSession(m,s.history,t,recommendationSettings(s,t));
function complete(s=start(),t=at,m=10){s.active=createSession(m,s.history,t,{settings:recommendationSettings(s,t)});return finish(s,true,t+duration(s.active));}
const round=s=>validateBackup({format:'little-strides',schemaVersion:1,data:s});
const ids=p=>p.segments?.filter(b=>b.kind==='work').map(b=>b.exerciseId)||[];
test('profile adoption preserves choices, holds, history and active checkpoints; no enable-first barrier',()=>{
 const s=freshState();s.settings.enabledExercises=['march','heel-slide'];s.settings.exerciseHolds={calf:at};s.active=createSession(3,[],at,{settings:{enabledExercises:['heel-slide']}});const before=structuredClone(s);const next=withTrainingProfile(s);assert.deepEqual(next.settings.enabledExercises,before.settings.enabledExercises);assert.deepEqual(next.active,before.active);assert.deepEqual(next.settings.exerciseHolds,before.settings.exerciseHolds);assert.strictEqual(withTrainingProfile(next),next);assert.ok(plan(start()).segments);assert.equal(plan(start()).focus,'balanced');
});
test('profile excludes overhead reach and floor uncertainty without unlocking or approving candidates',()=>{
 let s=start();const choices=exerciseEligibility([],at,recommendationSettings(s,at));assert.equal(choices.find(e=>e.id==='reach').status,'profile');for(const id of ['push','squat','modified-dead-bug'])assert.equal(choices.find(e=>e.id===id).status,'locked');assert.ok(!ids(plan(s)).includes('reach'));s.settings.exerciseProfile.floorAccess='unknown';assert.ok(ids(plan(s)).every(id=>exercise(id).position==='standing'));assert.ok(choices.every(e=>e.reviewStatus!=='reviewed'));
});
test('core-led composition stays exact, groups positions and reports purposes honestly',()=>{
 const s=start();for(const m of [3,7,10,15,20]){const p=plan(s,m);if(!p.segments){assert.ok(p.reason);assert.ok(!p.availableMinutes.includes(m));continue;}assert.equal(p.segments.reduce((n,b)=>n+b.durationMs,0),m*60000);const work=p.segments.filter(b=>b.kind==='work'),positions=work.map(b=>exercise(b.exerciseId).position);assert.ok(positions.filter((p,i)=>i&&p!==positions[i-1]).length<=1);assert.ok(work.some(b=>exercise(b.exerciseId).focus==='core'));for(const kind of ['activation','mobility','aerobic','strength'])assert.equal(p.summary[kind],work.filter(b=>exercise(b.exerciseId).loadKind===kind).reduce((n,b)=>n+b.durationMs,0));}assert.match(plan(s).label,/Core-led/);assert.ok(plan(s).notes.some(n=>n.includes('hips/glutes')));
});
test('same-day and next-day requests use rolling strength restrictions without filler',()=>{
 const s=complete();for(const t of [at+5*hour,at+25*hour]){const p=plan(s,10,t);assert.ok(!ids(p).some(id=>exercise(id).loadKind==='strength'));if(!p.segments)assert.ok(p.reason);}const later=plan(s,10,at+50*hour);assert.ok(later.segments);assert.ok(ids(later).includes('glute-bridge'));
});
test('worsening creates persistent affected-area holds; positive reports do not silently clear them',()=>{
 let s=setTodayAdjustment(start(),{areas:['knees'],worseThanUsual:true,fatigue:'unknown'},at);assert.ok(s.settings.exerciseHolds.march);assert.ok(s.settings.exerciseHolds['heel-slide']);assert.equal(plan(s).segments,null);s=setTodayAdjustment(s,{areas:[],worseThanUsual:false,fatigue:'usual'},at+hour);assert.equal(plan(s).segments,null);assert.equal(plan(s,10,at+72*hour).segments,null);s=setExerciseHold(s,'heel-slide',false,at+73*hour);s.settings.enabledExercises.push('heel-slide');assert.ok(plan(s,3,at+73*hour).segments);assert.deepEqual(round(s),s);
});
test('unknown symptoms stay unknown; fatigue narrows purpose without overriding capacity or replacements',()=>{
 const s=setTodayAdjustment(start(),{areas:[],worseThanUsual:null,fatigue:'high'},at),settings=recommendationSettings(s,at),p=plan(s);assert.equal(s.settings.todayAdjustment.worseThanUsual,null);if(p.segments)assert.ok(ids(p).every(id=>['activation','mobility'].includes(exercise(id).loadKind)));const index=p.segments.findIndex(b=>b.kind==='work');assert.ok(plannedAlternatives(p.segments,index,{minutes:10,now:at,settings}).every(e=>['activation','mobility'].includes(e.loadKind)));const unrestricted=createSession(10,[],at,{settings:start().settings});assert.equal(canResumeSession(freeze(unrestricted,at),[],at,settings),false);
});
test('effort adapts conservatively; Fitbit context and missing feedback never increase training load',()=>{
 let s=complete();const id=s.history[0].id,settings0=recommendationSettings(s,at+hour);assert.equal(settings0.trainingContext.gentleOnly,false);s=setTrainingObservation(s,id,{device:{source:'Fitbit (manual)',averageHeartRate:100,maximumHeartRate:120,activeZoneMinutes:4}},at+hour);assert.deepEqual(recommendationSettings(s,at+hour),settings0);assert.equal(s.training.observations[id].effort,null);s=setTrainingObservation(s,id,{effort:'hard'},at+hour);assert.equal(recommendationSettings(s,at+hour).trainingContext.gentleOnly,true);assert.equal(recommendationSettings(s,at+25*hour).trainingContext.gentleOnly,false);assert.deepEqual(round(s),s);assert.throws(()=>setTrainingObservation(s,id,{device:{source:'Fitbit (manual)',averageHeartRate:130,maximumHeartRate:100,activeZoneMinutes:2}},at+hour));
});
test('later worsening holds actual implicated movements; device edits never reapply a reassessed hold',()=>{
 let s=complete(),id=s.history[0].id;s=setTrainingObservation(s,id,{lingering:'worse',areas:['shoulders']},at+hour);assert.ok(s.settings.exerciseHolds['glute-bridge']);assert.ok(s.settings.exerciseHolds['heel-slide']);assert.ok(s.settings.exerciseHolds['abdominal-bracing']);s=setExerciseHold(s,'glute-bridge',false,at+2*hour);s=setTrainingObservation(s,id,{effort:'easy'},at+3*hour);assert.equal(s.settings.exerciseHolds['glute-bridge'],undefined);s=setTrainingObservation(s,id,{lingering:'same'},at+3*hour);assert.ok(!s.settings.enabledExercises.includes('glute-bridge'));assert.deepEqual(round(s),s);
});
test('versioned training backups reject malformed inputs and retain legacy data without rewriting history',()=>{
 const original=complete(),s=structuredClone(original);assert.deepEqual(round(s),s);for(const bad of [x=>x.settings.exerciseProfile.version=99,x=>x.settings.exerciseProfile.floorAccess='fine',x=>x.training.version=2,x=>x.training.observations.missing={version:1,effort:'hard',lingering:'unknown',areas:[],device:null,updatedAt:at}]){const broken=structuredClone(s);bad(broken);assert.throws(()=>round(broken));}const legacy=freshState();assert.deepEqual(round(legacy),legacy);assert.deepEqual(s.history,original.history);assert.deepEqual(s.world,original.world);
});
test('previews and zero-movement sessions cannot create training observations or exercise credit',()=>{
 const s=start();assert.throws(()=>setTrainingObservation(s,'preview',{effort:'hard'},at));s.active=createSession(3,[],at,{settings:s.settings});const stopped=finish(s,false,at);assert.throws(()=>setTrainingObservation(stopped,stopped.history[0].id,{effort:'easy'},at));assert.deepEqual(round(stopped),stopped);
});
