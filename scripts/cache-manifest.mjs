import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildId } from './build-id.mjs';
const paths = ['./'];
function visit(dir, prefix = '') {
  for (const file of readdirSync(dir, { withFileTypes: true })) {
    const path = prefix + file.name;
    if (file.isDirectory()) visit(join(dir, file.name), `${path}/`);
    else if (path !== 'sw.js') paths.push(`./${path}`);
  }
}
visit('dist');
const source = readFileSync('public/sw.js', 'utf8').replace('__CACHE_ID__', buildId()).replace('/*__ASSETS__*/[]', JSON.stringify(paths));
writeFileSync('dist/sw.js', source);
console.log(`Precache: ${paths.length} local files, including all lazy village chunks.`);
