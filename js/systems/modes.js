'use strict';

/* ============================================================
   Match modes. Each mode defines how the score panel reads,
   how teams are scored, and how the winner line is phrased.
   The sim (painting, fighting, events) is shared by all modes.
   ============================================================ */

/* One mode: paint the ground AND splat rivals — score is coverage%
   plus 2 points per splat, so both halves of the fight count. */
const SPLAT_POINTS = 2;

const MODES = {
  classic: {
    key: 'classic', name: 'TURF SLAM', blurb: 'paint the town, splat the rest',
    panel: 'SCORE', winnerLine: 'takes the town!',
    scores: g => g.lastCoverage.map((c, i) => c * 100 + g.stats[i].splats * SPLAT_POINTS),
    fmt: v => v.toFixed(1),
  },
};

function currentMode() {
  return MODES.classic;
}

/* zones: the plaza plus two deterministic open spots, spread apart */
function computeZones(map) {
  const rng = makeRng(map.seed + 4242);
  const zones = [{ x: map.plaza.x, y: map.plaza.y, r: 110, owner: -1 }];
  let guard = 0;
  while (zones.length < 3 && guard++ < 400) {
    const x = 160 + rng() * (WORLD.w - 320);
    const y = 160 + rng() * (WORLD.h - 320);
    if (OBSTACLES.some(b => circleRectHit(x, y, 130, b.x, b.y, b.w, b.h))) continue;
    if (zones.some(z => dist(x, y, z.x, z.y) < 550)) continue;
    zones.push({ x, y, r: 110, owner: -1 });
  }
  return zones;
}

/* who owns a zone right now: the team with the most painted cells
   inside it (strictly ahead, and at least some paint) */
function zoneOwner(z) {
  const counts = [0, 0, 0, 0];
  const gr = Math.ceil(z.r / CELL);
  const gx0 = Math.floor(z.x / CELL), gy0 = Math.floor(z.y / CELL);
  for (let gy = gy0 - gr; gy <= gy0 + gr; gy++) {
    for (let gx = gx0 - gr; gx <= gx0 + gr; gx++) {
      if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) continue;
      const cx = gx * CELL + CELL / 2, cy = gy * CELL + CELL / 2;
      if (dist(z.x, z.y, cx, cy) > z.r) continue;
      const v = grid[gy * GRID_W + gx];
      if (v >= 0) counts[v]++;
    }
  }
  let best = 0, owner = -1, tie = false;
  counts.forEach((c, i) => {
    if (c > best) { best = c; owner = i; tie = false; }
    else if (c === best && c > 0) tie = true;
  });
  return tie ? -1 : owner;
}
