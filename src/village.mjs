import Phaser from 'phaser';
import { avatarAtlas } from './avatar.mjs';
export function createVillage(parent, stage, onVisit) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  class Village extends Phaser.Scene {
    create() {
      const g = this.add.graphics();
      const rect = (x, y, w, h, color) => { g.fillStyle(color); g.fillRect(x, y, w, h); };
      rect(0, 0, 320, 280, 0x91b39a);
      rect(0, 0, 320, 53, 0xd6e6c3);
      rect(0, 53, 320, 18, 0x719780);
      rect(140, 80, 38, 200, 0xd9c38f); rect(25, 179, 270, 26, 0xd9c38f);
      for (let i = 0; i < 40; i++) rect((i * 67 + 13) % 314, 80 + (i * 31) % 196, 3, 4, 0x799e7d);
      const tree = (x, y) => { rect(x + 9, y + 18, 7, 22, 0x755c46); rect(x, y + 10, 27, 20, 0x426e57); rect(x + 5, y, 18, 24, 0x557f58); rect(x + 8, y + 4, 7, 9, 0x7c9b65); };
      [12, 50, 263, 294].forEach((x, i) => tree(x, 42 + i % 2 * 12));
      tree(12, 225); tree(276, 219);
      rect(43, 95, 64, 66, 0xe8dab0); rect(36, 88, 78, 14, 0x8c604c); rect(44, 78, 62, 12, 0xa87354); rect(52, 68, 46, 12, 0xb48158); rect(66, 126, 18, 35, 0x596a5c); rect(48, 112, 12, 14, 0x86b7b0); rect(89, 112, 12, 14, 0x86b7b0);
      rect(215, 106, 62, 54, 0xc2b68d); rect(207, 92, 78, 18, 0x5c7772); rect(216, 82, 61, 12, 0x6c8980); rect(235, 134, 16, 26, 0x675b48); rect(255, 118, 13, 12, 0x9dc4ba);
      rect(49, 223, 65, 35, 0x795e46);
      for (let i = 0; i < 12; i++) { rect(54 + i % 6 * 10, 225 + Math.floor(i / 6) * 16, 4, 11, 0x6d8b52); if (i < Math.min(12, stage * 3 + 1)) rect(52 + i % 6 * 10, 223 + Math.floor(i / 6) * 16, 8, 5, 0xf0ca6d); }
      const atlas = this.textures.addCanvas('avatar', avatarAtlas());
      atlas.add('standing', 0, 0, stage * 40, 32, 40);
      this.player = this.add.image(160, 210, 'avatar', 'standing').setOrigin(0.5, 1).setScale(1.5);
      this.input.on('pointerdown', pointer => {
        const x = Phaser.Math.Clamp(pointer.x, 22, 298), y = Phaser.Math.Clamp(pointer.y, 110, 268);
        this.tweens.killTweensOf(this.player);
        this.tweens.add({ targets: this.player, x, y, duration: reduced ? 0 : 300, ease: 'Linear' });
        if (x < 115 && y < 180) onVisit('Training green');
        else if (x > 200 && y < 180) onVisit('Workshop');
        else if (x < 125 && y > 215) onVisit('Garden');
      });
      this.add.text(13, 12, 'THE LITTLE VILLAGE', { fontFamily: 'monospace', fontSize: '15px', color: '#294d41' });
    }
  }
  return new Phaser.Game({ type: Phaser.AUTO, parent, width: 320, height: 280, pixelArt: true, roundPixels: true, antialias: false, backgroundColor: '#91b39a', fps: { target: 30, forceSetTimeOut: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }, scene: Village, audio: { noAudio: true }, banner: false });
}
