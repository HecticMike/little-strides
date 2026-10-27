import Phaser from 'phaser';
import { avatarAtlas, avatarFrame, avatarFingerprint, CHARACTER, POSES } from './avatar.mjs';
import { WORLD } from './art-spec.mjs';
const destinations = { 'Training green': [72, 180], Workshop: [248, 180], Garden: [88, 208] };
function walkable(x, y) {
  return x >= 1 && x <= 18 && y >= 3 && y <= 16 && !(y < 10 && (x < 7 || x > 12)) && !(x < 7 && y >= 14) && !(x >= 13 && y === 14);
}
export function route(from, to) {
  const start = from.map(n => Math.floor(n / 16)), end = to.map(n => Math.floor(n / 16));
  if (!walkable(...end)) return [];
  const queue = [start], parents = new Map([[start.join(','), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p[0] === end[0] && p[1] === end[1]) {
      const path = []; let cursor = p;
      while (parents.get(cursor.join(','))) { path.unshift(cursor.map(n => n * 16 + 8)); cursor = parents.get(cursor.join(',')); }
      return path;
    }
    for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const next = [p[0] + dx, p[1] + dy], key = next.join(',');
      if (walkable(...next) && !parents.has(key)) { parents.set(key, p); queue.push(next); }
    }
  }
  return [];
}
export async function createVillage(parent, stage, completed, onVisit) {
  const atlas = await avatarAtlas(), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const restored = completed >= WORLD.workshopUnlock;
  class Village extends Phaser.Scene {
    preload() {
      for (const name of ['village-ground', 'village-foreground']) this.load.image(name, `./art/${name}.png`);
      this.load.spritesheet('buildings', './art/buildings.png', { frameWidth: 96, frameHeight: 112 });
      this.load.spritesheet('icons', './art/icons.png', { frameWidth: 16, frameHeight: 16 });
    }
    create() {
      this.add.image(0, 0, 'village-ground').setOrigin(0);
      this.add.image(14, 44, 'buildings', 0).setOrigin(0).setDepth(148);
      this.add.image(204, 45, 'buildings', restored ? 2 : 1).setOrigin(0).setDepth(149);
      this.add.image(0, 0, 'village-foreground').setOrigin(0).setDepth(1000);
      for (let i = 0; i < Math.min(12, completed); i++) this.add.image(39 + i % 6 * 10, 239 + Math.floor(i / 6) * 12, 'icons', 4).setScale(.5).setDepth(260);
      const texture = this.textures.addCanvas('hero', atlas);
      POSES.forEach(pose => { const f = avatarFrame(pose, stage); texture.add(pose, 0, f.x, f.y, f.w, f.h); });
      this.player = this.add.image(168, 216, 'hero', 'stand').setOrigin(.5, 1).setScale(.75).setDepth(216);
      this.path = [];
      const visit = name => { this.path = route([this.player.x, this.player.y], destinations[name]); onVisit(name); };
      this.game.events.on('visit', visit);
      this.input.on('pointerdown', p => {
        if (p.y < 164 && p.y > 55 && p.x < 115) return visit('Training green');
        if (p.y < 164 && p.y > 55 && p.x > 204) return visit('Workshop');
        if (p.x < 112 && p.y > 220) return visit('Garden');
        this.path = route([this.player.x, this.player.y], [p.x, p.y]);
        if (reduced && this.path.length) { const end = this.path.at(-1); this.player.setPosition(...end).setDepth(end[1]); this.path = []; }
      });
      if (!reduced) {
        for (const [x,y] of [[119,153],[199,153],[93,204]]) {
          const light = this.add.rectangle(x, y, 2, 2, 0xfff0c2, .6).setDepth(500);
          this.tweens.add({ targets: light, alpha: .2, y: y - 3, duration: 2400, yoyo: true, repeat: -1 });
        }
      }
      parent.dataset.avatarId = CHARACTER.id;
      parent.dataset.avatarStage = CHARACTER.stages[stage].id;
      parent.dataset.avatarFingerprint = avatarFingerprint(atlas, stage);
      parent.dataset.buildingStage = restored ? 'restored' : 'original';
      parent.dataset.ready = 'true';
    }
    update(_time, delta) {
      if (!this.player || !this.path.length) { this.player?.setFrame('stand'); return; }
      const [x,y] = this.path[0], dx = x - this.player.x, dy = y - this.player.y;
      const distance = Math.hypot(dx, dy), step = Math.min(delta, 50) * .11;
      if (distance <= step || reduced) { this.player.setPosition(x,y); this.path.shift(); }
      else { this.player.x += dx / distance * step; this.player.y += dy / distance * step; }
      this.player.setDepth(Math.round(this.player.y)).setFrame('march');
    }
  }
  return new Phaser.Game({ type: Phaser.AUTO, parent, width: WORLD.width, height: WORLD.height, pixelArt: true, roundPixels: true, antialias: false, backgroundColor: '#344e48', fps: { target: 30, forceSetTimeOut: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: Village, audio: { noAudio: true }, banner: false });
}