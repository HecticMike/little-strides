export const destinations = { 'Training green': [88, 152], Workshop: [232, 168], Garden: [152, 216] };
// Conservative feet-space boundaries registered to the approved painted courtyard.
// Roofs, garden beds, fences and thick edge foliage are not traversable.
const passages = {
  3:[9,10],4:[9,10],5:[9,10],6:[9,10],7:[9,10],8:[9,10],
  9:[4,14],10:[3,14],11:[8,14],12:[9,13],13:[9,13],
  14:[9,13],15:[9,12],16:[9,11],
};
export function walkable(x,y) {
  const row=passages[y];
  return Number.isInteger(x)&&Number.isInteger(y)&&!!row&&x>=row[0]&&x<=row[1];
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