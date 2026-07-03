'use strict';

/* ============================================================
   Collision & placement queries against the active map.
   Buildings AND water both block movement.
   ============================================================ */

function collideWorld(x, y, r) {
  // keep on the paper
  x = clamp(x, r, WORLD.w - r);
  y = clamp(y, r, WORLD.h - r);
  for (const b of OBSTACLES) {
    const fix = circleRectResolve(x, y, r, b.x, b.y, b.w, b.h);
    if (fix) { x = fix.x; y = fix.y; }
  }
  return { x, y };
}

function pointBlocked(x, y) {
  if (x < 0 || y < 0 || x > WORLD.w || y > WORLD.h) return true;
  return OBSTACLES.some(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h);
}

/* Random open spot on the map (for pickups, bot targets) */
function randomOpenSpot(margin = 60) {
  for (let i = 0; i < 40; i++) {
    const x = margin + Math.random() * (WORLD.w - margin * 2);
    const y = margin + Math.random() * (WORLD.h - margin * 2);
    if (!OBSTACLES.some(b => circleRectHit(x, y, 30, b.x, b.y, b.w, b.h))) return { x, y };
  }
  return { x: WORLD.w / 2, y: WORLD.h / 2 };
}
