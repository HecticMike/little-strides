import { test, expect } from '@playwright/test';

const base = process.env.PAGES_TEST_PATH || '/';

test('Pages path serves the complete installable app without root asset requests', async ({ page }, info) => {
  const errors = [], paths = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.protocol === 'http:' && url.origin === 'http://127.0.0.1:4197') paths.push(url.pathname);
  });
  await page.goto(base);
  await expect(page.getByText('Offline ready', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start 10-minute session' })).toBeVisible();
  const install = await page.evaluate(async () => {
    const manifestURL = new URL(document.querySelector('link[rel=manifest]').href);
    const manifest = await (await fetch(manifestURL)).json();
    const registration = await navigator.serviceWorker.getRegistration();
    const icons = await Promise.all(manifest.icons.map(async icon => {
      const url = new URL(icon.src, manifestURL);
      return { path: url.pathname, ok: (await fetch(url)).ok };
    }));
    return { display: manifest.display, start: new URL(manifest.start_url, manifestURL).pathname,
      scope: new URL(registration.scope).pathname, icons };
  });
  expect(install.display).toBe('standalone');
  expect(install.start).toBe(base);
  expect(install.scope).toBe(base);
  for (const icon of install.icons) { expect(icon.ok).toBe(true); expect(icon.path.startsWith(base)).toBe(true); }
  await page.screenshot({ path: info.outputPath('pages-today.png') });
  await page.getByRole('button', { name: 'Village', exact: true }).tap();
  await expect(page.locator('.village-canvas[data-ready=true]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('pages-village.png') });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  expect(paths.filter(path => !path.startsWith(base))).toEqual([]);
});

test('Pages installation keeps preferences through backup import and offline reload', async ({ page, context }) => {
  await page.goto(base);
  await expect(page.getByText('Offline ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await expect(page.getByText('No sign-in is required.', { exact: false })).toBeVisible();
  const mute = page.getByRole('button', { name: 'Mute sound', exact: true });
  if (await mute.count()) await mute.tap();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: true }).tap();
  const file = await download;
  await page.getByRole('button', { name: 'Unmute sound', exact: true }).tap();
  page.once('dialog', dialog => dialog.accept());
  await page.locator('input[type=file]').setInputFiles(await file.path());
  await expect(page.getByRole('status').filter({ hasText: 'Backup restored on this device.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Unmute sound', exact: true })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Unmute sound', exact: true })).toBeVisible();
  const assets = await page.evaluate(async () => Promise.all(['./art/icons.png', './art/training.png', './audio/transition.wav'].map(async path => (await fetch(path)).ok)));
  expect(assets).toEqual([true, true, true]);
  await page.getByRole('button', { name: 'Village', exact: true }).tap();
  await expect(page.locator('.village-canvas[data-ready=true]')).toBeVisible();
});
