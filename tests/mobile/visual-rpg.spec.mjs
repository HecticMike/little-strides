import { startWorkout } from './helpers.mjs';
import { test, expect } from '@playwright/test';
import { freshState, createSession, finish } from '../../src/engine.mjs';
const base = Date.now() - 7 * 86400_000;
function stateWithStrides(count) {
  let state = freshState();
  for (let i = 0; i < count; i++) {
    const at = base + i * 600_000;
    state.active = createSession(7, [], at); state = finish(state, true, at + 420_000);
  }
  return state;
}
async function seed(page, count) {
  await page.goto('/'); await expect(page.getByRole('button', { name: 'Start 10-minute session' })).toBeEnabled();
  await page.evaluate(async state => {
    const db = await new Promise(resolve => { const r = indexedDB.open('little-strides', 1); r.onsuccess = () => resolve(r.result); });
    await new Promise((resolve, reject) => { const tx = db.transaction('state', 'readwrite'); tx.objectStore('state').put(state, 'current'); tx.oncomplete = resolve; tx.onerror = reject; }); db.close();
  }, stateWithStrides(count));
  await page.reload(); await expect(page.locator('.home-scene .avatar[data-ready=true]')).toBeVisible();
}
test('fresh install defaults to 10 minutes and navigation never covers content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: '10 MIN', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const start = page.getByRole('button', { name: 'Start 10-minute session' });
  await expect(start).toBeEnabled();
  const button = await start.boundingBox(), nav = await page.getByRole('navigation').boundingBox();
  expect(button.y + button.height).toBeLessThanOrEqual(nav.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Village', exact: true }).tap();
  await expect(page.locator('.village-canvas[data-ready=true]')).toBeVisible();
  const final = page.getByText(/Character rewards are fictional/);
  await final.scrollIntoViewIfNeeded();
  const box = await final.boundingBox(); expect(box.y + box.height).toBeLessThanOrEqual(nav.y);
});
test('canonical identity and stage match Today, Village and Workout for all three stages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const fingerprints = [];
  for (const [count, stage] of [[0,'beginner'],[3,'adventurer'],[6,'veteran']]) {
    await seed(page, count);
    const avatar = page.locator('.home-scene .avatar');
    await expect(avatar).toHaveAttribute('data-avatar-stage', stage);
    const fingerprint = await avatar.getAttribute('data-avatar-fingerprint'); fingerprints.push(fingerprint);
    await page.getByRole('button', { name: 'Village', exact: true }).tap();
    const village = page.locator('.village-canvas[data-ready=true]'); await expect(village).toBeVisible();
    await expect(village).toHaveAttribute('data-avatar-id', 'hearthwood-wayfarer');
    await expect(village).toHaveAttribute('data-avatar-stage', stage);
    await expect(village).toHaveAttribute('data-avatar-fingerprint', fingerprint);
    await page.getByRole('button', { name: 'Today', exact: true }).tap();
    await startWorkout(page, 10);
    const workout = page.locator('.exercise-art .avatar[data-ready=true]'); await expect(workout).toBeVisible();
    await expect(workout).toHaveAttribute('data-avatar-stage', stage);
    await expect(workout).toHaveAttribute('data-avatar-fingerprint', fingerprint);
    page.once('dialog', d => d.accept()); await page.getByRole('button', { name: 'End session', exact: true }).tap();
    await expect(page.getByRole('button', { name: 'Start 10-minute session' })).toBeEnabled();
  }
  expect(new Set(fingerprints).size).toBe(3);
});
test('all five exercise IDs render distinct matching poses', async ({ page }) => {
  await page.goto('/'); await startWorkout(page, 10);
  await page.getByRole('button', { name: 'Pause', exact: true }).tap();
  const frames = [];
  for (const [index, id] of ['march','squat','push','calf','reach'].entries()) {
    const avatar = page.locator('.exercise-art .avatar[data-ready=true]');
    await expect(avatar).toHaveAttribute('data-pose', id);
    // Wait for the actual rendered crop, rather than only the React attribute.
    await expect.poll(() => avatar.evaluate(c => c.toDataURL())).not.toBe(frames.at(-1) || '');
    frames.push(await avatar.evaluate(c => c.toDataURL()));
    if (index < 4) { await page.getByRole('button', { name: 'Skip', exact: true }).tap(); await page.getByRole('button', { name: 'Skip', exact: true }).tap(); }
  }
  expect(new Set(frames).size).toBe(5);
});
test('first real workout reward visibly restores the workshop', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const roofs = [];
  for (const count of [0,1]) {
    await seed(page, count); await page.getByRole('button', { name: 'Village', exact: true }).tap();
    const village = page.locator('.village-canvas[data-ready=true]'); await expect(village).toBeVisible();
    await expect(village).toHaveAttribute('data-building-stage', 'original');
    if (count) {
      await page.getByRole('button', { name: 'Workshop', exact: true }).tap();
      await page.getByRole('button', { name: 'Restore workshop · 1 timber' }).tap();
      await expect(village).toHaveAttribute('data-building-stage', 'restored');
    }
    const canvas = await page.locator('.village-canvas canvas').boundingBox();
    const scale = canvas.width / 320;
    roofs.push(await page.screenshot({ clip: { x: canvas.x + 205 * scale, y: canvas.y + 60 * scale, width: 94 * scale, height: 90 * scale } }));
    if (!count) await page.getByRole('button', { name: 'Workshop', exact: true }).tap();
    await expect(page.getByText(count ? /Workshop restored. A warm roof/ : /Cost: 1 timber earned/)).toBeVisible();
  }
  expect(roofs[0].equals(roofs[1])).toBe(false);
});