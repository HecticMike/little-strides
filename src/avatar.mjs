import { CHARACTER, CORE_ILLUSTRATIONS } from './art-spec.mjs';
export { CHARACTER };
export const POSES = CHARACTER.poses;
export const avatarStage = completed => Math.min(2, Math.floor(completed / 3));
const atlases = {};
let bodyPromise;
const loadImage = url => new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = () => reject(new Error(`Artwork unavailable: ${url}`)); image.src = url; });
// Both outfits use exactly the same body, face, proportions and stage definition.
// Training replaces only equipment: no independently drawn exercise avatar.
export function avatarAtlas(outfit = 'adventure') {
  if (!['adventure','training'].includes(outfit)) throw new Error('Unknown character outfit.');
  return atlases[outfit] ||= Promise.all([
    bodyPromise ||= loadImage(CHARACTER.body),
    loadImage(outfit === 'training' ? CHARACTER.trainingEquipment : CHARACTER.equipment),
  ]).then(([body, equipment]) => {
    const canvas = document.createElement('canvas'), w=CHARACTER.frameWidth, h=CHARACTER.frameHeight;
    canvas.width = w * POSES.length; canvas.height = h * CHARACTER.stages.length;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
    CHARACTER.stages.forEach((stage, i) => {
      ctx.drawImage(body, 0, i*h);
      const row=outfit==='training' ? i : stage.equipmentRow;
      if (row !== null) ctx.drawImage(equipment,0,row*h,canvas.width,h,0,i*h,canvas.width,h);
    });
    return canvas;
  }).catch(error => { atlases[outfit]=undefined; bodyPromise=undefined; throw error; });
}
export const avatarFrame = (pose, stage) => {
  if (!POSES.includes(pose) || !CHARACTER.stages[stage]) throw new Error('Unknown character frame.');
  return { x: POSES.indexOf(pose)*CHARACTER.frameWidth, y: stage*CHARACTER.frameHeight, w: CHARACTER.frameWidth, h: CHARACTER.frameHeight };
};
// The adventure standing frame is the canonical reference fingerprint, irrespective
// of the pose/outfit currently displayed. Actual outfit pixels have a separate hash.
export function avatarFingerprint(atlas, stage) {
  const f=avatarFrame('stand',stage), pixels=atlas.getContext('2d').getImageData(f.x,f.y,f.w,f.h).data;
  let hash=2166136261; for (const n of pixels) hash=Math.imul(hash^n,16777619);
  return (hash>>>0).toString(16);
}

let corePromise;
export const coreIllustrationAtlas=()=>corePromise ||= loadImage(CORE_ILLUSTRATIONS.body).catch(error=>{corePromise=undefined;throw error;});
export function coreIllustrationFrame(id,stage){
  const index=CORE_ILLUSTRATIONS.poses.indexOf(id);if(index<0||!CHARACTER.stages[stage])throw new Error('Unknown core illustration.');
  return {x:index*CORE_ILLUSTRATIONS.frameWidth,y:stage*CORE_ILLUSTRATIONS.frameHeight,w:CORE_ILLUSTRATIONS.frameWidth,h:CORE_ILLUSTRATIONS.frameHeight};
}
