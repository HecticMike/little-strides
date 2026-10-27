import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
export function buildId() {
  const hash = createHash('sha256');
  const visit = p => {
    for (const file of readdirSync(p, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = join(p, file.name);
      if (file.isDirectory()) visit(name); else hash.update(name).update(readFileSync(name));
    }
  };
  visit('src'); visit('public'); hash.update(readFileSync('index.html')); hash.update(readFileSync('package-lock.json'));
  return hash.digest('hex').slice(0, 12);
}
