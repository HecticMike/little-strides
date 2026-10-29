// Shared visual milestone contract. Fictional builds, never measured fitness.
export const COMEBACK_STAGES=Object.freeze([
 {id:'starting',at:0},{id:'rhythm',at:8},{id:'form',at:24},{id:'confident',at:48},{id:'developed',at:96},
].map(Object.freeze));
export const COMEBACK_STAGE_ASSET='./art/comeback-stages.png';
export const COMEBACK_STAGE_POSES=Object.freeze({
 stand:{x:0,w:96,h:128,purpose:'character'},march:{x:96,w:96,h:128,purpose:'exercise-still'},
 calf:{x:192,w:96,h:132,purpose:'raised-position-only'},'heel-slide':{x:288,w:192,h:128,purpose:'exercise-still'},
 supine:{x:480,w:192,h:128,purpose:'starting-position-only'},bridge:{x:672,w:192,h:128,purpose:'raised-position-only'},
});
export function comebackStagePose(id){return ['abdominal-bracing','pelvic-tilt'].includes(id)?'supine':id==='glute-bridge'?'bridge':id;}
export function comebackStageFrame(pose,stage){
 const row=COMEBACK_STAGES.findIndex(s=>s.id===stage),p=COMEBACK_STAGE_POSES[comebackStagePose(pose)];
 if(row<0||!p)throw new Error('Unprepared character stage or pose');
 return {x:p.x,y:row*132,w:p.w,h:p.h};
}
export function comebackAppearance(units){let id='starting';for(const stage of COMEBACK_STAGES)if(units+1e-9>=stage.at)id=stage.id;return id;}
