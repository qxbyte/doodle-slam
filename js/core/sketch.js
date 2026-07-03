'use strict';

/* ============================================================
   Sketch helpers — everything that makes lines look hand-drawn.
   All jitter comes from a seeded rng so the art never flickers.
   ============================================================ */

const INK = '#4a4a48';
const INK_LIGHT = '#8d8d88';
const PAPER = '#f0efe9';


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
   Characters — tiny doodle people. Front view, pencil outline,
   team-coloured vest, per-fighter hat/hair. scale 1 ≈ 34px tall.
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

  // legs
  ctx.beginPath();
  ctx.moveTo(-3.5, 8 + bob * 0.4); ctx.lineTo(-3.5, 14 - bob);
  ctx.moveTo(3.5, 8 - bob * 0.4); ctx.lineTo(3.5, 14 + bob);
  ctx.stroke();
  // shoes
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.ellipse(-3.8, 14.5 - bob, 2.6, 1.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3.8, 14.5 + bob, 2.6, 1.4, 0, 0, Math.PI * 2); ctx.fill();

  // vest (team colour)
  ctx.fillStyle = team.color;
  ctx.beginPath();
  ctx.roundRect(-6.5, -2 + bob * 0.3, 13, 11, 3);
  ctx.fill(); ctx.stroke();
  // strap detail
  ctx.beginPath(); ctx.moveTo(-6.5, 2.5); ctx.lineTo(6.5, 2.5); ctx.stroke();

  // blaster held toward aim
  ctx.save();
  ctx.rotate(aim);
  ctx.fillStyle = team.color;
  ctx.beginPath(); ctx.roundRect(4, -2.4, 10, 4.8, 1.6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.roundRect(11, -1.4, 3.4, 2.8, 1); ctx.fill(); ctx.stroke();
  if (firing) {
    ctx.fillStyle = team.color;
    ctx.beginPath(); ctx.arc(17, 0, 1.9, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // head
  const skin = ['#ba7a4a', '#e8b48c', '#d99a62', '#8d5a38'][teamId];
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -8 + bob * 0.3, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // eyes
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(-2, -8.5 + bob * 0.3, 0.9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(2, -8.5 + bob * 0.3, 0.9, 0, Math.PI * 2); ctx.fill();

  const hy = -8 + bob * 0.3; // hat anchor
  if (teamId === 0) { // ZURI — blue cap with brim
    ctx.fillStyle = team.color;
    ctx.beginPath(); ctx.arc(0, hy - 1.5, 6, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.roundRect(-1, hy - 3.4, 9.5, 2.6, 1.2); ctx.fill(); ctx.stroke();
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
  } else { // KOBI — green beanie + glasses
    ctx.fillStyle = team.color;
    ctx.beginPath(); ctx.roundRect(-6.2, hy - 7, 12.4, 5.4, 2.4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#222'; ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.arc(-2.2, -8.3 + bob * 0.3, 2.1, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(2.2, -8.3 + bob * 0.3, 2.1, 0, Math.PI * 2); ctx.stroke();
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
