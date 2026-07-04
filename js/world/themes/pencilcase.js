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
  // sticker decals someone stuck to the lining — stars and hearts
  const stickerCols = ['#f0b41c', '#e6392a', '#3ba24f', '#2f66e0'];
  for (let i = 0; i < 9; i++) {
    const sx = rand(rng, 160, WORLD.w - 160), sy = rand(rng, 200, WORLD.h - 160);
    const sr = rand(rng, 22, 34);
    g.save();
    g.translate(sx, sy);
    g.rotate(rand(rng, -0.5, 0.5));
    g.fillStyle = stickerCols[i % 4];
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 3;
    if (i % 2) {
      // star sticker
      g.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + k * Math.PI / 5;
        const rr = k % 2 ? sr * 0.45 : sr;
        k === 0 ? g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
                : g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      g.closePath();
    } else {
      // heart sticker
      g.beginPath();
      g.moveTo(0, sr * 0.9);
      g.bezierCurveTo(-sr * 1.2, sr * 0.1, -sr * 0.6, -sr * 0.8, 0, -sr * 0.2);
      g.bezierCurveTo(sr * 0.6, -sr * 0.8, sr * 1.2, sr * 0.1, 0, sr * 0.9);
      g.closePath();
    }
    g.fill(); g.stroke();
    g.restore();
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

/* a bundle of crayons lying in a slot — worn tips, paper sleeves */
function drawCrayons(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cols = ['#e6392a', '#2f66e0', '#3ba24f'];
  const rows = Math.min(3, Math.max(2, Math.round(h / 40)));
  for (let k = 0; k < rows; k++) {
    const cy = y + h * (k + 0.5) / rows;
    const col = cols[k % 3];
    const off = (k % 2) * 30;
    t.strokeStyle = INK;
    t.lineWidth = 2;
    t.fillStyle = col;
    // body
    t.beginPath(); t.roundRect(x + 12 + off, cy - 13, w - 70 - off, 26, 6); t.fill(); t.stroke();
    // paper sleeve band
    t.fillStyle = 'rgba(255,255,255,0.35)';
    t.fillRect(x + 40 + off, cy - 13, (w - 70 - off) * 0.45, 26);
    t.strokeRect(x + 40 + off, cy - 13, (w - 70 - off) * 0.45, 26);
    // worn conical tip
    t.fillStyle = col;
    t.beginPath();
    t.moveTo(x + w - 58, cy - 13);
    t.lineTo(x + w - 14, cy);
    t.lineTo(x + w - 58, cy + 13);
    t.closePath();
    t.fill(); t.stroke();
  }
}

/* a glue stick, cap beside it */
function drawGluestick(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  // body with a twist base
  t.fillStyle = '#e8dfc8';
  t.beginPath(); t.roundRect(x + 8, y + 8, w * 0.55, h - 16, 12); t.fill(); t.stroke();
  t.fillStyle = '#b8a878';
  t.beginPath(); t.roundRect(x + 8, y + h - 34, w * 0.55, 26, 8); t.fill(); t.stroke();
  // glue nub peeking out the top
  t.fillStyle = '#f4efe0';
  t.beginPath(); t.ellipse(x + 8 + w * 0.275, y + 12, w * 0.2, 8, 0, 0, Math.PI * 2); t.fill(); t.stroke();
  // label swirl
  t.strokeStyle = 'rgba(90,100,120,0.8)';
  t.lineWidth = 1.6;
  t.beginPath();
  t.moveTo(x + 14, y + h * 0.5);
  t.quadraticCurveTo(x + w * 0.3, y + h * 0.36, x + w * 0.58, y + h * 0.52);
  t.stroke();
  // the cap, tipped over next to it
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  t.fillStyle = '#c9bfa4';
  t.beginPath(); t.roundRect(x + w * 0.68, y + h * 0.3, w * 0.26, h * 0.5, 10); t.fill(); t.stroke();
  t.lineWidth = 1.4;
  t.beginPath();
  t.moveTo(x + w * 0.68, y + h * 0.42); t.lineTo(x + w * 0.94, y + h * 0.42);
  t.stroke();
}

/* a fat marker, cap off, tip still wet */
function drawMarker(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  // barrel
  t.fillStyle = '#7a4dbf';
  t.beginPath(); t.roundRect(x + 10, y + h * 0.2, w * 0.6, h * 0.6, h * 0.28); t.fill(); t.stroke();
  t.fillStyle = 'rgba(255,255,255,0.3)';
  t.fillRect(x + 30, y + h * 0.28, w * 0.42, h * 0.14);
  // chisel tip
  t.fillStyle = '#5a3690';
  t.beginPath();
  t.moveTo(x + 10 + w * 0.6, y + h * 0.3);
  t.lineTo(x + w * 0.82, y + h * 0.42);
  t.lineTo(x + w * 0.82, y + h * 0.58);
  t.lineTo(x + 10 + w * 0.6, y + h * 0.7);
  t.closePath();
  t.fill(); t.stroke();
  // the cap, rolled away
  t.fillStyle = '#7a4dbf';
  t.beginPath(); t.roundRect(x + w * 0.86, y + h * 0.24, w * 0.12, h * 0.52, 8); t.fill(); t.stroke();
  // ink puddle by the tip
  t.fillStyle = 'rgba(122,77,191,0.5)';
  t.beginPath();
  t.ellipse(x + w * 0.85, y + h * 0.78, 26, 9, 0, 0, Math.PI * 2);
  t.fill();
}

/* a correction-tape mouse */
function drawCorrection(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  // teardrop shell
  t.fillStyle = '#8fd0d8';
  t.beginPath();
  t.moveTo(x + 10, y + h * 0.65);
  t.quadraticCurveTo(x + w * 0.2, y + 6, x + w * 0.62, y + h * 0.18);
  t.quadraticCurveTo(x + w - 6, y + h * 0.36, x + w - 10, y + h * 0.66);
  t.quadraticCurveTo(x + w * 0.5, y + h * 0.95, x + 10, y + h * 0.65);
  t.closePath();
  t.fill(); t.stroke();
  // the transparent window with the tape spools
  t.fillStyle = 'rgba(255,255,255,0.55)';
  t.beginPath(); t.ellipse(x + w * 0.46, y + h * 0.5, w * 0.2, h * 0.24, 0, 0, Math.PI * 2); t.fill(); t.stroke();
  t.lineWidth = 1.6;
  t.beginPath(); t.arc(x + w * 0.38, y + h * 0.5, h * 0.13, 0, Math.PI * 2); t.stroke();
  t.beginPath(); t.arc(x + w * 0.56, y + h * 0.5, h * 0.09, 0, Math.PI * 2); t.stroke();
  // a run of white tape it left behind
  t.fillStyle = 'rgba(255,255,255,0.8)';
  t.fillRect(x - 46, y + h * 0.72, 52, 10);
  t.strokeStyle = 'rgba(255,255,255,0.8)';
}

registerObstacles({
  divider: drawDivider, crayons: drawCrayons,
  gluestick: drawGluestick, marker: drawMarker, correction: drawCorrection,
});
