import {comebackProgress} from './comeback.mjs';
import {comebackAppearance} from './comeback-stages.mjs';
// Optional fiction derived from the existing saved ledger. Reading never writes progress.
export const MILESTONE_MOMENTS=Object.freeze([
 {at:0,title:'A little room',paragraphs:['Sunlight reaches the mat. He sets down his water bottle and makes a little space in the day.','There is room to begin here, and room to return another time.']},
 {at:8,title:'A familiar place',paragraphs:['The room is becoming familiar: the light through the window, the mat underfoot, the water waiting nearby.','He takes a moment to look around. Small visits have become part of this place.']},
 {at:24,title:'Making space',paragraphs:['He leaves a little space beside the mat before getting on with the rest of his day. Movement has a place among ordinary things.','The room is ready whenever he returns. Quieter days belong to this story too.']},
 {at:48,title:'At home with the rhythm',paragraphs:['Afternoon light falls across the floor. He pauses by the window, then settles into the familiar space.','There is a quiet confidence in knowing that he can return at his own pace.']},
 {at:96,title:'A chapter of your own',paragraphs:['The same window lights the same mat. He has brought many small efforts to this ordinary room.','He takes in the view for a moment. This chapter is his to keep, with room for whatever comes next.']},
].map(m=>Object.freeze({...m,paragraphs:Object.freeze(m.paragraphs),appearance:comebackAppearance(m.at)})));
export function earnedMoments(state){
 const progress=comebackProgress(state);
 return MILESTONE_MOMENTS.flatMap(moment=>{
  const saved=progress.unlocks.find(m=>m.threshold===moment.at);
  return saved&&progress.units+1e-9>=moment.at?[{...moment,unlockedAt:saved.unlockedAt,sessionId:saved.sessionId}]:[];
 });
}
