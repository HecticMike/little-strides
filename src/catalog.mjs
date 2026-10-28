import {CORE_CANDIDATES} from './core-candidates.mjs';
export const MINUTES = [7,10,15,20];
export const EXERCISE_REVIEW_VERSION = 2;
export const JOINTS = ['ankles','knees','hips','back','shoulders','elbows','wrists'];
export const RECOVERY_DEFAULTS = { strengthHours:48, discomfortHours:48, windowHours:24, maxStrengthSeconds:90, maxRepeatableSeconds:600, maxJointSeconds:600 };
export const EXERCISES = [
  {id:'march',category:'Cardio & Movement',pattern:'stepping',muscles:['hip-flexors'],name:'Easy march',reviewStatus:'unreviewed',selectable:true,group:'mobility',loadKind:'aerobic',position:'standing',joints:['ankles','knees','hips'],pose:'march',artStatus:'stylised',cue:'Stand tall. Step gently in place.',considerations:'Repeated weight shifts load ankles, knees and hips; balance tolerance varies.',alternative:'reach'},
  {id:'squat',category:'Core & Strength',pattern:'squat',muscles:['quads','glutes','trunk'],name:'Shallow squat',reviewStatus:'pending-review',selectable:false,group:'legs',loadKind:'strength',position:'standing',joints:['ankles','knees','hips','back'],pose:'squat',artStatus:'provisional',cue:'Feet apart. Sit back a little. Rise slowly.',considerations:'Knee and hip bending under body weight; depth, balance and trunk position need review.',alternative:'calf'},
  {id:'push',category:'Core & Strength',pattern:'push',muscles:['chest','triceps'],name:'Wall push',reviewStatus:'pending-review',selectable:false,group:'upper',loadKind:'strength',position:'standing',joints:['wrists','elbows','shoulders'],pose:'push',artStatus:'provisional',cue:'Hands on a wall. Bend elbows, then press away.',considerations:'Loads wrists, elbows and shoulders against a surface; hand placement and alignment need review.',alternative:'reach'},
  {id:'calf',category:'Core & Strength',pattern:'ankle-raise',muscles:['calves'],name:'Calf raise',reviewStatus:'unreviewed',selectable:true,group:'legs',loadKind:'strength',position:'standing',joints:['ankles','knees'],pose:'calf',artStatus:'stylised',cue:'Hold support if needed. Lift heels, lower slowly.',considerations:'Body-weight loading through ankles and calves; balance and ankle tolerance matter. Support is optional.',alternative:'march'},
  {id:'reach',category:'Mobility & Recovery',pattern:'reach',muscles:['shoulder-mobility'],name:'Gentle reach',reviewStatus:'unreviewed',selectable:true,group:'mobility',loadKind:'mobility',position:'standing',joints:['shoulders','back'],pose:'reach',artStatus:'stylised',cue:'Reach up comfortably, then lower your arms.',considerations:'Shoulder elevation and trunk position; keep the range comfortable rather than forcing it.',alternative:'march'},
];
EXERCISES.push(...CORE_CANDIDATES);
export const exercise = id => EXERCISES.find(e=>e.id===id);
export const enabledExercise = (id,settings={}) => !!exercise(id)?.selectable && (settings.enabledExercises||[]).includes(id);
export function recoveryConfig(settings={}) {
  return {...RECOVERY_DEFAULTS,...settings.recovery};
}
// Planning defaults are software heuristics for individual review, not validated doses.
export const SESSION_FOCUSES = {balanced:'Balanced',core:'Core-focused',cardio:'Cardio-focused',recovery:'Recovery'};
export const normaliseFocus = value => value === 'mixed' || !SESSION_FOCUSES[value] ? 'balanced' : value;
export function planningMetadata(e, settings={}) {
  const base = e.loadKind==='aerobic'
    ? {minSeconds:30,preferredSeconds:120,maxSeconds:180,restSeconds:15,continuous:true,maxBlocks:5}
    : e.loadKind==='strength'
    ? {minSeconds:30,preferredSeconds:45,maxSeconds:45,restSeconds:30,continuous:false,maxBlocks:2}
    : {minSeconds:30,preferredSeconds:e.loadKind==='activation'?45:60,maxSeconds:e.loadKind==='activation'?60:120,restSeconds:15,continuous:e.loadKind==='mobility',maxBlocks:e.loadKind==='activation'?2:4};
  // Overrides may shorten blocks or add rest; they cannot expand these unreviewed defaults.
  const custom=settings.planning?.[e.id]||{};
  const seconds=(value,fallback)=>Number.isFinite(value)&&value%15===0?value:fallback;
  return {...base,minSeconds:base.minSeconds,maxSeconds:Math.max(base.minSeconds,Math.min(base.maxSeconds,seconds(custom.maxSeconds,base.maxSeconds))),preferredSeconds:Math.max(base.minSeconds,Math.min(base.maxSeconds,seconds(custom.preferredSeconds,base.preferredSeconds))),restSeconds:Math.max(base.restSeconds,Math.min(60,seconds(custom.restSeconds,base.restSeconds))),transitionSeconds:45,reviewStatus:'unreviewed',repeatedBlocks:e.loadKind==='strength'?'separated sets within existing strength cap':'variety only; not strength progression'};
}
export const LOADING_MODEL = Object.freeze({version:1,purposes:['strength','activation','mobility','aerobic'],jointExposureBasis:'unweighted tagged duration; conservative scheduling proxy only',biomechanicalLoad:null,reviewStatus:'unreviewed'});
