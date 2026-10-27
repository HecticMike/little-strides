import { CHARACTER } from './art-spec.mjs';
export { CHARACTER };
export const POSES = CHARACTER.poses;
export const avatarStage = completed => Math.min(2, Math.floor(completed / 3));
let atlasPromise;
const loadImage = url => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error(`Artwork unavailable: ${url}`)); image.src = url; });
// Both renderers consume this exact atlas, assembled once from the common body
// and stage equipment. There is no independent village or workout character.
export function avatarAtlas() {
  return atlasPromise ||= Promise.all([loadImage(CHARACTER.body), loadImage(CHARACTER.equipment)]).then(([body, equipment]) => {
    const canvas = document.createElement('canvas');
    canvas.width = CHARACTER.frameWidth * POSES.length; canvas.height = CHARACTER.frameHeight * CHARACTER.stages.length;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    CHARACTER.stages.forEach((stage, i) => {
      ctx.drawImage(body, 0, i * 64);
      if (stage.equipmentRow !== null) ctx.drawImage(equipment, 0, stage.equipmentRow * 64, canvas.width, 64, 0, i * 64, canvas.width, 64);
    });
    return canvas;
  }).catch(error => { atlasPromise = null; throw error; });
}
export const avatarFrame = (pose, stage) => {
  if (!POSES.includes(pose) || !CHARACTER.stages[stage]) throw new Error('Unknown character frame.');
  return { x: POSES.indexOf(pose) * 48, y: stage * 64, w: 48, h: 64 };
};
export function avatarFingerprint(atlas, stage) {
  const f = avatarFrame('stand', stage), pixels = atlas.getContext('2d').getImageData(f.x, f.y, f.w, f.h).data;
  let hash = 2166136261; for (const n of pixels) hash = Math.imul(hash ^ n, 16777619);
  return (hash >>> 0).toString(16);
}