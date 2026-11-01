import {freshState,createSession,finish,duration} from '../src/engine.mjs';
import {withTrainingProfile,recommendationSettings} from '../src/training.mjs';
import {migrateComeback} from '../src/comeback.mjs';
// Genuine software completion records in an isolated fictional fixture, never user data.
export function milestoneState(count,now){
 const gap=3*86400000;let state=withTrainingProfile(freshState());state.settings.muted=true;state=migrateComeback(state,now-(count+1)*gap);
 for(let i=0;i<count;i++){const at=now-(count-i)*gap;state.active=createSession(3,state.history,at,{settings:recommendationSettings(state,at)});state=finish(state,true,at+duration(state.active));}
 return state;
}
