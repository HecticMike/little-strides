import {EXERCISES,JOINTS} from './catalog.mjs';
const DAY=86400000;
const areasOk=a=>Array.isArray(a)&&a.length<=JOINTS.length&&a.every(j=>JOINTS.includes(j))&&new Set(a).size===a.length;
const timeOk=t=>Number.isFinite(t)&&t>=0;
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
// These are the owner's reported constraints, not a diagnosis-based prescription.
export const INITIAL_PROFILE=Object.freeze({version:1,source:'user-reported',condition:'psoriatic-arthritis',lightLoadingAreas:['knees','shoulders'],floorAccess:'comfortable',avoidOverhead:true,avoidFastImpact:true,avoidDemandingShoulder:true,coreEmphasis:true,professionalAdvice:''});
export function validProfile(p){return object(p)&&p.version===1&&p.source==='user-reported'&&p.condition==='psoriatic-arthritis'&&areasOk(p.lightLoadingAreas)&&['comfortable','avoid','unknown'].includes(p.floorAccess)&&['avoidOverhead','avoidFastImpact','avoidDemandingShoulder','coreEmphasis'].every(k=>typeof p[k]==='boolean')&&typeof p.professionalAdvice==='string'&&p.professionalAdvice.length<=2000;}
export function withTrainingProfile(state){
 if(state.settings.exerciseProfile)return state;
 return {...state,settings:{...state.settings,exerciseProfile:structuredClone(INITIAL_PROFILE)},training:state.training||{version:1,checkIns:[],observations:{}}};
}
export function validAdjustment(a){return object(a)&&a.version===1&&typeof a.id==='string'&&a.id.length>0&&a.id.length<=100&&timeOk(a.at)&&areasOk(a.areas)&&[null,true,false].includes(a.worseThanUsual)&&['unknown','usual','high'].includes(a.fatigue);}
export function currentAdjustment(settings,now){const a=settings.todayAdjustment;return a&&a.at<=now&&now-a.at<DAY?a:null;}
// Explicit movement characteristics. No inference that all joint contacts are equivalent loads.
export const MOVEMENT_CONSTRAINTS={reach:{overhead:true},push:{demandingShoulder:true},'modified-dead-bug':{overhead:true,demandingShoulder:true}};
// Support/contact tags are exclusions, not claims of equivalent strengthening load.
export const affectedByAreas=(e,areas)=>[...e.joints,...(e.contactAreas||[])].some(j=>areas.includes(j));
export function profileRestriction(e,settings,now){
 const p=settings.exerciseProfile,a=currentAdjustment(settings,now),m=MOVEMENT_CONSTRAINTS[e.id]||{};
 if(p?.avoidOverhead&&m.overhead)return 'Overhead reaching is excluded by your profile; separate personal review is needed.';
 if(p?.avoidDemandingShoulder&&m.demandingShoulder)return 'Demanding shoulder loading is excluded by your profile.';
 if(p?.avoidFastImpact&&(m.fast||m.impact))return 'Fast or high-impact movement is excluded by your profile.';
 if(p&&p.floorAccess!=='comfortable'&&e.position==='floor')return 'Floor access is not currently confirmed comfortable in your profile.';
 if(a&&affectedByAreas(e,a.areas))return 'Excluded by your current symptom adjustment; review before using an affected area.';
 if(a?.worseThanUsual&&a.areas.length===0)return 'Symptoms are worse than usual without an affected area recorded; review or rest.';
 if((a?.fatigue==='high'||settings.trainingContext?.gentleOnly)&&!['activation','mobility'].includes(e.loadKind))return 'Only activation and mobility are being considered after reported fatigue or high effort.';
 return null;
}
export function recommendationSettings(state,now=Date.now()){
 const hard=state.history.some(h=>h.mode!=='preview'&&h.activeMs>0&&h.endedAt<=now&&now-h.endedAt<DAY&&(h.feedback?.comfort==='difficult'||state.training?.observations[h.id]?.effort==='hard'));
 return {...state.settings,trainingContext:{gentleOnly:hard}};
}
function holdMovements(state,ids,now){const holds={...state.settings.exerciseHolds},reviews={...state.settings.exerciseReassessedAt};for(const id of ids){holds[id]=now;delete reviews[id];}return {...state,settings:{...state.settings,exerciseHolds:holds,exerciseReassessedAt:reviews}};}
export function setTodayAdjustment(state,input,now=Date.now()){
 const a={version:1,id:crypto.randomUUID(),at:now,areas:[...new Set(input.areas)],worseThanUsual:input.worseThanUsual,fatigue:input.fatigue};
 if(!validAdjustment(a))throw new Error('Choose valid symptom and fatigue options.');
 let next={...state,settings:{...state.settings,todayAdjustment:a},training:{version:1,observations:{},...state.training,checkIns:[...(state.training?.checkIns||[]),a].slice(-10000)},updatedAt:now};
 if(a.worseThanUsual)next=holdMovements(next,EXERCISES.filter(e=>e.selectable&&(!a.areas.length||affectedByAreas(e,a.areas))).map(e=>e.id),now);
 return next;
}
export function validObservation(o){
 if(!object(o)||o.version!==1||![null,'easy','moderate','hard'].includes(o.effort)||!['unknown','same','worse'].includes(o.lingering)||!areasOk(o.areas)||!timeOk(o.updatedAt))return false;
 const d=o.device;if(d===null)return true;
 const value=(n,min,max)=>n===null||Number.isFinite(n)&&n>=min&&n<=max;
 return object(d)&&d.source==='Fitbit (manual)'&&value(d.averageHeartRate,1,300)&&value(d.maximumHeartRate,1,300)&&value(d.activeZoneMinutes,0,1440)&&(d.averageHeartRate===null||d.maximumHeartRate===null||d.averageHeartRate<=d.maximumHeartRate);
}
export function setTrainingObservation(state,id,patch,now=Date.now()){
 const record=state.history.find(h=>h.id===id&&h.mode!=='preview'&&h.activeMs>0);if(!record)throw new Error('Feedback needs a saved session with actual movement.');
 const previous=state.training?.observations[id]||{version:1,effort:null,lingering:'unknown',areas:[],device:null};
 const observation={...previous,...patch,version:1,updatedAt:now};
 if(!validObservation(observation))throw new Error('Check the feedback values. Heart rates must be positive, average no higher than maximum; active-zone minutes must be 0-1440.');
 let next={...state,training:{version:1,checkIns:[],...state.training,observations:{...state.training?.observations,[id]:observation}},updatedAt:now};
 if(observation.lingering==='worse'&&(patch.lingering==='worse'||patch.areas!==undefined)){
  const ids=observation.areas.length?EXERCISES.filter(e=>e.selectable&&affectedByAreas(e,observation.areas)).map(e=>e.id):record.movements?.filter(m=>m.actualMs>0).map(m=>m.exerciseId)||[];
  next=holdMovements(next,ids,now);
 }
 return next;
}
export function validateTraining(state){
 if(state.settings.exerciseProfile!==undefined&&!validProfile(state.settings.exerciseProfile))return false;
 if(state.settings.todayAdjustment!==undefined&&!validAdjustment(state.settings.todayAdjustment))return false;
 const t=state.training;if(t===undefined)return true;
 return object(t)&&t.version===1&&Array.isArray(t.checkIns)&&t.checkIns.length<=10000&&t.checkIns.every(validAdjustment)&&new Set(t.checkIns.map(a=>a.id)).size===t.checkIns.length&&object(t.observations)&&Object.entries(t.observations).length<=state.history.length&&Object.entries(t.observations).every(([id,o])=>state.history.some(h=>h.id===id&&h.mode!=='preview'&&h.activeMs>0)&&validObservation(o));
}
