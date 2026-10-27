import { expect } from '@playwright/test';
export async function enableCandidates(page) {
  for(const name of ['Easy march','Calf raise','Gentle reach'])await page.getByRole('checkbox',{name:'Enable '+name,exact:true}).check();
}
export async function startWorkout(page, minutes = 10) {
  await page.getByRole('button', { name: `Start ${minutes}-minute session` }).tap();
  const review = page.getByRole('dialog', { name: 'Review this unreviewed routine' });
  if (await review.isVisible()) {await enableCandidates(page);await review.getByRole('button', { name: 'Use enabled movements' }).tap();}
  await expect(page.locator('.workout')).toBeVisible();
  await page.locator('.workout-actions button:not(:disabled), [role=alert]').first().waitFor();
  // Existing movement-specific scenarios skip preparation explicitly. The Phase 4
  // ten-minute walkthrough verifies the complete preparation/rest/wind-down flow.
  const skip=page.getByRole('button',{name:'Skip',exact:true});
  if(await page.getByRole('alert').isVisible())return;
  if(await page.getByRole('heading',{name:'Preparation',exact:true}).isVisible())await skip.tap();
}