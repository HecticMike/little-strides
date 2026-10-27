import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CHARACTER, WORLD, PALETTE } from '../src/art-spec.mjs';
const executable = process.env.ASEPRITE_PATH || 'C:/Program Files/Aseprite/Aseprite.exe';
if (!existsSync(executable)) throw new Error('Set ASEPRITE_PATH to the local Aseprite executable.');
const assets = ['hero-body', 'hero-equipment', 'tiles', 'village-ground', 'village-foreground', 'buildings', 'vista', 'training', 'icons'];
const run = args => { const p = spawnSync(executable, args, { stdio: 'inherit', windowsHide: true }); if (p.status !== 0) throw new Error('Aseprite export failed.'); };
mkdirSync('art/source', { recursive: true }); mkdirSync('public/art', { recursive: true });
for (const name of assets) {
  const source = `art/source/${name}.aseprite`;
  if (process.argv.includes('--seed') && !existsSync(source)) run(['-b', `art/seed/${name}.png`, '--save-as', source]);
  if (!existsSync(source)) throw new Error(`Missing editable master ${source}. Run npm run art:seed once.`);
  run(['-b', source, '--save-as', `public/art/${name}.png`]);
}
if (process.argv.includes('--motion') || readFileSync('public/art/hero-body.png').readUInt32BE(16) < CHARACTER.poses.length * 48) {
  run(['-b', '--script', 'scripts/derive-motion.lua']);
  for (const name of ['hero-body', 'hero-equipment']) run(['-b', 'art/source/' + name + '.aseprite', '--save-as', 'public/art/' + name + '.png']);
}
writeFileSync('public/art/avatar.json', JSON.stringify({ ...CHARACTER, palette: PALETTE, world: WORLD, frames: CHARACTER.poses.map((pose, i) => ({ id: pose, x: i * 48, y: 0, w: 48, h: 64, usage: pose === 'lying' ? 'identity-study-only' : pose.startsWith('walk-') || pose === 'idle-blink' ? 'village-animation' : 'stylised-game-pose' })), review: 'Original initial game artwork; movement illustrations are not clinically validated demonstrations.' }, null, 2) + '\n');
console.log('Aseprite masters exported with stable frame metadata.');