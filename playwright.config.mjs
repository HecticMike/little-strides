import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/mobile', timeout: 90_000, expect: { timeout: 10_000 }, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4197', actionTimeout: 10000, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'iphone-webkit', use: { ...devices['iPhone SE'], browserName: 'webkit', viewport: { width: 375, height: 667 } } },
    { name: 'android-chromium', use: { ...devices['Pixel 5'], browserName: 'chromium', viewport: { width: 393, height: 727 } } },
  ],
});
