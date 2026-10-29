import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
export function buildId(root='.') {
  const hash = createHash('sha256');
  hash.update(process.env.LS_BUILD_PROFILE||'release');
  hash.update('base:').update(process.env.BASE_PATH||'./');
  const visit = p => {
    for (const file of readdirSync(join(root,p), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = join(p, file.name);
      if (file.isDirectory()) visit(name); else hash.update(name).update(readFileSync(join(root,name)));
    }
  };
  visit('src'); visit('public'); for(const file of ['index.html','package-lock.json','package.json','vite.config.mjs','scripts/build-comeback.mjs','scripts/cache-manifest.mjs','scripts/build-id.mjs','.env.comeback'])hash.update(file).update(readFileSync(join(root,file)));
  return hash.digest('hex').slice(0, 12);
}
