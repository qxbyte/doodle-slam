'use strict';

/* ============================================================
   Blueprint theme — the hidden world. Deep blue drafting sheet
   (grid, border, title block) with obstacle kinds that exist
   nowhere else: wireframe ghost buildings, a drafting compass,
   a set square, rolled sheets and pushpins. The red button sits
   on a compass rose.
   ============================================================ */

registerGround('blueprint', (g, rng, map) => {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, WORLD.w, WORLD.h);
  // subtle tonal blotches so the sheet doesn't feel flat
  for (let i = 0; i < 16; i++) {
    g.fillStyle = `rgba(255,255,255,${rand(rng, 0.015, 0.04)})`;
    g.beginPath();
    g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
              rand(rng, 140, 340), rand(rng, 80, 180), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
  // fine grid + heavier major grid
  g.strokeStyle = 'rgba(220,232,242,0.10)';
  g.lineWidth = 1;
  for (let x = 80; x < WORLD.w; x += 80) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, WORLD.h); g.stroke();
  }
  for (let y = 80; y < WORLD.h; y += 80) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(WORLD.w, y); g.stroke();
  }
  g.strokeStyle = 'rgba(220,232,242,0.20)';
  g.lineWidth = 1.4;
  for (let x = 400; x < WORLD.w; x += 400) {
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, WORLD.h); g.stroke();
  }
  for (let y = 400; y < WORLD.h; y += 400) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(WORLD.w, y); g.stroke();
  }
  // sheet border, double-ruled
  g.strokeStyle = 'rgba(220,232,242,0.75)';
  g.lineWidth = 3;
  wobblyRect(g, rng, 36, 36, WORLD.w - 72, WORLD.h - 72, 1.6);
  g.stroke();
  g.lineWidth = 1.2;
  wobblyRect(g, rng, 52, 52, WORLD.w - 104, WORLD.h - 104, 1.2);
  g.stroke();
  // title block, bottom-right like a real sheet
  g.lineWidth = 2;
  wobblyRect(g, rng, WORLD.w - 560, WORLD.h - 190, 500, 130, 1.4);
  g.stroke();
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(WORLD.w - 560, WORLD.h - 145); g.lineTo(WORLD.w - 60, WORLD.h - 145);
  g.moveTo(WORLD.w - 300, WORLD.h - 145); g.lineTo(WORLD.w - 300, WORLD.h - 60);
  g.stroke();
  g.fillStyle = 'rgba(220,232,242,0.85)';
  g.font = "24px 'Patrick Hand', cursive";
  g.textAlign = 'left';
  g.fillText('PROJECT: THE TOWN THAT WASN’T', WORLD.w - 540, WORLD.h - 160);
  g.font = "19px 'Patrick Hand', cursive";
  g.fillText('SHEET: ???', WORLD.w - 540, WORLD.h - 105);
  g.fillText('SCALE 1:1', WORLD.w - 280, WORLD.h - 105);
  g.fillText('DO NOT TELL ANYONE', WORLD.w - 540, WORLD.h - 75);
  // dimension arrows along the top border
  g.strokeStyle = 'rgba(220,232,242,0.5)';
  g.lineWidth = 1.4;
  for (const [x1, x2] of [[400, 800], [1600, 2000]]) {
    g.beginPath();
    g.moveTo(x1, 110); g.lineTo(x2, 110);
    g.moveTo(x1 + 8, 104); g.lineTo(x1, 110); g.lineTo(x1 + 8, 116);
    g.moveTo(x2 - 8, 104); g.lineTo(x2, 110); g.lineTo(x2 - 8, 116);
    g.stroke();
  }
  // scattered pencil scribbles — the drafter's stray marks
  g.strokeStyle = 'rgba(220,232,242,0.35)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    const x = rand(rng, 150, WORLD.w - 150), y = rand(rng, 150, WORLD.h - 250);
    scribbleBlob(g, rng, x, y, rand(rng, 8, 18));
    g.stroke();
  }
});

