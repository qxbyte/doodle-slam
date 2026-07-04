'use strict';

/* ============================================================
   Other Town theme — the hidden world. The city again, but
   wrong: night-blue paper, a sleepy moon, roads that spiral
   into nothing, and obstacle kinds that exist nowhere else —
   leaning towers, upside-down houses, a one-eyed billboard,
   a melting clock tower, floating chunks of street, wilting
   lampposts. The red button sits on a fountain that pours up.
   ============================================================ */

registerGround('othercity', (g, rng, map) => {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, WORLD.w, WORLD.h);
  // tonal night blotches
  for (let i = 0; i < 18; i++) {
    g.fillStyle = `rgba(255,255,255,${rand(rng, 0.015, 0.04)})`;
    g.beginPath();
    g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
              rand(rng, 140, 340), rand(rng, 80, 180), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
  // stars: dots plus the odd 4-point sparkle
  g.fillStyle = 'rgba(235,240,248,0.8)';
  for (let i = 0; i < 130; i++) {
    g.fillRect(rand(rng, 20, WORLD.w - 20), rand(rng, 20, WORLD.h - 20), 2, 2);
  }
  g.strokeStyle = 'rgba(235,240,248,0.7)';
  g.lineWidth = 1.4;
  for (let i = 0; i < 14; i++) {
    const x = rand(rng, 40, WORLD.w - 40), y = rand(rng, 40, WORLD.h - 40);
    const r = rand(rng, 4, 7);
    g.beginPath();
    g.moveTo(x - r, y); g.lineTo(x + r, y);
    g.moveTo(x, y - r); g.lineTo(x, y + r);
    g.stroke();
  }
  // the sleepy crescent moon, watching
  const mx = 2060, my = 230, mr = 95;
  g.fillStyle = '#e8e4c8';
  g.strokeStyle = INK;
  g.lineWidth = 2.4;
  g.beginPath();
  g.arc(mx, my, mr, Math.PI * 0.42, Math.PI * 1.58);
  g.quadraticCurveTo(mx + mr * 0.4, my, mx + Math.cos(Math.PI * 0.42) * mr, my + Math.sin(Math.PI * 0.42) * mr);
  g.closePath();
  g.fill(); g.stroke();
  // closed eye + tiny mouth
  g.lineWidth = 2;
  g.beginPath(); g.arc(mx - mr * 0.45, my - mr * 0.15, 10, 0.2, Math.PI - 0.2); g.stroke();
  g.beginPath(); g.arc(mx - mr * 0.38, my + mr * 0.3, 5, 0.3, Math.PI - 0.5); g.stroke();
  // roads that go nowhere: a spiral…
  const roadStroke = (w, c) => { g.lineWidth = w; g.strokeStyle = c; };
  const spiralAt = (cx, cy) => {
    g.beginPath();
    for (let t = 0; t < Math.PI * 4.6; t += 0.12) {
      const r = 40 + t * 26;
      const x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r * 0.8;
      t === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
  };
  roadStroke(78, 'rgba(255,255,255,0.07)');
  spiralAt(1620, 800);
  g.stroke();
  roadStroke(2, 'rgba(235,240,248,0.4)');
  g.setLineDash([16, 14]);
  spiralAt(1620, 800);
  g.stroke();
  g.setLineDash([]);
  // …and a straight one that just stops
  roadStroke(78, 'rgba(255,255,255,0.07)');
  g.beginPath(); g.moveTo(120, 470); g.lineTo(1050, 560); g.stroke();
  roadStroke(2, 'rgba(235,240,248,0.4)');
  g.setLineDash([16, 14]);
  g.beginPath(); g.moveTo(120, 470); g.lineTo(1050, 560); g.stroke();
  g.setLineDash([]);
  g.fillStyle = 'rgba(235,240,248,0.75)';
  g.font = "26px 'Patrick Hand', cursive";
  g.textAlign = 'center';
  g.fillText('END?', 1120, 575);
  // crosswalks at angles that make no sense
  g.fillStyle = 'rgba(235,240,248,0.35)';
  for (const [cx, cy, a] of [[600, 1000, 0.7], [1400, 400, -0.4], [1900, 1400, 1.2]]) {
    g.save();
    g.translate(cx, cy);
    g.rotate(a);
    for (let k = -2; k <= 2; k++) g.fillRect(k * 16 - 5, -26, 10, 52);
    g.restore();
  }
  // manholes, one glowing from below
  g.strokeStyle = INK;
  g.lineWidth = 1.8;
  for (const [hx, hy, glow] of [[950, 1120, false], [1750, 620, true], [420, 900, false]]) {
    if (glow) {
      g.fillStyle = 'rgba(240,212,137,0.30)';
      g.beginPath(); g.arc(hx, hy, 34, 0, Math.PI * 2); g.fill();
    }
    g.fillStyle = glow ? '#f0d489' : 'rgba(255,255,255,0.12)';
    g.beginPath(); g.arc(hx, hy, 18, 0, Math.PI * 2); g.fill(); g.stroke();
    g.lineWidth = 1;
    g.beginPath();
    for (const k of [-8, 0, 8]) { g.moveTo(hx + k, hy - 12); g.lineTo(hx + k, hy + 12); }
    g.stroke();
    g.lineWidth = 1.8;
  }
  // stray windows glowing in mid-air
  for (let i = 0; i < 8; i++) {
    const x = rand(rng, 150, WORLD.w - 150), y = rand(rng, 150, WORLD.h - 200);
    g.fillStyle = 'rgba(240,212,137,0.5)';
    g.fillRect(x, y, 14, 18);
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    g.strokeRect(x, y, 14, 18);
    g.beginPath(); g.moveTo(x, y + 9); g.lineTo(x + 14, y + 9); g.stroke();
  }
  // the drafter's stray scribbles, still here
  g.strokeStyle = 'rgba(235,240,248,0.3)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 10; i++) {
    scribbleBlob(g, rng, rand(rng, 150, WORLD.w - 150), rand(rng, 150, WORLD.h - 250), rand(rng, 8, 16));
    g.stroke();
  }
});

