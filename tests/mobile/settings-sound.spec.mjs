import { test, expect } from '@playwright/test';
const base = process.env.PAGES_TEST_PATH || '/';

test('sound test has its own touch row and explains mute and zero volume', async ({ page }, info) => {
  for (const width of [320, 375, 393]) {
    await page.setViewportSize({ width, height: 667 });
    await page.goto(base);
    await page.getByRole('button', { name: 'Settings', exact: true }).tap();
    const section = page.getByRole('region', { name: 'Workout sound settings' });
    const testSound = section.getByRole('button', { name: 'Test sound', exact: true });
    await testSound.scrollIntoViewIfNeeded();
    const testBox = await testSound.boundingBox();
    const toggleBox = await section.locator('.audio-controls button').boundingBox();
    const sliderBox = await section.getByRole('slider', { name: 'Cue volume' }).boundingBox();
    expect(testBox.y - (toggleBox.y + toggleBox.height)).toBeGreaterThanOrEqual(10);
    expect(testBox.y - (sliderBox.y + sliderBox.height)).toBeGreaterThanOrEqual(10);
    expect(testBox.height).toBeGreaterThanOrEqual(44);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (await section.getByRole('button', { name: 'Mute sound', exact: true }).count()) {
      await section.getByRole('button', { name: 'Mute sound', exact: true }).tap();
    }
    await testSound.tap();
    await expect(page.getByRole('status').filter({ hasText: 'Sound is off.' })).toBeVisible();
    await section.getByRole('button', { name: 'Unmute sound', exact: true }).tap();
    await section.getByRole('slider', { name: 'Cue volume' }).fill('0');
    await testSound.tap();
    await expect(page.getByRole('status').filter({ hasText: 'Cue volume is zero.' })).toBeVisible();
    await section.getByRole('slider', { name: 'Cue volume' }).fill('0.5');
    await page.screenshot({ path: info.outputPath(`sound-settings-${width}.png`) });
  }
});

test('touch sound test requests iPhone media routing and schedules an actual decoded cue', async ({ page }) => {
  await page.addInitScript(() => {
    window.__soundStarts = 0; window.__soundCategory = '';
    const session = {};
    Object.defineProperty(session, 'type', { set(value) { window.__soundCategory = value; } });
    Object.defineProperty(navigator, 'audioSession', { configurable: true, value: session });
    if (window.AudioBufferSourceNode) {
      const start = AudioBufferSourceNode.prototype.start;
      AudioBufferSourceNode.prototype.start = function (...args) { window.__soundStarts++; return start.apply(this, args); };
    }
  });
  await page.goto(base);
  await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await page.getByRole('button', { name: 'Test sound', exact: true }).tap();
  if (await page.evaluate(() => !!(window.AudioContext || window.webkitAudioContext))) {
    await expect(page.getByRole('status').filter({ hasText: 'Test tone sent.' })).toBeVisible();
    expect(await page.evaluate(() => window.__soundCategory)).toBe('playback');
    expect(await page.evaluate(() => window.__soundStarts)).toBe(1);
  } else {
    await expect(page.getByRole('status').filter({ hasText: 'Sound unavailable' })).toBeVisible();
  }
});
