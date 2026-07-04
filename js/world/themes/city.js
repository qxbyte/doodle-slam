'use strict';

/* ============================================================
   City theme: rails, crosswalks, courts, cars, kiosks and the
   paper-block buildings (office/mall/heli/house/billboard/
   station/stadium).
   ============================================================ */

function drawRails(g, rng, map) {
  for (const rail of map.rails) {
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    for (const off of [-8, 8]) {
      wobblyPath(g, rng, [[0, rail.y + off], [WORLD.w, rail.y + off]], 1.5);
      g.stroke();
    }
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 2.5;
    g.beginPath();
    for (let x = 10; x < WORLD.w; x += 30) {
      g.moveTo(x + rand(rng, -2, 2), rail.y - 12);
      g.lineTo(x + rand(rng, -2, 2), rail.y + 12);
    }
    g.stroke();
  }
}

function drawCrosswalks(g, rng, map) {
  g.lineWidth = 5;
  g.strokeStyle = 'rgba(120,120,116,0.5)';
  for (const cw of map.crosswalks) {
    for (let i = 0; i < 6; i++) {
      g.beginPath();
      g.moveTo(cw.x + i * 11, cw.y);
      g.lineTo(cw.x + 5 + i * 11, cw.y + 100);
      g.stroke();
    }
  }
}

function drawCourts(g, rng, map) {
  for (const ct of map.courts) {
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    wobblyRect(g, rng, ct.x, ct.y, ct.w, ct.h, 1.5);
    g.stroke();
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(ct.x + ct.w / 2, ct.y);
    g.lineTo(ct.x + ct.w / 2, ct.y + ct.h);
    g.stroke();
    wobblyCircle(g, rng, ct.x + ct.w / 2, ct.y + ct.h / 2, 20, 0.06);
    g.stroke();
    for (const side of [ct.x + 14, ct.x + ct.w - 14]) {
      g.beginPath();
      g.arc(side, ct.y + ct.h / 2, 9, 0, Math.PI * 2);
      g.stroke();
    }
  }
}

function drawCars(g, rng, map) {
  for (const [cx, cy, vert] of map.cars) {
    g.save();
    g.translate(cx, cy);
    if (vert) g.rotate(Math.PI / 2);
    g.lineWidth = 1.6;
    g.strokeStyle = INK;
    g.fillStyle = '#e7e5de';
    g.beginPath(); g.roundRect(-26, -12, 52, 24, 8); g.fill(); g.stroke();
    g.beginPath(); g.roundRect(-12, -9, 20, 18, 4); g.stroke();
    g.beginPath(); g.moveTo(16, -12); g.lineTo(16, 12); g.stroke();
    g.restore();
  }
}