/* the plaza fountain — pouring upward */
registerPlaza('unfountain', (g, rng, map, p) => {
  // pool
  g.fillStyle = 'rgba(150,200,235,0.30)';
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.beginPath(); g.ellipse(p.x, p.y, 52, 30, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  g.lineWidth = 1.4;
  g.beginPath(); g.ellipse(p.x, p.y, 40, 21, 0, 0, Math.PI * 2); g.stroke();
  // water arcs climbing out of the pool into the air
  g.strokeStyle = 'rgba(170,215,245,0.85)';
  g.lineWidth = 2.6;
  for (const [ox, h, bend] of [[-26, 74, -18], [0, 96, 4], [26, 70, 20]]) {
    g.beginPath();
    g.moveTo(p.x + ox, p.y - 6);
    g.quadraticCurveTo(p.x + ox + bend, p.y - h * 0.6, p.x + ox * 0.4 + bend, p.y - h);
    g.stroke();
  }
  // droplets hanging above, going the wrong way
  g.fillStyle = 'rgba(170,215,245,0.9)';
  for (const [dx, dy, r] of [[-30, -84, 3.4], [-6, -108, 4], [20, -92, 3], [36, -70, 2.6], [4, -128, 2.4]]) {
    g.beginPath(); g.arc(p.x + dx, p.y + dy, r, 0, Math.PI * 2); g.fill();
  }
  // a puzzled sign by the rim
  g.fillStyle = 'rgba(235,240,248,0.8)';
  g.font = "20px 'Patrick Hand', cursive";
  g.textAlign = 'center';
  g.fillText('?', p.x + 58, p.y - 22);
});

/* ---------------- other-town obstacles ---------------- */

/* an office tower leaning way too far, windows half lit */
function drawTiltoffice(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const lean = (b.x % 2 ? -1 : 1) * 0.11;
  t.save();
  t.translate(x + w / 2, y + h);
  t.rotate(lean);
  t.fillStyle = 'rgba(255,255,255,0.10)';
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  t.fillRect(-w / 2 + 6, -h, w - 12, h);
  wobblyRect(t, rng, -w / 2 + 6, -h, w - 12, h, 1.6);
  t.stroke();
  // windows: a few glow, most are dark
  for (let wy = -h + 22; wy < -26; wy += 40) {
    for (let wx = -w / 2 + 20; wx < w / 2 - 26; wx += 38) {
      const lit = rng() < 0.3;
      t.fillStyle = lit ? '#f0d489' : 'rgba(0,0,0,0.28)';
      t.fillRect(wx, wy, 18, 22);
      t.lineWidth = 1.3;
      t.strokeRect(wx, wy, 18, 22);
    }
  }
  t.restore();
  // stress cracks at the footing
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 1.4;
  t.beginPath();
  t.moveTo(x + w * 0.2, y + h);
  t.lineTo(x + w * 0.3, y + h - 18);
  t.lineTo(x + w * 0.26, y + h - 34);
  t.moveTo(x + w * 0.7, y + h);
  t.lineTo(x + w * 0.62, y + h - 14);
  t.stroke();
}

/* a house built roof-down, door on top, doormat in the sky */
function drawFlippedhouse(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  // roof wedge at the bottom
  t.fillStyle = '#7a5a4a';
  t.beginPath();
  t.moveTo(x + 2, y + h * 0.62);
  t.lineTo(x + w / 2, y + h - 2);
  t.lineTo(x + w - 2, y + h * 0.62);
  t.closePath();
  t.fill(); t.stroke();
  // body above the roof
  t.fillStyle = 'rgba(255,255,255,0.14)';
  t.fillRect(x + 14, y + 6, w - 28, h * 0.56);
  wobblyRect(t, rng, x + 14, y + 6, w - 28, h * 0.56, 1.4);
  t.stroke();
  // the front door — on the TOP edge
  t.fillStyle = '#3a4666';
  t.beginPath();
  t.roundRect(x + w / 2 - 13, y + 6, 26, h * 0.24, 3);
  t.fill(); t.stroke();
  t.fillStyle = '#dce8f2';
  t.beginPath(); t.arc(x + w / 2 + 7, y + 6 + h * 0.13, 2, 0, Math.PI * 2); t.fill();
  // doormat floating above the door
  t.lineWidth = 1.6;
  t.strokeRect(x + w / 2 - 18, y - 14, 36, 10);
  // one window, glowing
  t.fillStyle = '#f0d489';
  t.fillRect(x + w * 0.22, y + h * 0.3, 20, 20);
  t.strokeRect(x + w * 0.22, y + h * 0.3, 20, 20);
  // upside-down chimney with smoke sinking
  t.fillStyle = '#7a5a4a';
  t.fillRect(x + w * 0.72, y + h * 0.62, 16, 22);
  t.strokeRect(x + w * 0.72, y + h * 0.62, 16, 22);
  t.strokeStyle = 'rgba(200,205,215,0.6)';
  t.lineWidth = 2;
  for (const [ox, s] of [[4, 30], [10, 42]]) {
    t.beginPath();
    t.arc(x + w * 0.72 + ox, y + h * 0.62 + s, 5, Math.PI * 1.4, Math.PI * 0.5);
    t.stroke();
  }
}

/* the billboard with one big eye. it is looking at you. */
function drawEyeboard(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  // legs
  t.lineWidth = 4;
  t.beginPath();
  t.moveTo(x + w * 0.2, y + h); t.lineTo(x + w * 0.26, y + h * 0.44);
  t.moveTo(x + w * 0.8, y + h); t.lineTo(x + w * 0.74, y + h * 0.44);
  t.stroke();
  // panel
  t.lineWidth = 2.2;
  t.fillStyle = '#f2ead8';
  t.fillRect(x + 6, y + 4, w - 12, h * 0.44);
  wobblyRect(t, rng, x + 6, y + 4, w - 12, h * 0.44, 1.5);
  t.stroke();
  // the eye
  const ex = x + w / 2, ey = y + 4 + h * 0.22;
  t.fillStyle = '#fdfdf8';
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(ex - w * 0.3, ey);
  t.quadraticCurveTo(ex, ey - h * 0.17, ex + w * 0.3, ey);
  t.quadraticCurveTo(ex, ey + h * 0.17, ex - w * 0.3, ey);
  t.closePath();
  t.fill(); t.stroke();
  t.fillStyle = '#5a8ac2';
  t.beginPath(); t.arc(ex, ey, h * 0.1, 0, Math.PI * 2); t.fill(); t.stroke();
  t.fillStyle = '#1c1c1a';
  t.beginPath(); t.arc(ex, ey, h * 0.045, 0, Math.PI * 2); t.fill();
  t.fillStyle = '#fdfdf8';
  t.beginPath(); t.arc(ex - h * 0.03, ey - h * 0.035, h * 0.02, 0, Math.PI * 2); t.fill();
  // lashes
  t.lineWidth = 1.6;
  t.beginPath();
  for (const k of [-0.22, 0, 0.22]) {
    t.moveTo(ex + w * k, ey - h * 0.15);
    t.lineTo(ex + w * k * 1.15, ey - h * 0.21);
  }
  t.stroke();
}

/* the clock tower, mid-melt */
function drawMeltclock(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  // tower body
  t.fillStyle = 'rgba(255,255,255,0.12)';
  t.fillRect(x + w * 0.2, y + h * 0.3, w * 0.6, h * 0.7);
  wobblyRect(t, rng, x + w * 0.2, y + h * 0.3, w * 0.6, h * 0.7, 1.5);
  t.stroke();
  hatchRect(t, rng, x + w * 0.2, y + h * 0.75, w * 0.6, h * 0.25, 9);
  // the clock face, sagging over the front like warm cheese
  const cx = x + w / 2, cy = y + h * 0.24;
  t.fillStyle = '#f2ead8';
  t.beginPath();
  t.ellipse(cx, cy, w * 0.34, h * 0.14, 0, Math.PI, 0);
  t.quadraticCurveTo(cx + w * 0.34, cy + h * 0.2, cx + w * 0.16, cy + h * 0.26);
  t.quadraticCurveTo(cx, cy + h * 0.3, cx - w * 0.12, cy + h * 0.24);
  t.quadraticCurveTo(cx - w * 0.34, cy + h * 0.18, cx - w * 0.34, cy);
  t.closePath();
  t.fill(); t.stroke();
  // drooping numbers
  t.fillStyle = INK;
  t.font = "16px 'Patrick Hand', cursive";
  t.textAlign = 'center';
  t.fillText('12', cx, cy - h * 0.06);
  t.save(); t.translate(cx + w * 0.2, cy + h * 0.12); t.rotate(0.6); t.fillText('3', 0, 0); t.restore();
  t.save(); t.translate(cx - w * 0.2, cy + h * 0.1); t.rotate(-0.5); t.fillText('9', 0, 0); t.restore();
  t.save(); t.translate(cx + w * 0.04, cy + h * 0.2); t.rotate(0.9); t.fillText('6', 0, 0); t.restore();
  // bent hands
  t.lineWidth = 2.4;
  t.beginPath();
  t.moveTo(cx, cy);
  t.quadraticCurveTo(cx + 10, cy + 6, cx + 14, cy + 16);
  t.moveTo(cx, cy);
  t.lineTo(cx - 12, cy - 4);
  t.stroke();
  // a drip falling off the face
  t.fillStyle = '#f2ead8';
  t.beginPath(); t.ellipse(cx + w * 0.18, cy + h * 0.32, 4, 6, 0, 0, Math.PI * 2); t.fill(); t.stroke();
}

/* a chunk of street that floats: road on top, pebbles adrift below */
function drawFloatstreet(t, rng, b) {
  const { x, y, w, h } = b;
  // shadow far beneath the floating slab
  t.fillStyle = 'rgba(0,0,0,0.20)';
  t.beginPath();
  t.ellipse(x + w / 2, y + h + 16, w * 0.36, 9, 0, 0, Math.PI * 2);
  t.fill();
  // the slab
  const slabH = h * 0.55;
  t.strokeStyle = INK;
  t.lineWidth = 2.2;
  t.fillStyle = 'rgba(255,255,255,0.14)';
  t.beginPath(); t.roundRect(x + 4, y, w - 8, slabH, 10); t.fill(); t.stroke();
  // torn underside
  t.fillStyle = 'rgba(0,0,0,0.24)';
  t.beginPath();
  t.moveTo(x + 6, y + slabH - 2);
  for (let k = 0; k <= 6; k++) {
    t.lineTo(x + 6 + (w - 12) * k / 6, y + slabH - 2 + (k % 2 ? 12 : 3));
  }
  t.lineTo(x + w - 6, y + slabH - 2);
  t.closePath();
  t.fill(); t.stroke();
  // road dashes on top
  t.strokeStyle = 'rgba(235,240,248,0.7)';
  t.lineWidth = 3;
  t.setLineDash([14, 12]);
  t.beginPath();
  t.moveTo(x + 14, y + slabH * 0.5);
  t.lineTo(x + w - 14, y + slabH * 0.5);
  t.stroke();
  t.setLineDash([]);
  // pebbles drifting in the gap below
  t.strokeStyle = INK;
  t.lineWidth = 1.6;
  t.fillStyle = 'rgba(255,255,255,0.16)';
  for (const [px, py, pr] of [[0.25, 0.78, 7], [0.55, 0.86, 5], [0.8, 0.74, 6]]) {
    t.beginPath();
    t.arc(x + w * px, y + h * py + 4, pr, 0, Math.PI * 2);
    t.fill(); t.stroke();
  }
}

/* a streetlamp wilting like a thirsty flower, light still on */
function drawBentlamp(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const bx = x + w * 0.4, by = y + h;
  t.strokeStyle = INK;
  // base
  t.lineWidth = 2;
  t.fillStyle = 'rgba(255,255,255,0.14)';
  t.beginPath(); t.roundRect(bx - 10, by - 10, 20, 10, 3); t.fill(); t.stroke();
  // drooping pole
  t.lineWidth = 4;
  t.beginPath();
  t.moveTo(bx, by - 8);
  t.quadraticCurveTo(bx - 4, y + h * 0.25, bx + w * 0.3, y + h * 0.18);
  t.quadraticCurveTo(bx + w * 0.55, y + h * 0.16, bx + w * 0.52, y + h * 0.34);
  t.stroke();
  // the lamp head, hanging
  t.lineWidth = 2;
  t.fillStyle = '#f0d489';
  t.beginPath();
  t.moveTo(bx + w * 0.4, y + h * 0.34);
  t.lineTo(bx + w * 0.64, y + h * 0.34);
  t.lineTo(bx + w * 0.58, y + h * 0.48);
  t.lineTo(bx + w * 0.46, y + h * 0.48);
  t.closePath();
  t.fill(); t.stroke();
  // glow pooling under it
  t.fillStyle = 'rgba(240,212,137,0.25)';
  t.beginPath();
  t.ellipse(bx + w * 0.52, y + h * 0.62, 20, 9, 0, 0, Math.PI * 2);
  t.fill();
}

registerObstacles({
  tiltoffice: drawTiltoffice, flippedhouse: drawFlippedhouse,
  eyeboard: drawEyeboard, meltclock: drawMeltclock,
  floatstreet: drawFloatstreet, bentlamp: drawBentlamp,
});
