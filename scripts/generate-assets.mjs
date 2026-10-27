import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
mkdirSync('public/icons', { recursive: true }); mkdirSync('public/audio', { recursive: true });
const crc32 = b => {
  let crc = -1;
  for (const byte of b) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ -1) >>> 0;
};
function chunk(name, data) {
  const n = Buffer.from(name), length = Buffer.alloc(4), crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length); crc.writeUInt32BE(crc32(Buffer.concat([n, data])));
  return Buffer.concat([length, n, data, crc]);
}
for (const [name, size] of [['icon-192', 192], ['icon-512', 512], ['maskable-512', 512], ['apple-touch-icon', 180]]) {
  const scan = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = Math.floor(x * 32 / size), py = Math.floor(y * 32 / size);
    let color = [20, 44, 41];
    if (px >= 15 && px <= 17 && py >= 12 && py <= 24) color = [174, 200, 142];
    if ((px >= 9 && px <= 15 && py >= 11 && py <= 15) || (px >= 17 && px <= 23 && py >= 7 && py <= 12)) color = [230, 200, 118];
    if (px >= 10 && px <= 22 && py >= 25 && py <= 26) color = [174, 200, 142];
    const offset = y * (size * 3 + 1) + 1 + x * 3; scan.set(color, offset);
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 2;
  writeFileSync(`public/icons/${name}.png`, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(scan)), chunk('IEND', Buffer.alloc(0))]));
}
for (const [name, frequency, seconds] of [['transition', 660, 0.3], ['pace', 440, 0.065]]) {
  const rate = 22050, samples = Math.floor(rate * seconds), b = Buffer.alloc(44 + samples * 2);
  b.write('RIFF'); b.writeUInt32LE(b.length - 8, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) { const t = i / rate, envelope = Math.min(1, t / .008) * Math.max(0, 1 - t / seconds); b.writeInt16LE(Math.round(Math.sin(2 * Math.PI * frequency * t) * envelope * 11000), 44 + i * 2); }
  writeFileSync(`public/audio/${name}.wav`, b);
}
console.log('Generated local PNG install icons and gentle WAV cues.');
