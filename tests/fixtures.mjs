import {createSession} from '../src/engine.mjs';
export const TEST_SETTINGS={enabledExercises:['march','calf','reach']};
export const testSession=(minutes,history=[],now=Date.now(),options={})=>createSession(minutes,history,now,{...options,settings:{...TEST_SETTINGS,...options.settings}});