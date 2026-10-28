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
export const exercise = id => EXERCISES.find(e=>e.id===id);
export const enabledExercise = (id,settings={}) => !!exercise(id)?.selectable && (settings.enabledExercises||[]).includes(id);
export function recoveryConfig(settings={}) {
  return {...RECOVERY_DEFAULTS,...settings.recovery};
}