/* the red button sits on a big compass rose */
registerPlaza('rose', (g, rng, map, p) => {
  g.strokeStyle = 'rgba(220,232,242,0.6)';
  g.lineWidth = 1.8;
  wobblyCircle(g, rng, p.x, p.y, 78, 0.02);
  g.stroke();
  wobblyCircle(g, rng, p.x, p.y, 54, 0.02);
  g.stroke();
  g.beginPath();
  for (let k = 0; k < 8; k++) {
    const a = k * Math.PI / 4;
    g.moveTo(p.x + Math.cos(a) * 24, p.y + Math.sin(a) * 24);
    g.lineTo(p.x + Math.cos(a) * (k % 2 ? 54 : 78), p.y + Math.sin(a) * (k % 2 ? 54 : 78));
  }
  g.stroke();
  g.fillStyle = 'rgba(220,232,242,0.85)';
  g.font = "22px 'Patrick Hand', cursive";
  g.textAlign = 'center';
  g.fillText('N', p.x, p.y - 88);
});

/* ---------------- blueprint obstacles ---------------- */

/* a building that was never built: dashed wireframe + cross braces */
function drawGhost(t, rng, b) {
  const { x, y, w, h } = b;
  // barely-there body
  t.fillStyle = 'rgba(255,255,255,0.05)';
  t.fillRect(x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  t.setLineDash([14, 9]);
  wobblyRect(t, rng, x, y, w, h, 1.6);
  t.stroke();
  t.setLineDash([]);
  // cross braces + floor lines
  t.lineWidth = 1.1;
  t.strokeStyle = INK_LIGHT;
  t.beginPath();
  t.moveTo(x, y); t.lineTo(x + w, y + h);
  t.moveTo(x + w, y); t.lineTo(x, y + h);
  t.stroke();
  t.setLineDash([6, 8]);
  t.beginPath();
  for (let fy = y + h / 4; fy < y + h - 10; fy += h / 4) {
    t.moveTo(x + 8, fy); t.lineTo(x + w - 8, fy);
  }
  t.stroke();
  t.setLineDash([]);
  // corner ticks
  t.strokeStyle = INK;
  t.lineWidth = 2.4;
  const tick = 12;
  t.beginPath();
  for (const [cx, cy, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    t.moveTo(cx + sx * tick, cy); t.lineTo(cx, cy); t.lineTo(cx, cy + sy * tick);
  }
  t.stroke();
  // a little "not built" note
  t.fillStyle = INK;
  t.font = "17px 'Patrick Hand', cursive";
  t.textAlign = 'center';
  t.fillText('T.B.D.', x + w / 2, y + h / 2 - 6);
}

/* a giant drafting compass, legs planted, sketching a faint arc */
function drawCompassTool(t, rng, b) {
  const { x, y, w, h } = b;
  const hx = x + w * 0.5, hy = y + 10;   // hinge at the top
  const lx = x + w * 0.18, ly = y + h - 8;
  const rx = x + w * 0.82, ry = y + h - 6;
  // the arc it is drawing
  t.strokeStyle = 'rgba(220,232,242,0.4)';
  t.lineWidth = 2;
  t.beginPath();
  t.arc(lx, ly, Math.hypot(rx - lx, ry - ly), -0.5, 0.55);
  t.stroke();
  // legs
  t.strokeStyle = INK;
  t.lineWidth = 6;
  t.lineCap = 'round';
  t.beginPath(); t.moveTo(hx, hy); t.lineTo(lx, ly); t.stroke();
  t.beginPath(); t.moveTo(hx, hy); t.lineTo(rx, ry - 26); t.stroke();
  // pencil tip on the drawing leg
  t.strokeStyle = '#e8b23c';
  t.lineWidth = 5;
  t.beginPath(); t.moveTo(rx, ry - 26); t.lineTo(rx + 2, ry - 6); t.stroke();
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath(); t.moveTo(rx + 2, ry - 6); t.lineTo(rx + 3, ry); t.stroke();
  // hinge + handle
  t.fillStyle = INK;
  t.beginPath(); t.arc(hx, hy, 8, 0, Math.PI * 2); t.fill();
  t.lineWidth = 4;
  t.beginPath(); t.moveTo(hx, hy - 8); t.lineTo(hx, y - 6); t.stroke();
  t.fillStyle = 'rgba(255,255,255,0.25)';
  t.beginPath(); t.arc(hx, hy, 3, 0, Math.PI * 2); t.fill();
}

/* a set square (right-angle triangle ruler) with a hole */
function drawSetsquare(t, rng, b) {
  const { x, y, w, h } = b;
  t.fillStyle = 'rgba(255,255,255,0.10)';
  t.strokeStyle = INK;
  t.lineWidth = 2.4;
  t.beginPath();
  t.moveTo(x + 4, y + 4);
  t.lineTo(x + 4, y + h - 4);
  t.lineTo(x + w - 4, y + h - 4);
  t.closePath();
  t.fill(); t.stroke();
  // inner triangular hole
  t.fillStyle = PAPER;
  t.lineWidth = 1.6;
  t.beginPath();
  t.moveTo(x + w * 0.22, y + h * 0.42);
  t.lineTo(x + w * 0.22, y + h * 0.78);
  t.lineTo(x + w * 0.56, y + h * 0.78);
  t.closePath();
  t.fill(); t.stroke();
  // ruler tick marks along the vertical edge
  t.lineWidth = 1.2;
  t.beginPath();
  for (let ty = y + 16; ty < y + h - 12; ty += 14) {
    t.moveTo(x + 4, ty); t.lineTo(x + 14, ty);
  }
  t.stroke();
}

/* a rolled-up sheet, spiral ends, tied with a band */
function drawRoll(t, rng, b) {
  const { x, y, w, h } = b;
  t.fillStyle = 'rgba(255,255,255,0.14)';
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  t.beginPath(); t.roundRect(x + 6, y + h * 0.2, w - 12, h * 0.6, h * 0.3); t.fill(); t.stroke();
  // spiral end faces
  for (const ex of [x + 6 + h * 0.3, x + w - 6 - h * 0.3]) {
    t.lineWidth = 1.6;
    t.beginPath();
    t.ellipse(ex, y + h * 0.5, h * 0.3, h * 0.3, 0, 0, Math.PI * 2);
    t.stroke();
    t.beginPath();
    t.arc(ex, y + h * 0.5, h * 0.14, 0.5, Math.PI * 1.7);
    t.stroke();
  }
  // tie band + curling corner
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(x + w * 0.5, y + h * 0.2); t.lineTo(x + w * 0.5, y + h * 0.8);
  t.stroke();
  t.lineWidth = 1.4;
  t.beginPath();
  t.moveTo(x + w - 6, y + h * 0.35);
  t.quadraticCurveTo(x + w + 14, y + h * 0.2, x + w + 10, y + h * 0.55);
  t.stroke();
}

/* a pushpin holding the sheet down */
function drawPin(t, rng, b) {
  const { x, y, w, h } = b;
  const cx = x + w / 2, cy = y + h / 2;
  const r = Math.min(w, h) * 0.42;
  // cast shadow
  t.fillStyle = 'rgba(0,0,0,0.22)';
  t.beginPath(); t.ellipse(cx + r * 0.4, cy + r * 0.5, r, r * 0.5, 0.3, 0, Math.PI * 2); t.fill();
  // head
  t.fillStyle = '#e6392a';
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  t.beginPath(); t.arc(cx, cy, r, 0, Math.PI * 2); t.fill(); t.stroke();
  t.lineWidth = 1.4;
  t.beginPath(); t.arc(cx, cy, r * 0.55, 0, Math.PI * 2); t.stroke();
  // highlight
  t.fillStyle = 'rgba(255,255,255,0.55)';
  t.beginPath(); t.arc(cx - r * 0.35, cy - r * 0.35, r * 0.22, 0, Math.PI * 2); t.fill();
}

registerObstacles({
  ghost: drawGhost, compassTool: drawCompassTool,
  setsquare: drawSetsquare, roll: drawRoll, pin: drawPin,
});
