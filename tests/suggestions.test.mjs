import{test}from'node:test';import assert from'node:assert/strict';
import{freshState,createSession,finish,freeze,replace,replacementOptions,plannedAlternatives,swapPlannedMovement,validateBackup,setExerciseHold}from'../src/engine.mjs';
import{planSession}from'../src/scheduler.mjs';import{EXERCISES,exercise}from'../src/catalog.mjs';import{withSuggestions,useSuggestedSelection,varietyCosts}from'../src/suggestions.mjs';
const at=1_800_000_000_000,core={enabledExercises:['abdominal-bracing','pelvic-tilt','heel-slide']};
test('fresh installation has a usable preselection without clinical approval or locked movements',()=>{const s=freshState();assert.equal(s.settings.selectionMode,'suggested');for(const n of [3,7,10,15,20])assert.ok(planSession(n,[],at,s.settings).segments);assert.ok(s.settings.enabledExercises.every(id=>exercise(id).selectable));assert.ok(EXERCISES.every(e=>e.reviewStatus!=='reviewed'));});
test('legacy first-use migration is once only; explicit empty choices, opt-outs and holds stay respected',()=>{
 const defaults=withSuggestions({muted:false,volume:.4,enabledExercises:[]});assert.ok(defaults.enabledExercises.length);assert.strictEqual(withSuggestions(defaults),defaults);
 for(const s of [{enabledExercises:[],exerciseReviewVersion:2},{enabledExercises:['reach']},{enabledExercises:[],exerciseHolds:{reach:at}}])assert.deepEqual(withSuggestions(s).enabledExercises,s.enabledExercises);
 const personal={...defaults,enabledExercises:['reach'],selectionMode:'personal'};assert.deepEqual(withSuggestions(personal),personal);
 let state=freshState();state=setExerciseHold(state,'abdominal-bracing',true,at);assert.ok(!planSession(3,state.history,at,state.settings).segments.some(b=>b.exerciseId==='abdominal-bracing'));const reset=useSuggestedSelection(state.settings);assert.equal(reset.selectionMode,'suggested');assert.ok(!reset.enabledExercises.includes('abdominal-bracing'));assert.deepEqual(reset.exerciseHolds,state.settings.exerciseHolds);
});
test('variety uses actual recent activity, ignores previews and duplicate records, and stays a soft preference',()=>{
 let s=freshState();const sequences=[];for(let i=0;i<3;i++){const t=at+i*4*3600000;s.active=createSession(3,s.history,t,{settings:core});sequences.push(s.active.segments.filter(b=>b.kind==='work').map(b=>b.exerciseId).join(','));s=finish(s,true,t+180000);}
 assert.ok(new Set(sequences).size>1);const h=s.history[0];assert.deepEqual(varietyCosts([h,h],h.endedAt),varietyCosts([h],h.endedAt));assert.deepEqual(varietyCosts([{...h,mode:'preview'}],h.endedAt),{});
 assert.ok(planSession(3,s.history,at+13*3600000,{enabledExercises:['heel-slide']}).segments);
});
test('cardio cannot silently become mobility, and explicit exclusions remain unavailable',()=>{
 const s=createSession(7,[],at,{settings:{enabledExercises:['march','reach']}}),p=freeze(s,at+s.segments[0].durationMs+5000);
 assert.deepEqual(replacementOptions(p,at+60000,{settings:{enabledExercises:['march','reach']}}),[]);assert.equal(replace(p,at+60000,{settings:{enabledExercises:['march','reach']}}).segments[1].exerciseId,'march');
});
test('planned replacements are equivalent, exact-time, exposure-checked and recorded as the chosen plan',()=>{
 const base=createSession(3,[],at,{settings:core});const options=plannedAlternatives(base.segments,1,{minutes:3,history:[],now:at,settings:core});assert.ok(options.some(e=>e.id==='heel-slide'));
 const next=createSession(3,[],at,{settings:core,plannedSwaps:[{index:1,exerciseId:'heel-slide'}]});assert.equal(next.segments[1].exerciseId,'heel-slide');assert.equal(next.plan[1].exerciseId,'heel-slide');assert.equal(next.segments.reduce((n,b)=>n+b.durationMs,0),180000);
 assert.throws(()=>swapPlannedMovement(base.segments,1,'march',{minutes:3,settings:{enabledExercises:[...core.enabledExercises,'march']},now:at}));
 let s=freshState();s.active=next;s=finish(s,true,at+180000);assert.equal(s.history[0].movements[0].exerciseId,'heel-slide');assert.deepEqual(validateBackup({format:'little-strides',schemaVersion:1,data:s}),s);
});
test('malformed recommendation preference metadata cannot overwrite valid backups',()=>{
 const s=freshState();s.settings.suggestionVersion=99;assert.throws(()=>validateBackup({format:'little-strides',schemaVersion:1,data:s}));
});

test('live swaps respect the remaining minimum duration and physical-period limits',()=>{
 const base=createSession(3,[],at,{settings:core}),setup=base.segments[0].durationMs;
 const late=freeze(base,at+setup+40000);assert.deepEqual(replacementOptions(late,at+setup+40000,{settings:core}),[]);
 const altered={...base,segments:[base.segments[0],{kind:'work',exerciseId:'heel-slide',durationMs:30000},{kind:'rest',exerciseId:null,durationMs:15000},{kind:'work',exerciseId:'heel-slide',durationMs:30000},{kind:'rest',exerciseId:null,durationMs:15000},...base.segments.slice(1)]};altered.plan=structuredClone(altered.segments);
 const current=freeze(altered,at+setup+90000+1000);assert.ok(!replacementOptions(current,at+setup+90000+1000,{settings:core}).some(e=>e.id==='heel-slide'));
});
