import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {freshState,createSession,finish,freeze,restore,skip,replace,validateBackup,progress,setExerciseHold} from '../src/engine.mjs';
import {planSession,recovery} from '../src/scheduler.mjs';
import {MINUTES,EXERCISES,exercise} from '../src/catalog.mjs';
import {PROJECTS,chapterState,purchaseProject,chooseDiscovery,readDiscovery,restoreWorkshop} from '../src/gameplay.mjs';
import {worldProps} from '../src/world-art.mjs';
const at=1_800_000_000_000,settings={enabledExercises:['reach','abdominal-bracing','pelvic-tilt','heel-slide','glute-bridge','march','calf']};
function earned(n=1){let s=freshState();s.settings={...s.settings,...settings};for(let i=0;i<n;i++){const t=at+i*86400000;s.active=createSession(3,s.history,t,{settings:s.settings});s=finish(s,true,t+180000);}return s;}
const roundtrip=s=>validateBackup({format:'little-strides',schemaVersion:1,data:s});

test('small step is exactly three minutes, one position, no strength/aerobic or reduced recovery caps',()=>{
 assert.deepEqual(MINUTES,[7,10,15,20]);
 for(const focus of ['core','cardio','balanced','recovery']){
  const p=planSession(3,[],at,{...settings,sessionFocus:focus});assert.ok(p.segments);assert.equal(p.segments.reduce((n,b)=>n+b.durationMs,0),180000);
  assert.equal(p.segments[0].durationMs,30000);assert.equal(p.segments.at(-1).durationMs,30000);
  const work=p.segments.filter(b=>b.kind==='work');assert.ok(work.length);assert.equal(new Set(work.map(b=>exercise(b.exerciseId).position)).size,1);
  assert.ok(work.every(b=>['activation','mobility'].includes(exercise(b.exerciseId).loadKind)));assert.equal(p.summary.strength,0);assert.equal(p.summary.aerobic,0);
 }
});
test('small-step shortages, locked movements and discomfort never become filler',()=>{
 for(const enabledExercises of [[],['march','calf'],['squat','push','modified-dead-bug']])assert.equal(planSession(3,[],at,{enabledExercises}).segments,null);
 assert.equal(planSession(3,[],at,{enabledExercises:['abdominal-bracing'],recovery:{maxRepeatableSeconds:90}}).segments,null);
 let s=freshState();s.settings.enabledExercises=['reach'];s=setExerciseHold(s,'reach',true,at);assert.equal(planSession(3,[],at,s.settings).segments,null);
});
test('same-day and rolling next-day exposure considers actual small-step activity',()=>{
 const s=earned(),last=s.history[0],used=recovery(s.history,last.endedAt+1000,s.settings).used;
 assert.equal(Object.values(used).reduce((n,v)=>n+v,0),last.activeMs);
 assert.ok(planSession(3,s.history,last.endedAt+4*3600000,s.settings).segments);
 const only={enabledExercises:['reach'],recovery:{maxRepeatableSeconds:120}};
 let x=freshState();x.active=createSession(3,[],at,{settings:only});x=finish(x,true,at+180000);
 assert.equal(planSession(3,x.history,at+12*3600000,only).segments,null);
 assert.equal(planSession(3,x.history,at+23*3600000,only).segments,null);
 assert.ok(planSession(3,x.history,at+25*3600000,only).segments);
});
test('small-step completion is one reward; skips, suspension and previews never invent work',()=>{
 const s=earned();assert.equal(progress(s.history),1);assert.deepEqual(roundtrip(s),s);assert.equal(chapterState(s).balance,1);
 let x=freshState();x.active=createSession(3,[],at,{settings});x.active=restore(freeze(x.active,at+35000));x=finish(x,false,at+900000);assert.equal(x.history[0].activeMs,5000);assert.equal(progress(x.history),0);
 x=freshState();x.active=createSession(3,[],at,{settings});x.active=skip(x.active,at+31000);x=finish(x,true,at+180000);assert.equal(progress(x.history),0);
 assert.equal(progress([...s.history,...s.history]),1);
});
test('small-step replacement remains gentle and imported unsafe short plans are rejected',()=>{
 let s=createSession(3,[],at,{settings:{enabledExercises:['reach','march']}});const changed=replace(s,at+35000,{settings:{enabledExercises:['reach','march']}});assert.match(changed.replacementMessage,/No suitable/);
 const state=earned();state.history[0].segments.find(b=>b.kind==='work').exerciseId='march';assert.throws(()=>roundtrip(state));
});
test('legacy workshop and banked timber migrate without rewriting exercise history',()=>{
 let s=earned(4);s=restoreWorkshop(s,at+4*86400000);const original=structuredClone(s.history);
 s.world={schemaVersion:1,workshop:s.world.workshop};const migrated=roundtrip(s);
 assert.equal(migrated.world.schemaVersion,2);assert.equal(chapterState(migrated).completed,1);assert.equal(chapterState(migrated).balance,3);assert.deepEqual(migrated.history,original);
 const bad=structuredClone(s);delete bad.world.workshop;assert.throws(()=>roundtrip(bad));
});
test('six ordered projects spend exactly twelve unique rewards and persist choices/discoveries',()=>{
 let s=earned(12);const before=structuredClone(s.history);
 for(const p of PROJECTS){assert.equal(chapterState(s).next.id,p.id);s=purchaseProject(s,p.id,p.choices?.[1],at+20*86400000);assert.strictEqual(purchaseProject(s,p.id),s);s=roundtrip(s);}
 assert.equal(chapterState(s).balance,0);assert.equal(chapterState(s).complete,true);assert.equal(chapterState(s).next,null);assert.deepEqual(s.history,before);
 s=chooseDiscovery(s,'watchtower');assert.strictEqual(chooseDiscovery(s,'pond'),s);s=readDiscovery(s,'gathering');assert.deepEqual(roundtrip(s),s);
 assert.equal(worldProps(s.world).find(p=>p.id==='banner').frame,1);assert.equal(worldProps(s.world).find(p=>p.id==='garden').frame,3);assert.ok(worldProps(s.world).some(p=>p.id==='mira'));
});
test('unfunded, out-of-order, malformed and duplicate spending are rejected',()=>{
 assert.throws(()=>purchaseProject(freshState(),'workshop'));assert.throws(()=>purchaseProject(earned(),'garden','flowers'));assert.throws(()=>chooseDiscovery(earned(),'pond'));assert.throws(()=>readDiscovery(freshState(),'banner'));
 let s=earned(3);s=restoreWorkshop(s);assert.throws(()=>purchaseProject(s,'banner','unknown'));s=purchaseProject(s,'banner','fern');
 const bad=structuredClone(s);bad.world.projects[0].rewardIds=[s.world.workshop.spentRewardIds[0]];assert.throws(()=>roundtrip(bad));
 const invalid=structuredClone(s);invalid.world.projects[0].choice='other';assert.throws(()=>roundtrip(invalid));
});
test('chapter art exports have stable dimensions and genuine editable prop/interface layers',()=>{
 const inventory=JSON.parse(readFileSync('art/source-inventory.json','utf8'));
 const props=inventory.find(a=>a.asset==='chapter-props');assert.equal(props.width,384);assert.equal(props.height,288);assert.ok(props.layers.length>=15);
 for(const name of ['ui-enamel','ui-paper']){const a=inventory.find(a=>a.asset===name);assert.equal(a.width,32);assert.equal(a.layers.length,3);}
 for(const name of ['pond','watchtower']){const b=readFileSync('public/art/discovery-'+name+'.png');assert.equal(b.readUInt32BE(16),320);assert.equal(b.readUInt32BE(20),200);}
});


test('optional ambience defaults off, follows saved volume and stops for mute or suspension', async()=>{
 const {Cues}=await import('../src/audio.mjs');const cues=new Cues();let starts=0,stops=0,gainValue;
 cues.context={state:'running',destination:{},createBufferSource:()=>({connect(){},disconnect(){},start(){starts++;},stop(){stops++;}}),createGain:()=>{const g={gain:{value:0},connect(){gainValue=g.gain.value;},disconnect(){}};return g;}};
 cues.buffers.ambience={};cues.settings={muted:false,volume:.4};cues.startAmbience();assert.equal(starts,0);
 cues.settings.ambience=true;cues.startAmbience();assert.equal(starts,1);assert.ok(Math.abs(gainValue-.14)<.001);
 cues.settings.muted=true;cues.startAmbience();assert.equal(stops,1);assert.equal(starts,1);assert.equal(cues.ambientSource,null);
 cues.settings.muted=false;cues.context.state='suspended';cues.startAmbience();assert.equal(starts,1);
});
