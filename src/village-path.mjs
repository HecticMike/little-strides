export const destinations = { 'Training green': [72, 184], Workshop: [248, 184], Garden: [88, 216] };
export function walkable(x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && x >= 1 && x <= 18 && y >= 3 && y <= 16 && !(y < 10 && (x < 7 || x > 12)) && !(x < 7 && y >= 14) && !(x >= 13 && y === 14);
}
export function route(from, to) {
  const start = from.map(n => Math.floor(n / 16)), end = to.map(n => Math.floor(n / 16));
  if (!walkable(...start) || !walkable(...end)) return [];
  const queue = [start], parents = new Map([[start.join(','), null]]);
  for (let i = 0; i < queue.length; i++) {
    const p = queue[i];
    if (p[0] === end[0] && p[1] === end[1]) {
      const path = []; let cursor = p;
      while (parents.get(cursor.join(','))) { path.unshift(cursor.map(n => n * 16 + 8)); cursor = parents.get(cursor.join(',')); }
      return path;
    }
    for (const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const next = [p[0]+dx,p[1]+dy], key = next.join(',');
      if (walkable(...next) && !parents.has(key)) { parents.set(key,p); queue.push(next); }
    }
  }
  return [];
}