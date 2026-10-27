import { test, expect } from '@playwright/test';
async function open(page) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await expect(page.getByRole('button', { name: 'Start 7-minute session' })).toBeEnabled();
  return errors;
}
async function assertFits(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const name of ['Pause', 'Skip', 'Replace']) {
    const box = await page.getByRole('button', { name, exact: true }).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
    expect(box.y).toBeGreaterThanOrEqual(0); expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize().height);
  }
}
for (const minutes of [7, 10, 15, 20]) test(`${minutes}-minute touch workout completes with durable history`, async ({ page }) => {
  await page.clock.install();
  const errors = await open(page);
  await page.getByRole('button', { name: `${minutes} MIN`, exact: true }).tap();
  await page.getByRole('button', { name: `Start ${minutes}-minute session` }).tap();
  await expect(page.getByRole('heading', { name: 'Easy march' })).toBeVisible();
  await assertFits(page);
  await page.clock.runFor(3500);
  await expect(page.getByText('PACE 2 / 15')).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).tap();
  // Restore a checkpoint at the final second. Full-duration boundaries are
  // exhaustively checked by engine tests; no wall-clock multi-minute waits.
  await page.evaluate(async minutes => {
    const db = await new Promise(resolve => { const r = indexedDB.open('little-strides', 1); r.onsuccess = () => resolve(r.result); });
    await new Promise(resolve => {
      const tx = db.transaction('state', 'readwrite'), store = tx.objectStore('state'), r = store.get('current');
      r.onsuccess = () => { const s = r.result; s.active.elapsedMs = minutes * 60_000 - 1000; s.active.runningSince = null; s.active.status = 'paused'; store.put(s, 'current'); };
      tx.oncomplete = resolve;
    }); db.close();
  }, minutes);
  await page.reload();
  await page.getByRole('button', { name: 'Resume', exact: true }).tap();
  await page.clock.runFor(1500);
  await expect(page.getByText('Session complete. Your village has grown a little.')).toBeVisible();
  await page.getByRole('button', { name: 'Journal', exact: true }).tap();
  await expect(page.getByText(`${minutes}-minute stride`, { exact: true })).toBeVisible();
  await expect(page.getByText('Complete', { exact: true })).toBeVisible();
  await page.reload(); await expect(page.getByText('1 little strides')).toBeVisible();
  expect(errors).toEqual([]);
});
test('pause, replacements, interruption, rotation and safe-area layout', async ({ page }) => {
  await page.clock.install(); await open(page);
  await page.getByRole('button', { name: 'Start 7-minute session' }).tap();
  await page.clock.runFor(3100);
  await page.getByRole('button', { name: 'Pause', exact: true }).tap();
  const countdown = await page.getByRole('timer').textContent();
  await page.clock.runFor(60_000); await expect(page.getByRole('timer')).toHaveText(countdown);
  await page.getByRole('button', { name: 'Replace', exact: true }).tap();
  await expect(page.getByRole('heading', { name: 'Gentle reach' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume', exact: true }).tap();
  await page.clock.runFor(1000); await page.reload();
  await expect(page.getByText(/Interrupted session saved/)).toBeVisible();
  const recovered = await page.getByRole('timer').textContent();
  await page.clock.runFor(120_000); await expect(page.getByRole('timer')).toHaveText(recovered);
  await page.getByRole('button', { name: 'Resume', exact: true }).tap();
  await page.setViewportSize({ width: 667, height: 375 }); await assertFits(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.addStyleTag({ content: '.workout {padding-top:35px!important;padding-bottom:34px!important}' });
  await assertFits(page);
  await page.getByRole('button', { name: 'Skip', exact: true }).tap();
  await expect(page.getByRole('heading', { name: 'Take a breath' })).toBeVisible();
});
test('suspended timer gap freezes at last observed checkpoint', async ({ page }) => {
  await page.clock.install(); await open(page);
  await page.getByRole('button', { name: 'Start 7-minute session' }).tap();
  await page.clock.runFor(2000);
  const before = Number.parseInt(await page.getByRole('timer').textContent());
  await page.clock.fastForward(60_000);
  await expect(page.getByText(/Interrupted session saved/)).toBeVisible();
  const after = Number.parseInt(await page.getByRole('timer').textContent());
  expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
  await page.clock.runFor(5000);
  expect(Number.parseInt(await page.getByRole('timer').textContent())).toBe(after);
});
test('offline first reload restores active session, village and sound assets', async ({ page, context }) => {
  const errors = await open(page);
  await expect(page.getByText('Offline ready', { exact: true })).toBeVisible({ timeout: 30000 });
  await page.getByRole('button', { name: 'Start 7-minute session' }).tap();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible();
  await page.waitForTimeout(1200);
  await context.setOffline(true); await page.reload();
  await expect(page.getByText(/Interrupted session saved/)).toBeVisible();
  page.on('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'End session', exact: true }).tap();
  await page.getByRole('button', { name: 'Village', exact: true }).tap();
  await expect(page.locator('.village-canvas canvas')).toBeVisible();
  const canvas = page.locator('.village-canvas canvas'), box = await canvas.boundingBox();
  await page.touchscreen.tap(box.x + box.width * .77, box.y + box.height * .48);
  await expect(page.getByRole('heading', { name: 'Workshop', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Garden', exact: true }).tap();
  await expect(page.getByRole('heading', { name: 'Garden', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await page.getByRole('button', { name: 'Test sound', exact: true }).tap();
  if (await page.evaluate(() => !!(window.AudioContext || window.webkitAudioContext))) {
    await expect(page.getByText(/Sound ready/).first()).toBeVisible();
    expect(await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.includes('/audio/')).length)).toBeGreaterThanOrEqual(2);
  } else {
    await expect(page.getByText(/Sound unavailable; visual cues stay on/).first()).toBeVisible();
    expect(await page.evaluate(async () => (await fetch('./audio/transition.wav')).ok && (await fetch('./audio/pace.wav')).ok)).toBe(true);
  }
  await page.getByRole('button', { name: 'Mute sound' }).tap();
  await expect(page.getByRole('button', { name: 'Unmute sound' })).toBeEnabled();
  await page.reload(); await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Unmute sound' })).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});
test('JSON export and import restore history; corrupt input preserves data', async ({ page }) => {
  await open(page); await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export JSON' }).tap();
  const file = await download, path = await file.path();
  page.on('dialog', dialog => dialog.accept());
  await page.locator('input[type=file]').setInputFiles(path);
  await expect(page.getByText('Backup restored on this device.')).toBeVisible();
  await page.locator('input[type=file]').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"format":"bad"}') });
  await expect(page.getByText(/not a valid Little Strides backup/)).toBeVisible();
  await expect(page.getByText('Stored on this device')).toBeVisible();
});
test('wake lock refusal retains usable workout and reduced-motion village loads', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: () => Promise.reject(new Error('not allowed')) } }));
  await page.emulateMedia({ reducedMotion: 'reduce' }); await open(page);
  await page.getByRole('button', { name: 'Village', exact: true }).tap();
  await expect(page.locator('.village-canvas canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Today', exact: true }).tap();
  await page.getByRole('button', { name: 'Start 7-minute session' }).tap();
  await expect(page.getByText(/Screen lock unavailable/)).toBeVisible(); await assertFits(page);
});
test('sound initialises by touch, volume applies, mute prevents cue playback', async ({ page }) => {
  await page.addInitScript(() => {
    window.__played = 0; window.__gain = [];
    if (!window.AudioBufferSourceNode) return;
    const start = AudioBufferSourceNode.prototype.start;
    AudioBufferSourceNode.prototype.start = function (...args) { window.__played++; return start.apply(this, args); };
    const Context = window.AudioContext || window.webkitAudioContext;
    const gain = Context.prototype.createGain;
    Context.prototype.createGain = function (...args) {
      const result = gain.apply(this, args);
      setTimeout(() => window.__gain.push(result.gain.value), 0);
      return result;
    };
  });
  await open(page); await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await page.getByRole('slider', { name: 'Cue volume' }).fill('0.2');
  await page.getByRole('button', { name: 'Test sound' }).tap();
  if (!await page.evaluate(() => !!(window.AudioContext || window.webkitAudioContext))) {
    await expect(page.getByText(/Sound unavailable; visual cues stay on/).first()).toBeVisible();
    await page.getByRole('button', { name: 'Mute sound' }).tap();
    await expect(page.getByRole('button', { name: 'Unmute sound' })).toHaveAttribute('aria-pressed', 'true');
    return; // Windows WebKit has no Web Audio. Physical iOS sound remains a device check.
  }
  await expect(page.getByText(/Sound ready/).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__played)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__gain[0])).toBeCloseTo(.2);
  await page.getByRole('button', { name: 'Mute sound' }).tap();
  await page.getByRole('button', { name: 'Test sound' }).tap();
  expect(await page.evaluate(() => window.__played)).toBe(1);
});
test('wake lock reacquires after release and visibility loss requires resume', async ({ page }) => {
  await page.addInitScript(() => {
    window.__locks = 0;
    Object.defineProperty(navigator, 'wakeLock', { configurable: true, value: { request: async () => {
      window.__locks++;
      const lock = new EventTarget(); lock.released = false;
      lock.release = async () => { lock.released = true; lock.dispatchEvent(new Event('release')); };
      window.__lock = lock; return lock;
    } } });
  });
  await open(page); await page.getByRole('button', { name: 'Start 7-minute session' }).tap();
  await expect.poll(() => page.evaluate(() => window.__locks)).toBe(1);
  await page.evaluate(() => window.__lock.release());
  await expect.poll(() => page.evaluate(() => window.__locks)).toBe(2);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText(/Interrupted session saved/)).toBeVisible();
  await page.getByRole('button', { name: 'Resume', exact: true }).tap();
  await expect.poll(() => page.evaluate(() => window.__locks)).toBe(3);
});
test('failed local write pauses safely and retry preserves the session', async ({ page }) => {
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (value, ...args) {
      if (window.__failSave && value.active) throw new DOMException('Full', 'QuotaExceededError');
      return put.call(this, value, ...args);
    };
  });
  await open(page); await page.evaluate(() => { window.__failSave = true; });
  await page.getByRole('button', { name: 'Start 7-minute session' }).tap();
  await expect(page.getByRole('alert')).toContainText('Local saving failed');
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeDisabled();
  await page.evaluate(() => { window.__failSave = false; });
  await page.getByRole('button', { name: 'Retry saving', exact: true }).tap();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Resume', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeEnabled();
});
