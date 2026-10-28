import { expect } from '@playwright/test';
export async function enableCandidates(page) {
  const wanted=['Enable Easy march','Enable Calf raise','Enable Gentle reach'];
  for(const input of await page.getByRole('dialog').getByRole('checkbox').all()){await expect(page.getByRole('button',{name:'Save choices',exact:true})).toBeEnabled();if(!['Enable Wall push','Enable Shallow squat','Enable Modified dead bug'].includes(await input.getAttribute('aria-label')))await input.setChecked(wanted.includes(await input.getAttribute('aria-label')));}
}
export async function startWorkout(page, minutes = 10) {
  // Existing movement-specific tests deliberately use the original three-candidate fixture.
  // Fresh-user recommendation behaviour has its own suggestions-motion scenarios.
  await page.getByRole('button',{name:`Start ${minutes}-minute session`}).waitFor();
  await page.getByRole('button',{name:'Review or disable movements',exact:true}).tap();
  await enableCandidates(page);
  await page.getByRole('button',{name:'Save choices',exact:true}).tap();
  await page.getByRole('button', { name: `Start ${minutes}-minute session` }).tap();
  await expect(page.locator('.workout')).toBeVisible();
  await page.locator('.workout-actions button:not(:disabled), [role=alert]').first().waitFor();
  // Existing movement-specific scenarios skip preparation explicitly. The Phase 4
  // ten-minute walkthrough verifies the complete preparation/rest/wind-down flow.
  const skip=page.getByRole('button',{name:'Skip',exact:true});
  if(await page.getByRole('alert').isVisible())return;
  if(await page.getByRole('heading',{name:'Preparation',exact:true}).isVisible())await skip.tap();
}