'use strict';

/* ============================================================
   Pencil-case interior theme — the hidden world inside the
   MESSY DESK pencil case. Quilted fabric lining, border
   stitching, a giant zipper running along the top edge, and
   padded slot dividers. Giant stationery reuses the desk
   theme's renderers.
   ============================================================ */

registerGround('caselining', (g, rng, map) => {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, WORLD.w, WORLD.h);
  // soft tonal patches so the fabric doesn't sit flat
  for (let i = 0; i < 16; i++) {
    g.fillStyle = `rgba(255,255,255,${rand(rng, 0.02, 0.05)})`;
    g.beginPath();
    g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
              rand(rng, 140, 320), rand(rng, 80, 170), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
  // quilted diamond pattern
  g.strokeStyle = 'rgba(220,232,242,0.16)';
  g.lineWidth = 1.4;
  const step = 130;
  for (let d = -WORLD.h; d < WORLD.w + WORLD.h; d += step) {
    g.beginPath(); g.moveTo(d, 0); g.lineTo(d + WORLD.h, WORLD.h); g.stroke();
    g.beginPath(); g.moveTo(d, 0); g.lineTo(d - WORLD.h, WORLD.h); g.stroke();
  }
  // stitch dots at the quilt crossings
  g.fillStyle = 'rgba(220,232,242,0.35)';
  for (let x = step / 2; x < WORLD.w; x += step) {
    for (let y = step / 2; y < WORLD.h; y += step) {
      g.beginPath(); g.arc(x + rand(rng, -6, 6), y + rand(rng, -6, 6), 2.4, 0, Math.PI * 2); g.fill();
    }
  }
  // border stitching, double-run like a real seam
  g.strokeStyle = 'rgba(220,232,242,0.55)';
  g.lineWidth = 2.4;
  g.setLineDash([16, 10]);
  wobblyRect(g, rng, 46, 46, WORLD.w - 92, WORLD.h - 92, 1.4);
  g.stroke();
  g.setLineDash([10, 12]);
  g.lineWidth = 1.4;
  wobblyRect(g, rng, 70, 70, WORLD.w - 140, WORLD.h - 140, 1.2);
  g.stroke();
  g.setLineDash([]);
  // the giant zipper along the top edge — the way you came in
  const zy = 26;
  g.strokeStyle = 'rgba(220,232,242,0.8)';
  g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, zy); g.lineTo(WORLD.w, zy); g.stroke();
  g.fillStyle = '#8fa8c4';
  for (let x = 20; x < WORLD.w; x += 34) {
    g.fillRect(x, zy - 8, 14, 7);
    g.fillRect(x + 17, zy + 1, 14, 7);
  }
  // zipper pull, hanging in at the entry point with light spilling
  const px = 1200;
  g.fillStyle = 'rgba(255,244,200,0.28)';
  g.beginPath();
  g.moveTo(px - 90, 0); g.lineTo(px + 90, 0); g.lineTo(px + 30, 220); g.lineTo(px - 30, 220);
  g.closePath(); g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 2.4;
  g.fillStyle = '#b8c6d8';
  g.beginPath(); g.roundRect(px - 13, zy + 8, 26, 52, 8); g.fill(); g.stroke();
  g.beginPath(); g.arc(px, zy + 74, 12, 0, Math.PI * 2); g.stroke();
  // stray graphite smudges and crumbs on the lining
  g.fillStyle = 'rgba(30,40,55,0.35)';
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    g.ellipse(rand(rng, 120, WORLD.w - 120), rand(rng, 120, WORLD.h - 120),
              rand(rng, 6, 18), rand(rng, 3, 8), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
});

/* a padded slot divider — the long fabric ridge between pen slots */
function drawDivider(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  t.fillStyle = '#3c5578';
  t.beginPath(); t.roundRect(x, y, w, h, h / 2); t.fill(); t.stroke();
  // seam down the middle + stitch dashes
  t.strokeStyle = 'rgba(220,232,242,0.55)';
  t.lineWidth = 1.4;
  t.setLineDash([12, 9]);
  t.beginPath();
  t.moveTo(x + 14, y + h / 2);
  t.lineTo(x + w - 14, y + h / 2);
  t.stroke();
  t.setLineDash([]);
  // elastic pen loops along the ridge
  t.strokeStyle = '#8fa8c4';
  t.lineWidth = 4;
  for (let lx = x + 70; lx < x + w - 50; lx += 160) {
    t.beginPath();
    t.arc(lx, y + h / 2, h * 0.62, Math.PI * 1.15, Math.PI * 1.85);
    t.stroke();
  }
}

registerObstacles({ divider: drawDivider });
