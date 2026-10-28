import {exercise} from './catalog.mjs';
export function fullEligibleActivity(h) {
  const planned=h.segments.filter(b=>b.kind==='work').reduce((n,b)=>n+b.durationMs,0);
  return planned>0&&Array.isArray(h.movements)&&h.movements.reduce((n,m)=>n+m.actualMs,0)===planned&&h.movements.every(m=>m.actualMs===m.plannedMs&&exercise(m.exerciseId)?.selectable);
}
// Rewards are derived from unique completed workout records, never from UI events.
export function rewardedWorkouts(history) {
  const records = new Map();
  for (const h of history) if (h.completed && h.mode !== 'preview' && h.activeMs >= 30_000 && h.elapsedMs === h.minutes * 60_000 && (h.qualityVersion!==3||fullEligibleActivity(h))) records.set(h.id, h);
  return [...records.values()];
}
export const emptyWorld = () => ({ schemaVersion: 1, workshop: { stage: 0, spentRewardIds: [], restoredAt: null } });
export function migrateWorld(state) {
  if (state.world !== undefined) return state.world;
  // Phase 2 restored this building automatically; keep existing owners' building.
  const first = rewardedWorkouts(state.history)[0];
  return first ? { schemaVersion: 1, workshop: { stage: 1, spentRewardIds: [first.id], restoredAt: first.endedAt } } : emptyWorld();
}
export function workshopState(state) {
  const workshop = migrateWorld(state).workshop, earned = rewardedWorkouts(state.history);
  return { ...workshop, earned: earned.length, balance: earned.filter(h => !workshop.spentRewardIds.includes(h.id)).length };
}
export function restoreWorkshop(state, now = Date.now()) {
  const workshop = workshopState(state);
  if (workshop.stage === 1) return state;
  const reward = rewardedWorkouts(state.history).find(h => !workshop.spentRewardIds.includes(h.id));
  if (!reward) throw new Error('Complete a workout to earn 1 timber for restoration.');
  return { ...state, world: { schemaVersion: 1, workshop: { stage: 1, spentRewardIds: [reward.id], restoredAt: now } }, updatedAt: now };
}
export function validWorld(world, history) {
  if (!world || world.schemaVersion !== 1 || !world.workshop) return false;
  const w = world.workshop, ids = new Set(rewardedWorkouts(history).map(h => h.id));
  return [0,1].includes(w.stage) && Array.isArray(w.spentRewardIds) && w.spentRewardIds.length === w.stage && w.spentRewardIds.every(id => typeof id === 'string' && ids.has(id)) && (w.stage === 0 ? w.restoredAt === null : Number.isFinite(w.restoredAt) && w.restoredAt >= 0);
}