function drawKiosks(g, rng, map) {
  for (const [hx, hy] of map.kiosks) {
    g.beginPath();
    for (let i = 0; i <= 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.3;
      const x = hx + Math.cos(a) * 34, y = hy + Math.sin(a) * 34;
      i === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.lineWidth = 1.6;
    g.strokeStyle = INK;
    g.stroke();
    g.beginPath(); g.moveTo(hx - 34, hy); g.lineTo(hx + 34, hy); g.stroke();
  }
}

registerFeature(20, drawRails);
registerFeature(24, drawCrosswalks);
registerFeature(36, drawCourts);
registerFeature(60, drawCars);
registerFeature(62, drawKiosks);

function drawCityBlock(t, rng, b) {
  const { x, y, w, h, kind } = b;

  // paper fill so paint never shows through, soft cast shadow first
  t.fillStyle = 'rgba(90,90,86,0.12)';
  t.beginPath(); t.roundRect(x + 6, y + 8, w, h, 3); t.fill();
  t.fillStyle = PAPER;
  t.fillRect(x - 2, y - 2, w + 4, h + 4);

  // double wobbly outline = confident pencil pass
  t.strokeStyle = INK;
  t.lineWidth = 2;
  wobblyRect(t, rng, x, y, w, h, 1.8);
  t.stroke();
  t.lineWidth = 0.9;
  t.strokeStyle = INK_LIGHT;
  wobblyRect(t, rng, x + 1.5, y + 1.5, w - 3, h - 3, 1.2);
  t.stroke();

  // hatched roof band along the top edge
  hatchRect(t, rng, x, y, w, 16, 5);

  if (kind === 'mall') {
    t.strokeStyle = INK;
    t.lineWidth = 1.8;
    t.beginPath();
    const scallops = Math.floor(w / 34);
    for (let i = 0; i < scallops; i++) {
      t.arc(x + 17 + i * 34, y + 26, 17, Math.PI, 0, true);
    }
    t.stroke();
    t.font = `26px 'Patrick Hand', 'Chalkboard SE', cursive`;
    t.fillStyle = INK;
    t.textAlign = 'left';
    t.fillText('MALL', x + 18, y + 58);
  }

  if (kind === 'billboard') {
    const sw = w * 0.72, sx = x + (w - sw) / 2, sy = y + 22;
    t.fillStyle = '#fff';
    t.strokeStyle = INK;
    t.lineWidth = 2;
    wobblyRect(t, rng, sx, sy, sw, 36, 1.5);
    t.fill(); t.stroke();
    t.beginPath();
    t.moveTo(sx + 14, sy + 36); t.lineTo(sx + 10, sy + 48);
    t.moveTo(sx + sw - 14, sy + 36); t.lineTo(sx + sw - 10, sy + 48);
    t.stroke();
    t.font = `bold 20px 'Patrick Hand', 'Chalkboard SE', cursive`;
    t.fillStyle = INK;
    t.textAlign = 'center';
    t.fillText('DOODLE SLAM!', sx + sw / 2, sy + 25);
  }

  if (kind === 'heli') {
    const cx = x + w / 2, cy = y + h / 2 + 8;
    t.strokeStyle = INK;
    t.lineWidth = 2;
    wobblyCircle(t, rng, cx, cy, Math.min(w, h) * 0.26, 0.03);
    t.stroke();
    t.font = `900 30px 'Archivo', 'Arial Black', sans-serif`;
    t.fillStyle = INK;
    t.textAlign = 'center';
    t.textBaseline = 'middle';
    t.fillText('H', cx, cy + 2);
    t.textBaseline = 'alphabetic';
  }

  if (kind === 'station') {
    // long awning + STATION sign + a clock
    t.strokeStyle = INK;
    t.lineWidth = 1.8;
    t.beginPath();
    const scallops = Math.floor(w / 30);
    for (let i = 0; i < scallops; i++) {
      t.arc(x + 15 + i * 30, y + 24, 15, Math.PI, 0, true);
    }
    t.stroke();
    t.font = `24px 'Patrick Hand', 'Chalkboard SE', cursive`;
    t.fillStyle = INK;
    t.textAlign = 'center';
    t.fillText('STATION', x + w / 2, y + 56);
    const cx = x + w - 36, cy = y + 48;
    wobblyCircle(t, rng, cx, cy, 11, 0.05);
    t.fillStyle = '#fff'; t.fill();
    t.strokeStyle = INK;
    t.lineWidth = 1.4; t.stroke();
    t.beginPath();
    t.moveTo(cx, cy); t.lineTo(cx, cy - 7);
    t.moveTo(cx, cy); t.lineTo(cx + 5, cy + 2);
    t.stroke();
  }

  if (kind === 'stadium') {
    // running track + pitch instead of windows
    const cx = x + w / 2, cy = y + h / 2 + 6;
    t.strokeStyle = INK;
    t.lineWidth = 2;
    for (const [rw, rh] of [[w * 0.38, h * 0.32], [w * 0.28, h * 0.22]]) {
      t.beginPath();
      t.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
      t.stroke();
    }
    t.strokeStyle = INK_LIGHT;
    t.lineWidth = 1.1;
    t.beginPath();
    t.moveTo(cx - w * 0.28, cy); t.lineTo(cx + w * 0.28, cy);
    t.stroke();
    t.font = `22px 'Patrick Hand', 'Chalkboard SE', cursive`;
    t.fillStyle = INK;
    t.textAlign = 'center';
    t.fillText('STADIUM', cx, y + h - 16);
    return; // no window grid
  }

  // window grid (skip the helipad centre)
  const wy0 = y + (kind === 'mall' ? 66 : kind === 'billboard' ? 58 : kind === 'station' ? 66 : 30);
  const cols = Math.max(2, Math.floor(w / 52));
  const rows = Math.max(kind === 'station' ? 1 : 2, Math.floor((y + h - 14 - wy0) / 44));
  const gapX = w / (cols + 1), gapY = (y + h - 14 - wy0) / Math.max(rows, 1);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const wx = x + gapX * (c + 1) - 8, wyy = wy0 + gapY * r + 6;
      if (kind === 'heli' && dist(wx + 8, wyy + 10, x + w / 2, y + h / 2 + 8) < Math.min(w, h) * 0.3) continue;
      t.strokeStyle = INK;
      t.lineWidth = 1.3;
      const lit = rng() < 0.18;
      if (lit) { t.fillStyle = '#c9c9c2'; t.fillRect(wx, wyy, 16, 20); }
      wobblyRect(t, rng, wx, wyy, 16, 20, 0.8);
      t.stroke();
      t.beginPath();
      t.moveTo(wx + 8 + rand(rng, -1, 1), wyy); t.lineTo(wx + 8 + rand(rng, -1, 1), wyy + 20);
      t.lineWidth = 0.8;
      t.stroke();
    }
  }

  if (kind === 'house') {
    t.fillStyle = '#dddbd3';
    const dx = x + w / 2 - 11, dy = y + h - 30;
    t.fillRect(dx, dy, 22, 28);
    t.strokeStyle = INK;
    t.lineWidth = 1.4;
    wobblyRect(t, rng, dx, dy, 22, 28, 1);
    t.stroke();
    t.beginPath(); t.arc(dx + 17, dy + 15, 1.4, 0, Math.PI * 2); t.fillStyle = INK; t.fill();
  }
}

registerObstacles({
  office: drawCityBlock, mall: drawCityBlock, heli: drawCityBlock,
  house: drawCityBlock, billboard: drawCityBlock, station: drawCityBlock,
  stadium: drawCityBlock,
});
