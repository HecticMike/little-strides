import {EXERCISES} from './catalog.mjs';
export const SUGGESTION_VERSION=1;
export const suggestedIds=()=>EXERCISES.filter(e=>e.selectable).map(e=>e.id);
// One-time adoption only. Explicit choices, exclusions and discomfort reports persist.
export function withSuggestions(settings={}){
 if(settings.suggestionVersion===SUGGESTION_VERSION)return settings;
 const personal=!!settings.exerciseReviewVersion||(settings.enabledExercises||[]).length>0||Object.keys(settings.exerciseHolds||{}).length>0||Object.keys(settings.exerciseReassessedAt||{}).length>0;
 return {...settings,enabledExercises:personal?[...(settings.enabledExercises||[])]:suggestedIds(),suggestionVersion:SUGGESTION_VERSION,selectionMode:personal?'personal':'suggested'};
}
export function useSuggestedSelection(settings){return {...settings,enabledExercises:suggestedIds().filter(id=>!settings.exerciseHolds?.[id]),suggestionVersion:SUGGESTION_VERSION,selectionMode:'suggested'};}
export function varietyCosts(history,now){
 const seen=new Set(),recent=[...history].filter(h=>h.mode!=='preview'&&h.endedAt<=now&&h.endedAt>now-7*86400000&&h.movements?.some(m=>m.actualMs>0)).sort((a,b)=>b.endedAt-a.endedAt).filter(h=>!seen.has(h.id)&&seen.add(h.id)).slice(0,3),costs={};
 recent.forEach((h,index)=>{for(const id of new Set(h.movements.filter(m=>m.actualMs>0).map(m=>m.exerciseId)))costs[id]=(costs[id]||0)+[45,24,12][index];});
 return costs;
}
