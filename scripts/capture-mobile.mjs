import { webkit } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('screenshots',{recursive:true});
const browser=await webkit.launch();
try {
  const page=await browser.newPage({viewport:{width:375,height:667},isMobile:true,hasTouch:true});
  await page.clock.install();await page.goto('http://127.0.0.1:4197');
  await page.getByText('Offline ready',{exact:true}).waitFor();await page.locator('.avatar[data-ready=true]').waitFor();
  await page.screenshot({path:'screenshots/today-375.png'});
  await page.getByRole('button',{name:'7 MIN',exact:true}).tap();await page.getByRole('button',{name:'Start 7-minute session'}).tap();
  await page.getByRole('dialog').getByRole('button',{name:'Use this unreviewed routine'}).tap();
  await page.locator('.workout-actions .primary:enabled').waitFor();await page.locator('.avatar[data-ready=true]').waitFor();
  await page.clock.runFor(3200);await page.screenshot({path:'screenshots/workout-375.png'});
  await page.getByRole('button',{name:'Mute sound'}).tap();await page.clock.runFor(417500);
  await page.getByText('Session complete. 1 timber earned. Visit the workshop when ready.').waitFor();
  await page.getByRole('button',{name:'Village',exact:true}).tap();await page.locator('.village-canvas[data-ready=true]').waitFor();
  await page.screenshot({path:'screenshots/village-375.png'});
  await page.getByRole('button',{name:'Workshop',exact:true}).tap();await page.clock.runFor(2500);
  await page.getByRole('button',{name:'Restore workshop · 1 timber'}).waitFor();
  await page.screenshot({path:'screenshots/workshop-before-375.png'});
  await page.getByRole('button',{name:'Restore workshop · 1 timber'}).tap();
  await page.getByText('Workshop restored. A warm roof',{exact:false}).waitFor();await page.clock.runFor(1000);
  await page.locator('.village-canvas[data-building-stage=restored]').waitFor();await page.screenshot({path:'screenshots/workshop-after-375.png'});
  await page.getByRole('button',{name:'Close workshop'}).tap();await page.screenshot({path:'screenshots/village-restored-375.png'});
  console.log('Captured Today, Village, active Workout and workshop before/after a full timed workout and saved purchase.');
} finally {await browser.close();}