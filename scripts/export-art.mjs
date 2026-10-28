import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CHARACTER, WORLD, PALETTE, CORE_ILLUSTRATIONS } from '../src/art-spec.mjs';
import {EXERCISES} from '../src/catalog.mjs';
// Review-only branch: never writes public art or live/core masters.
if (process.argv.includes('--progression-prototype')) {
  await import('./export-progression.mjs');
  process.exit(0);
}
const executable = process.env.ASEPRITE_PATH || 'C:/Program Files/Aseprite/Aseprite.exe';
if (!existsSync(executable)) throw new Error('Set ASEPRITE_PATH to the local Aseprite executable.');
const characterPalette = readFileSync('art/palette.gpl','utf8').split(/\r?\n/).filter(l=>/^\s*\d+\s+\d+\s+\d+/.test(l)).map(l=>'#'+l.trim().split(/\s+/).slice(0,3).map(n=>Number(n).toString(16).padStart(2,'0')).join(''));
const assets = ['hero-body', 'hero-equipment', 'hero-training-outfit', 'tiles', 'village-ground', 'village-foreground', 'workshop-context', 'buildings', 'vista', 'training', 'icons'];
const run = args => { const p = spawnSync(executable, args, { stdio: 'inherit', windowsHide: true }); if (p.status !== 0) throw new Error('Aseprite export failed.'); };
mkdirSync('art/source', { recursive: true }); mkdirSync('public/art', { recursive: true });
for (const name of assets) {
  const source = `art/source/${name}.aseprite`;
  if (process.argv.includes('--seed') && !existsSync(source)) run(['-b', `art/seed/${name}.png`, '--save-as', source]);
  if (!existsSync(source)) throw new Error(`Missing editable master ${source}. Restore this approved master from version control.`);
  run(['-b', source, '--save-as', `public/art/${name}.png`]);
}
if (process.argv.includes('--motion') || readFileSync('public/art/hero-body.png').readUInt32BE(16) < CHARACTER.poses.length * CHARACTER.frameWidth) {
  run(['-b', '--script', 'scripts/derive-motion.lua']);
  for (const name of ['hero-body', 'hero-equipment']) run(['-b', 'art/source/' + name + '.aseprite', '--save-as', 'public/art/' + name + '.png']);
}
writeFileSync('public/art/avatar.json', JSON.stringify({ ...CHARACTER, coreIllustrations:{...CORE_ILLUSTRATIONS,characterId:CHARACTER.id,stages:CHARACTER.stages}, palette: characterPalette, worldPalette: PALETTE, world: WORLD, frames: CHARACTER.poses.map((pose, i) => ({ id: pose, artStatus: EXERCISES.find(e=>e.pose===pose)?.artStatus || (pose==='lying'?'provisional':'stylised'), available: !['squat','push','lying'].includes(pose), x: i * CHARACTER.frameWidth, y: 0, w: CHARACTER.frameWidth, h: CHARACTER.frameHeight, usage: pose === 'lying' ? 'identity-study-only' : pose.startsWith('walk-') || pose === 'idle-blink' ? 'village-animation' : 'stylised-game-pose' })), review: 'Approved generated character identity, quantised and layered in Aseprite. Stylised keys are not clinically validated demonstrations; squat, push and lying artwork is withheld.' }, null, 2) + '\n');
mkdirSync('art/review', {recursive:true});
run(['-b', '--script', 'scripts/export-character-study.lua']);
run(['-b', '--script', 'scripts/export-core-illustrations.lua']);
run(['-b', '--script', 'scripts/export-interface-art.lua']);
run(['-b', '--script', 'scripts/audit-art.lua']);
console.log('Aseprite masters exported with stable frame metadata.');