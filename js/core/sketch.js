'use strict';

/* ============================================================
   Sketch helpers — everything that makes lines look hand-drawn.
   All jitter comes from a seeded rng so the art never flickers.
   ============================================================ */

/* The drawing palette is mutable: every draw function reads these
   at call time, so switching palette re-skins ALL sketch art.
   'chalk' turns the whole world into a blackboard drawing. */
let INK = '#4a4a48';
let INK_LIGHT = '#8d8d88';
let PAPER = '#f0efe9';

const PALETTES = {
  default: { ink: '#4a4a48', light: '#8d8d88', paper: '#f0efe9' },
  chalk:   { ink: '#f0f2ec', light: '#a9b8ae', paper: '#2c3b35' },
  deep:    { ink: '#3d5566', light: '#7e97a6', paper: '#e2eef2' },
};

function setPalette(name) {
  const p = PALETTES[name] || PALETTES.default;
  INK = p.ink;
  INK_LIGHT = p.light;
  PAPER = p.paper;
}


/* A wobbly polyline through the given points */
function wobblyPath(ctx, rng, pts, wobble = 1.4) {
  ctx.beginPath();
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    const segs = Math.max(2, Math.floor(dist(x1, y1, x2, y2) / 26));
    if (i === 0) ctx.moveTo(x1 + rand(rng, -wobble, wobble), y1 + rand(rng, -wobble, wobble));
    for (let s = 1; s <= segs; s++) {
      const t = s / segs;
      ctx.lineTo(
        lerp(x1, x2, t) + rand(rng, -wobble, wobble),
        lerp(y1, y2, t) + rand(rng, -wobble, wobble)
      );
    }
  }
}

function wobblyRect(ctx, rng, x, y, w, h, wobble = 1.4) {
  wobblyPath(ctx, rng, [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]], wobble);
}

