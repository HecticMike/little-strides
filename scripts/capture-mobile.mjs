import { webkit } from 'playwright';
import { mkdirSync } from 'node:fs';
import { freshState, createSession, finish } from '../src/engine.mjs';
mkdirSync('screenshots', { recursive: true });
const browser = await webkit.launch();
try {
  const page = await browser.newPage({ viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4197');
  await page.getByText('Offline ready', { exact: true }).waitFor();
  await page.locator('.avatar[data-ready=true]').waitFor();
  await page.screenshot({ path: 'screenshots/today-375.png' });
  await page.getByRole('button', { name: 'Village', exact: true }).tap();
  await page.locator('.village-canvas[data-ready=true]').waitFor();
  await page.screenshot({ path: 'screenshots/village-375.png' });
  await page.getByRole('button', { name: 'Today', exact: true }).tap();
  await page.getByRole('button', { name: 'Start 10-minute session' }).tap();
  await page.getByRole('button', { name: 'Pause', exact: true }).tap();
  await page.getByRole('button', { name: 'Resume', exact: true }).waitFor({ state: 'visible' });
  await page.locator('.workout-actions .primary:enabled').waitFor();
  await page.locator('.avatar[data-ready=true]').waitFor();
  await page.screenshot({ path: 'screenshots/workout-375.png' });
  let state = freshState(); const at = Date.now() - 2 * 86400_000;
  state.active = createSession(7, [], at); state = finish(state, true, at + 420_000);
  await page.evaluate(async state => {
    const db = await new Promise(resolve => { const r = indexedDB.open('little-strides', 1); r.onsuccess = () => resolve(r.result); });
    await new Promise(resolve => { const tx = db.transaction('state','readwrite'); tx.objectStore('state').put(state,'current'); tx.oncomplete = resolve; }); db.close();
  }, state);
  await page.reload(); await page.getByRole('button', { name: 'Village', exact: true }).tap();
  await page.locator('.village-canvas[data-ready=true][data-building-stage=restored]').waitFor();
  await page.screenshot({ path: 'screenshots/village-restored-375.png' });
  console.log('Captured Today, Village, paused Workout and restored Workshop at 375 × 667 (WebKit).');
} finally { await browser.close(); }