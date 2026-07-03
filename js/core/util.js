'use strict';

/* Seeded RNG (mulberry32) — the sketch art must be stable frame to frame */
function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const lerp = (a, b, t) => a + (b - a) * t;
const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const rand = (rng, lo, hi) => lo + rng() * (hi - lo);
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];

function formatTime(sec) {
  sec = Math.max(0, Math.ceil(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}

/* Circle vs axis-aligned rect overlap */
function circleRectHit(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  return dist(cx, cy, nx, ny) < r;
}

/* Push a circle out of a rect; returns corrected {x, y} */
function circleRectResolve(cx, cy, r, rx, ry, rw, rh) {
  const nx = clamp(cx, rx, rx + rw);
  const ny = clamp(cy, ry, ry + rh);
  const dx = cx - nx, dy = cy - ny;
  const d = Math.hypot(dx, dy);
  if (d >= r) return null;
  if (d === 0) {
    // centre is inside the rect: push out through the nearest face
    const left = cx - rx, right = rx + rw - cx, top = cy - ry, bottom = ry + rh - cy;
    const m = Math.min(left, right, top, bottom);
    if (m === left) return { x: rx - r, y: cy };
    if (m === right) return { x: rx + rw + r, y: cy };
    if (m === top) return { x: cx, y: ry - r };
    return { x: cx, y: ry + rh + r };
  }
  return { x: nx + (dx / d) * r, y: ny + (dy / d) * r };
}