function wobblyCircle(ctx, rng, cx, cy, r, wobble = 0.05) {
  ctx.beginPath();
  const segs = Math.max(10, Math.floor(r / 3));
  for (let i = 0; i <= segs; i++) {
    const a = (i / segs) * Math.PI * 2;
    const rr = r * (1 + rand(rng, -wobble, wobble));
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/* Diagonal pencil hatching inside a rect */
function hatchRect(ctx, rng, x, y, w, h, gap = 6) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.beginPath();
  for (let d = -h; d < w; d += gap) {
    ctx.moveTo(x + d + rand(rng, -1, 1), y + h);
    ctx.lineTo(x + d + h + rand(rng, -1, 1), y);
  }
  ctx.strokeStyle = INK_LIGHT;
  ctx.lineWidth = 0.8;
  ctx.stroke();
  ctx.restore();
}

/* Loose scribble blob — used for tree canopies and smudges */
function scribbleBlob(ctx, rng, cx, cy, r) {
  ctx.beginPath();
  let a = rand(rng, 0, Math.PI * 2);
  ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  for (let i = 0; i < 14; i++) {
    a += rand(rng, 0.5, 1.4);
    const rr = r * rand(rng, 0.4, 1.05);
    ctx.quadraticCurveTo(
      cx + Math.cos(a - 0.4) * rr * 1.3, cy + Math.sin(a - 0.4) * rr * 1.3,
      cx + Math.cos(a) * rr, cy + Math.sin(a) * rr
    );
  }
}

/* ============================================================
   Paint splats — the signature. An irregular main blob plus
   satellite droplets, drawn once onto the paint canvas.
   ============================================================ */
function drawSplat(ctx, rng, x, y, r, color) {
  ctx.fillStyle = color;
  // main blob: lumpy polygon of arcs
  ctx.beginPath();
  const lobes = 8 + Math.floor(rng() * 5);
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const rr = r * rand(rng, 0.62, 1.18);
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else {
      const ma = a - Math.PI / lobes;
      const mr = r * rand(rng, 0.75, 1.28);
      ctx.quadraticCurveTo(x + Math.cos(ma) * mr, y + Math.sin(ma) * mr, px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
  // satellite droplets
  const drops = 3 + Math.floor(rng() * 4 + r / 30);
  for (let i = 0; i < drops; i++) {
    const a = rand(rng, 0, Math.PI * 2);
    const d = r * rand(rng, 1.05, 1.9);
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, r * rand(rng, 0.07, 0.22), 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ============================================================
   Characters — tiny doodle people, each with their own build,
   outfit, hair and weapon silhouette. scale 1 ≈ 34px tall.
     ZURI: scout — cap, scarf, antenna backpack, knee pads
     JAX:  rusher — spikes, cheek plaster, wristband, belt
     NIA:  duelist — ponytail, scope eye, long-barrel pen
     KOBI: painter — headphone beanie, splattered apron, brush
   ============================================================ */
function drawCharacter(ctx, teamId, x, y, opts = {}) {
  const { scale = 1, walk = 0, aim = 0, firing = false } = opts;
  const team = TEAMS[teamId];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = INK;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const bob = Math.sin(walk * 10) * 1.4;
  const by = bob * 0.3;               // upper-body bob
  const bodyW = [13, 12, 11, 15][teamId];   // build: NIA slim, KOBI round
  const hw = bodyW / 2;

  // legs + shoes
  ctx.beginPath();
  ctx.moveTo(-3.5, 8 + bob * 0.4); ctx.lineTo(-3.5, 14 - bob);
  ctx.moveTo(3.5, 8 - bob * 0.4); ctx.lineTo(3.5, 14 + bob);
  ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.ellipse(-3.8, 14.5 - bob, 2.6, 1.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3.8, 14.5 + bob, 2.6, 1.4, 0, 0, Math.PI * 2); ctx.fill();
  if (teamId === 0) {                  // ZURI: knee pads
    ctx.fillStyle = '#dfe3ea';
    ctx.beginPath(); ctx.arc(-3.5, 10.5, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(3.5, 10.5, 1.6, 0, Math.PI * 2); ctx.fill();
  }

  // ZURI's antenna backpack pokes out behind the body
  if (teamId === 0) {
    ctx.fillStyle = team.dark;
    ctx.beginPath(); ctx.roundRect(-hw - 2.4, -1 + by, 3, 8, 1.4); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-hw - 1, -1 + by); ctx.lineTo(-hw - 1, -8 + by); ctx.stroke();
    ctx.fillStyle = '#e6392a';
    ctx.beginPath(); ctx.arc(-hw - 1, -8.6 + by, 1.1, 0, Math.PI * 2); ctx.fill();
  }
  // NIA's long ponytail swings behind
  if (teamId === 2) {
    ctx.strokeStyle = '#5a3d20';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-4, -11 + by);
    ctx.quadraticCurveTo(-8 - Math.sin(walk * 6) * 1.5, -4 + by, -6.5, 3 + by);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
  }

  // body (team colour), per-fighter outfit details
  ctx.fillStyle = team.color;
  ctx.beginPath();
  ctx.roundRect(-hw, -2 + by, bodyW, 11, 3);
  ctx.fill(); ctx.stroke();
  if (teamId === 0) {           // ZURI: chest pocket grid + scarf
    ctx.beginPath();
    ctx.moveTo(-hw, 2.5); ctx.lineTo(hw, 2.5);
    ctx.moveTo(0, -2 + by); ctx.lineTo(0, 2.5);
    ctx.stroke();
    ctx.fillStyle = '#f0b41c';
    ctx.beginPath(); ctx.roundRect(-4, -3.4 + by, 8, 2.6, 1.3); ctx.fill(); ctx.stroke();
  } else if (teamId === 1) {    // JAX: belt + lightning doodle + wristband
    ctx.fillStyle = '#3c3c3a';
    ctx.beginPath(); ctx.roundRect(-hw, 6.4, bodyW, 2.2, 1); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-1.5, -1 + by); ctx.lineTo(1, 1.5 + by); ctx.lineTo(-0.5, 1.5 + by); ctx.lineTo(2, 4.5 + by);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
  } else if (teamId === 2) {    // NIA: zip line + star badge
    ctx.beginPath(); ctx.moveTo(0, -2 + by); ctx.lineTo(0, 9 + by); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    for (let k = 0; k <= 5; k++) {
      const a = -Math.PI / 2 + k * Math.PI * 4 / 5;
      const px = -3 + Math.cos(a) * 1.8, py = 1 + by + Math.sin(a) * 1.8;
      k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
  } else {                      // KOBI: splattered apron + brush in pocket
    ctx.fillStyle = '#efe9dc';
    ctx.beginPath(); ctx.roundRect(-4.4, 0 + by, 8.8, 9, 2); ctx.fill(); ctx.stroke();
    for (const [sx, sy, sc] of [[-2, 3, '#e6392a'], [1.6, 5.5, '#2f66e0'], [-0.6, 7, '#f0b41c']]) {
      ctx.fillStyle = sc;
      ctx.beginPath(); ctx.arc(sx, sy + by, 1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#7a5a38';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(3, 1.5 + by); ctx.lineTo(3, -2.5 + by); ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
  }

  // weapon held toward aim — silhouette matches the loadout
  ctx.save();
  ctx.rotate(aim);
  ctx.fillStyle = team.color;
  if (teamId === 1) {
    // Splat Scatter: stubby double barrel
    ctx.beginPath(); ctx.roundRect(4, -3.4, 7, 3, 1.4); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(4, 0.4, 7, 3, 1.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.roundRect(10, -2.6, 2.6, 5.2, 1); ctx.fill(); ctx.stroke();
  } else if (teamId === 2) {
    // Longshot Pen: long thin barrel with a scope ring
    ctx.beginPath(); ctx.roundRect(4, -1.4, 14, 2.8, 1.2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(18, -1.4); ctx.lineTo(20.5, 0); ctx.lineTo(18, 1.4); ctx.closePath();
    ctx.fillStyle = '#3c3c3a'; ctx.fill();
    ctx.beginPath(); ctx.arc(9, -3, 1.6, 0, Math.PI * 2);
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
  } else if (teamId === 3) {
    // Blob Roller: fat round blob-thrower
    ctx.beginPath(); ctx.ellipse(8, 0, 5, 3.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.roundRect(12, -2, 3.6, 4, 1.6); ctx.fill(); ctx.stroke();
  } else {
    // SketchBlaster: the classic
    ctx.beginPath(); ctx.roundRect(4, -2.4, 10, 4.8, 1.6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.roundRect(11, -1.4, 3.4, 2.8, 1); ctx.fill(); ctx.stroke();
  }
  if (firing) {
    ctx.fillStyle = team.color;
    ctx.beginPath(); ctx.arc(teamId === 2 ? 22 : 17, 0, 1.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // head
  const skin = ['#ba7a4a', '#e8b48c', '#d99a62', '#8d5a38'][teamId];
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -8 + by, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // eyes
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-2, -8.5 + by, 0.9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(2, -8.5 + by, 0.9, 0, Math.PI * 2); ctx.fill();
  if (teamId === 1) {           // JAX: cheek plaster
    ctx.strokeStyle = '#e8d5a4';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(2.8, -5.6 + by); ctx.lineTo(5, -6.8 + by); ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
  }
  if (teamId === 2) {           // NIA: scope over the right eye
    ctx.strokeStyle = '#3c3c3a';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.arc(2, -8.5 + by, 2.4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, -11.6 + by); ctx.lineTo(2, -10.2 + by);
    ctx.moveTo(2, -6.8 + by); ctx.lineTo(2, -5.4 + by);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
  }

  const hy = -8 + by; // hat anchor
  if (teamId === 0) { // ZURI — blue cap with brim
    ctx.fillStyle = team.color;
    ctx.beginPath(); ctx.arc(0, hy - 1.5, 6, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-1, hy - 3.4, 9.5, 2.6, 1.2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-2, hy - 4, 1.2, 0, Math.PI * 2); ctx.fill();
  } else if (teamId === 1) { // JAX — red spiky hair
    ctx.fillStyle = team.color;
    ctx.beginPath();
    ctx.moveTo(-6, hy - 1);
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(-6 + i * 3 + 1.5, hy - 8 - (i % 2) * 1.5);
      ctx.lineTo(-6 + (i + 1) * 3, hy - 1.5);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (teamId === 2) { // NIA — yellow cap, brim back
    ctx.fillStyle = team.color;
    ctx.beginPath(); ctx.arc(0, hy - 1.5, 6, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-9.5, hy - 3.2, 8, 2.4, 1.2); ctx.fill(); ctx.stroke();
  } else { // KOBI — green beanie with headphones + glasses
    ctx.fillStyle = team.color;
    ctx.beginPath(); ctx.roundRect(-6.2, hy - 7, 12.4, 5.4, 2.4); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3c3c3a';
    ctx.beginPath(); ctx.roundRect(-7.6, hy - 3.4, 2.4, 4, 1.1); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(5.2, hy - 3.4, 2.4, 4, 1.1); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(-2.2, -8.3 + by, 2.1, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(2.2, -8.3 + by, 2.1, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.4, -8.3); ctx.lineTo(0.4, -8.3); ctx.stroke();
  }

  ctx.restore();
}

/* Doodle paint bomb (round bomb with fuse) */
function drawBombIcon(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#3c3c3a';
  ctx.beginPath(); ctx.arc(0, 1, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-2.4, -1.4, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(3, -5); ctx.quadraticCurveTo(6, -9, 9, -8); ctx.stroke();
  // spark
  ctx.strokeStyle = '#e6392a';
  ctx.beginPath();
  ctx.moveTo(9, -11); ctx.lineTo(9, -5);
  ctx.moveTo(6, -8); ctx.lineTo(12, -8);
  ctx.stroke();
  ctx.restore();
}

/* The big red button on its pedestal */
function drawRedButton(ctx, x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  const pop = 1 + Math.sin(t * 4) * 0.06;
  ctx.scale(pop, pop);
  ctx.lineWidth = 2;
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#c9c9c2';
  ctx.beginPath(); ctx.ellipse(0, 6, 15, 7, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e6392a';
  ctx.beginPath(); ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath(); ctx.ellipse(-3, -2.5, 4, 2.2, -0.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* Falling doodle rocket */
function drawRocket(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI * 0.75); // nose down-left as it falls
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = INK;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.quadraticCurveTo(6, -7, -8, -6);
  ctx.lineTo(-8, 6);
  ctx.quadraticCurveTo(6, 7, 14, 0);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(3, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // fins
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-8, -6); ctx.lineTo(-14, -10); ctx.lineTo(-11, -1); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, 6); ctx.lineTo(-14, 10); ctx.lineTo(-11, 1); ctx.closePath(); ctx.fill(); ctx.stroke();
  // exhaust scribble
  ctx.strokeStyle = INK_LIGHT;
  ctx.beginPath();
  ctx.moveTo(-15, 0); ctx.lineTo(-20, -3); ctx.lineTo(-24, 2); ctx.lineTo(-28, -1);
  ctx.stroke();
  ctx.restore();
}
