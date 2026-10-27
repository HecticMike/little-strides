export const POSES = ['stand', 'march', 'squat', 'push', 'calf', 'reach'];
export const AVATAR = { hair: '#48342d', skin: '#e8b48b', shadow: '#b87c61', shirts: ['#f2c86a', '#8cd4be', '#b5a0e7'], trousers: '#314e53', boots: '#253736' };
// One compact 192 × 120 atlas for every growth stage and exercise pose.
export function avatarAtlas() {
  const c = document.createElement('canvas'); c.width = 192; c.height = 120;
  const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = false;
  POSES.forEach((pose, frame) => AVATAR.shirts.forEach((shirt, stage) => {
    const x = frame * 32, y = stage * 40;
    const rect = (a, b, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(x + a, y + b, w, h); };
    const down = pose === 'squat' ? 5 : pose === 'calf' ? -2 : 0;
    rect(7, 37, 19, 2, '#20443c');
    rect(10, 5 + down, 13, 12, AVATAR.skin);
    rect(9, 3 + down, 15, 6, AVATAR.hair); rect(9, 8 + down, 3, 5, AVATAR.hair);
    rect(19, 10 + down, 2, 2, '#263d38'); rect(19, 14 + down, 3, 1, AVATAR.shadow);
    rect(10, 18 + down, 13, 11, shirt); rect(10, 26 + down, 13, 3, '#d69d50');
    if (pose === 'reach') { rect(6, 7 + down, 4, 15, AVATAR.skin); rect(23, 7 + down, 4, 15, AVATAR.skin); rect(6, 18 + down, 4, 5, shirt); rect(23, 18 + down, 4, 5, shirt); }
    else if (pose === 'push') { rect(22, 19 + down, 9, 4, AVATAR.skin); rect(27, 12 + down, 4, 10, AVATAR.skin); rect(22, 18 + down, 4, 6, shirt); rect(5, 20 + down, 5, 5, AVATAR.skin); }
    else { rect(6, 19 + down, 4, 6, shirt); rect(23, 19 + down, 4, 6, shirt); rect(6, 25 + down, 4, 5, AVATAR.skin); rect(23, pose === 'march' ? 19 : 25 + down, 4, 5, AVATAR.skin); }
    if (pose === 'squat') { rect(6, 30, 9, 5, AVATAR.trousers); rect(19, 30, 9, 5, AVATAR.trousers); rect(6, 34, 4, 4, AVATAR.boots); rect(24, 34, 4, 4, AVATAR.boots); }
    else { rect(11, 29 + down, 5, pose === 'march' ? 5 : 7, AVATAR.trousers); rect(18, 29 + down, 5, 7, AVATAR.trousers); rect(9, pose === 'march' ? 33 : 35 + down, 7, 3, AVATAR.boots); rect(18, 35 + down, 7, 3, AVATAR.boots); }
    if (stage === 2) { rect(12, 1 + down, 2, 3, '#fff4b3'); rect(18, 1 + down, 2, 3, '#fff4b3'); }
  }));
  return c;
}
export const avatarStage = completed => Math.min(2, Math.floor(completed / 3));
