import { expect } from '@playwright/test';
export async function startWorkout(page, minutes = 10) {
  await page.getByRole('button', { name: `Start ${minutes}-minute session` }).tap();
  const review = page.getByRole('dialog', { name: 'Review this unreviewed routine' });
  if (await review.isVisible()) await review.getByRole('button', { name: 'Use this unreviewed routine' }).tap();
  await expect(page.locator('.workout')).toBeVisible();
}