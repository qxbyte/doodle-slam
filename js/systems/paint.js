'use strict';

/* ============================================================
   Paint state:
   - paintCanvas: full-res splats, composited between ground
     and building layers each frame
   - grid: coarse ownership map (cell = 20px) for coverage %,
     the minimap, and "am I standing on my own paint?"
   ============================================================ */

const CELL = 20;
const GRID_W = WORLD.w / CELL;
const GRID_H = WORLD.h / CELL;

let paintCanvas, paintCtx;
let grid;          // Int8Array: -2 building, -1 unpainted, 0..3 team
let paintRng;

function initPaint() {
  paintCanvas = document.createElement('canvas');
  paintCanvas.width = WORLD.w;
  paintCanvas.height = WORLD.h;
  paintCtx = paintCanvas.getContext('2d');
  paintRng = makeRng(Math.floor(Math.random() * 1e9) + 1);

  grid = new Int8Array(GRID_W * GRID_H).fill(-1);
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const cx = gx * CELL + CELL / 2, cy = gy * CELL + CELL / 2;
      if (OBSTACLES.some(b => cx > b.x && cx < b.x + b.w && cy > b.y && cy < b.y + b.h) ||
          LAVA.some(r => cx > r.x && cx < r.x + r.w && cy > r.y && cy < r.y + r.h)) {
        grid[gy * GRID_W + gx] = -2;
      }
    }
  }
}

/* The boss's trade: wipe paint back to blank paper */
function erasePaint(x, y, r) {
  paintCtx.save();
  paintCtx.globalCompositeOperation = 'destination-out';
  paintCtx.beginPath();
  paintCtx.arc(x, y, r, 0, Math.PI * 2);
  paintCtx.fill();
  paintCtx.restore();
  const gr = Math.ceil(r / CELL);
  const gx0 = Math.floor(x / CELL), gy0 = Math.floor(y / CELL);
  for (let gy = gy0 - gr; gy <= gy0 + gr; gy++) {
    for (let gx = gx0 - gr; gx <= gx0 + gr; gx++) {
      if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) continue;
      const cx = gx * CELL + CELL / 2, cy = gy * CELL + CELL / 2;
      if (dist(x, y, cx, cy) <= r && grid[gy * GRID_W + gx] >= 0) {
        grid[gy * GRID_W + gx] = -1;
      }
    }
  }
}

/* Land a splat: draw it and claim grid cells under the blob */
function splat(x, y, r, teamId) {
  drawSplat(paintCtx, paintRng, x, y, r, TEAMS[teamId].color);
  const gr = Math.ceil(r / CELL);
  const gx0 = Math.floor(x / CELL), gy0 = Math.floor(y / CELL);
  for (let gy = gy0 - gr; gy <= gy0 + gr; gy++) {
    for (let gx = gx0 - gr; gx <= gx0 + gr; gx++) {
      if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) continue;
      const cx = gx * CELL + CELL / 2, cy = gy * CELL + CELL / 2;
      if (dist(x, y, cx, cy) > r) continue;
      const i = gy * GRID_W + gx;
      if (grid[i] !== -2) grid[i] = teamId;
    }
  }
}

function paintAt(x, y) {
  const gx = Math.floor(x / CELL), gy = Math.floor(y / CELL);
  if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) return -1;
  return grid[gy * GRID_W + gx];
}

/* Coverage as a fraction of all paintable cells, per team */
function coverage() {
  const counts = [0, 0, 0, 0];
  let paintable = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] === -2) continue;
    paintable++;
    if (grid[i] >= 0) counts[grid[i]]++;
  }
  return counts.map(c => c / paintable);
}
