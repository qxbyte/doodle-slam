'use strict';

/* ============================================================
   World renderer — turns a map definition into two offscreen
   layers, prerendered once per match:
     groundLayer — paper, roads, water, decor (paint covers it)
     topLayer    — buildings & signs (stay clean above the paint)
   All jitter comes from the map's seeded rng, so art is stable.
   ============================================================ */

let groundLayer, topLayer;

function buildWorldLayers(map) {
  const rng = makeRng(map.seed);

  /* ---------------- ground layer ---------------- */
  groundLayer = document.createElement('canvas');
  groundLayer.width = WORLD.w; groundLayer.height = WORLD.h;
  const g = groundLayer.getContext('2d');
  g.lineJoin = 'round';
  g.lineCap = 'round';

  g.fillStyle = PAPER;
  g.fillRect(0, 0, WORLD.w, WORLD.h);

  // faint paper grain: sparse pencil specks
  g.fillStyle = 'rgba(90,90,86,0.05)';
  for (let i = 0; i < 1600; i++) {
    g.fillRect(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 1, 2.4), 1);
  }

  drawRails(g, rng, map);
  drawRoads(g, rng, map);
  drawCrosswalks(g, rng, map);
  drawWater(g, rng, map);
  drawBridges(g, rng, map);
  drawPlaza(g, rng, map);
  drawCourts(g, rng, map);
  drawGrass(g, rng, map);
  drawFlowers(g, rng, map);
  drawLogs(g, rng, map);
  drawTrees(g, rng, map);
  drawPines(g, rng, map);
  drawCars(g, rng, map);
  drawKiosks(g, rng, map);
  drawDoodles(g, rng, map);

  /* ---------------- top layer (buildings) ---------------- */
  topLayer = document.createElement('canvas');
  topLayer.width = WORLD.w; topLayer.height = WORLD.h;
  const t = topLayer.getContext('2d');
  t.lineJoin = 'round';
  t.lineCap = 'round';

  for (const b of map.buildings) drawBuilding(t, rng, b);
}

/* ---------------- ground features ---------------- */

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

function drawRoads(g, rng, map) {
  const dirt = map.roadStyle === 'dirt';
  g.strokeStyle = INK_LIGHT;
  g.lineWidth = 1.4;
  for (const r of map.roads) {
    const horiz = r.y1 === r.y2;
    const half = r.w / 2;
    // dirt paths get loose dashed edges and no centre line
    if (dirt) g.setLineDash([14, 10]);
    for (const off of [-half, half]) {
      wobblyPath(g, rng, horiz
        ? [[r.x1, r.y1 + off], [r.x2, r.y2 + off]]
        : [[r.x1 + off, r.y1], [r.x2 + off, r.y2]], dirt ? 3.5 : 2);
      g.stroke();
    }
    g.setLineDash([]);
    if (!dirt) {
      g.setLineDash([16, 20]);
      wobblyPath(g, rng, [[r.x1, r.y1], [r.x2, r.y2]], 1.5);
      g.stroke();
      g.setLineDash([]);
    } else {
      // scattered pebbles along the path
      g.fillStyle = 'rgba(120,120,116,0.4)';
      const len = horiz ? r.x2 - r.x1 : r.y2 - r.y1;
      for (let d = 20; d < len; d += rand(rng, 40, 90)) {
        const ox = rand(rng, -half * 0.6, half * 0.6);
        const px = horiz ? r.x1 + d : r.x1 + ox;
        const py = horiz ? r.y1 + ox : r.y1 + d;
        g.beginPath();
        g.ellipse(px, py, rand(rng, 1.5, 3), rand(rng, 1, 2), rand(rng, 0, 3), 0, Math.PI * 2);
        g.fill();
      }
    }
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

function drawWater(g, rng, map) {
  for (const w of map.water) {
    g.fillStyle = 'rgba(110,150,175,0.20)';
    g.fillRect(w.x, w.y, w.w, w.h);
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    for (const yy of [w.y, w.y + w.h]) {
      wobblyPath(g, rng, [[w.x, yy], [w.x + w.w, yy]], 2.5);
      g.stroke();
    }
    // wave squiggles
    g.strokeStyle = 'rgba(74,74,72,0.5)';
    g.lineWidth = 1.2;
    for (let i = 0; i < w.w * w.h / 6000; i++) {
      const sx = rand(rng, w.x + 20, w.x + w.w - 50);
      const sy = rand(rng, w.y + 20, w.y + w.h - 20);
      g.beginPath();
      g.moveTo(sx, sy);
      g.quadraticCurveTo(sx + 8, sy - 4, sx + 16, sy);
      g.quadraticCurveTo(sx + 24, sy + 4, sx + 30, sy);
      g.stroke();
    }
  }
}

function drawBridges(g, rng, map) {
  for (const b of map.bridges) {
    g.fillStyle = PAPER;
    g.fillRect(b.x, b.y, b.w, b.h);
    g.strokeStyle = INK;
    g.lineWidth = 2;
    for (const xx of [b.x, b.x + b.w]) {
      wobblyPath(g, rng, [[xx, b.y], [xx, b.y + b.h]], 1.5);
      g.stroke();
    }
    // deck planks
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 1.1;
    g.beginPath();
    for (let yy = b.y + 10; yy < b.y + b.h - 4; yy += 12) {
      g.moveTo(b.x + 4, yy + rand(rng, -1.5, 1.5));
      g.lineTo(b.x + b.w - 4, yy + rand(rng, -1.5, 1.5));
    }
    g.stroke();
  }
}

function drawPlaza(g, rng, map) {
  const p = map.plaza;
  g.strokeStyle = INK_LIGHT;
  g.lineWidth = 1.4;
  for (const rr of [p.r, p.r * 0.72]) {
    g.setLineDash(rr === p.r ? [10, 12] : []);
    wobblyCircle(g, rng, p.x, p.y, rr, 0.02);
    g.stroke();
    g.setLineDash([]);
  }
  if (map.plazaStyle === 'fountain') {
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    wobblyCircle(g, rng, p.x, p.y, 34, 0.05);
    g.stroke();
    g.beginPath();
    for (let a = 0; a < Math.PI * 6; a += 0.2) {
      const rr = 3 + a * 1.5;
      const x = p.x + Math.cos(a) * rr, y = p.y + Math.sin(a) * rr;
      a === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.lineWidth = 1.2;
    g.strokeStyle = INK_LIGHT;
    g.stroke();
  } else if (map.plazaStyle === 'pond') {
    g.fillStyle = 'rgba(110,150,175,0.20)';
    wobblyCircle(g, rng, p.x, p.y, 42, 0.12);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    g.stroke();
    // reeds on the bank
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 1.3;
    for (let i = 0; i < 5; i++) {
      const a = rand(rng, 0, Math.PI * 2);
      const bx = p.x + Math.cos(a) * 48, by = p.y + Math.sin(a) * 48;
      g.beginPath();
      g.moveTo(bx, by);
      g.quadraticCurveTo(bx + rand(rng, -4, 4), by - 12, bx + rand(rng, -6, 6), by - 20);
      g.stroke();
    }
  } else if (map.plazaStyle === 'campfire') {
    // stone ring
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      const sx = p.x + Math.cos(a) * 26, sy = p.y + Math.sin(a) * 26;
      g.fillStyle = '#dedcd4';
      g.beginPath();
      g.ellipse(sx, sy, rand(rng, 4, 6), rand(rng, 3, 5), a, 0, Math.PI * 2);
      g.fill(); g.stroke();
    }
    // the flame — the wilds' single warm accent
    g.fillStyle = '#e88a2a';
    g.beginPath();
    g.moveTo(p.x, p.y - 22);
    g.quadraticCurveTo(p.x + 12, p.y - 8, p.x + 6, p.y + 4);
    g.quadraticCurveTo(p.x, p.y + 10, p.x - 6, p.y + 4);
    g.quadraticCurveTo(p.x - 12, p.y - 8, p.x, p.y - 22);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    g.stroke();
    g.fillStyle = '#f0b41c';
    g.beginPath();
    g.moveTo(p.x, p.y - 10);
    g.quadraticCurveTo(p.x + 5, p.y - 2, p.x, p.y + 5);
    g.quadraticCurveTo(p.x - 5, p.y - 2, p.x, p.y - 10);
    g.fill();
    // log benches around the fire
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    g.fillStyle = '#e7e5de';
    for (const a of [0.6, 2.4, 4.2]) {
      const bx = p.x + Math.cos(a) * 62, by = p.y + Math.sin(a) * 62;
      g.save();
      g.translate(bx, by);
      g.rotate(a + Math.PI / 2);
      g.beginPath(); g.roundRect(-22, -5, 44, 10, 5); g.fill(); g.stroke();
      g.restore();
    }
  } else if (map.plazaStyle === 'stones') {
    // standing stones circle
    g.strokeStyle = INK;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + 0.4;
      const sx = p.x + Math.cos(a) * 52, sy = p.y + Math.sin(a) * 52;
      const sw = rand(rng, 8, 12), sh = rand(rng, 14, 22);
      g.fillStyle = '#dedcd4';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(sx - sw / 2, sy + sh / 2);
      g.lineTo(sx - sw / 2 + rand(rng, -2, 2), sy - sh / 2);
      g.lineTo(sx + sw / 2 + rand(rng, -2, 2), sy - sh / 2 + rand(rng, 0, 4));
      g.lineTo(sx + sw / 2, sy + sh / 2);
      g.closePath();
      g.fill(); g.stroke();
      hatchRect(g, rng, sx - sw / 2, sy - sh / 2, sw, sh * 0.4, 3);
    }
    // mossy centre mark
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 1.2;
    wobblyCircle(g, rng, p.x, p.y, 12, 0.15);
    g.stroke();
  }
}

/* ---- wilds ground decor ---- */

function drawGrass(g, rng, map) {
  g.strokeStyle = 'rgba(90,90,86,0.45)';
  g.lineWidth = 1.1;
  for (let i = 0; i < map.grass; i++) {
    const x = rand(rng, 30, WORLD.w - 30), y = rand(rng, 30, WORLD.h - 30);
    if (OBSTACLES.some(b => circleRectHit(x, y, 14, b.x, b.y, b.w, b.h))) continue;
    g.beginPath();
    for (const dx of [-4, 0, 4]) {
      g.moveTo(x + dx, y);
      g.lineTo(x + dx + rand(rng, -2, 2), y - rand(rng, 5, 9));
    }
    g.stroke();
  }
}

function drawFlowers(g, rng, map) {
  for (const [fx, fy] of map.flowers) {
    for (let i = 0; i < 4; i++) {
      const x = fx + rand(rng, -22, 22), y = fy + rand(rng, -16, 16);
      g.strokeStyle = INK_LIGHT;
      g.lineWidth = 1.1;
      for (let pt = 0; pt < 5; pt++) {
        const a = (pt / 5) * Math.PI * 2;
        g.beginPath();
        g.ellipse(x + Math.cos(a) * 3.4, y + Math.sin(a) * 3.4, 2.2, 1.4, a, 0, Math.PI * 2);
        g.stroke();
      }
      g.fillStyle = 'rgba(90,90,86,0.5)';
      g.beginPath(); g.arc(x, y, 1.5, 0, Math.PI * 2); g.fill();
    }
  }
}

function drawLogs(g, rng, map) {
  for (const [lx, ly, angle] of map.logs) {
    g.save();
    g.translate(lx, ly);
    g.rotate(angle);
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    g.fillStyle = '#e7e5de';
    g.beginPath(); g.roundRect(-34, -8, 68, 16, 8); g.fill(); g.stroke();
    // end rings
    g.beginPath(); g.ellipse(-34, 0, 4, 8, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(-34, 0, 1.6, 3.5, 0, 0, Math.PI * 2); g.stroke();
    // bark lines
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 1;
    g.beginPath();
    for (const yy of [-3, 1, 4]) {
      g.moveTo(-24 + rand(rng, -3, 3), yy);
      g.lineTo(28 + rand(rng, -3, 3), yy + rand(rng, -1, 1));
    }
    g.stroke();
    g.restore();
  }
}

function drawPines(g, rng, map) {
  for (const [px, py] of map.pines) {
    const s = rand(rng, 0.85, 1.25);
    g.save();
    g.translate(px, py);
    g.scale(s, s);
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    g.fillStyle = PAPER;
    // three stacked jagged tiers
    for (let tier = 0; tier < 3; tier++) {
      const ty = -tier * 13, tw = 26 - tier * 6;
      g.beginPath();
      g.moveTo(-tw, ty + 10);
      g.lineTo(-tw * 0.35 + rand(rng, -2, 2), ty + 4);
      g.lineTo(-tw * 0.55, ty + 4);
      g.lineTo(0, ty - 12 + rand(rng, -2, 2));
      g.lineTo(tw * 0.55, ty + 4);
      g.lineTo(tw * 0.35 + rand(rng, -2, 2), ty + 4);
      g.lineTo(tw, ty + 10);
      g.closePath();
      g.fill(); g.stroke();
    }
    // trunk tick
    g.beginPath(); g.moveTo(0, 10); g.lineTo(0, 18); g.stroke();
    g.restore();
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

function drawTrees(g, rng, map) {
  for (const [tx, ty] of map.trees) {
    g.lineWidth = 1.5;
    g.strokeStyle = INK;
    scribbleBlob(g, rng, tx, ty, rand(rng, 18, 30));
    g.stroke();
    g.beginPath(); g.moveTo(tx, ty + 18); g.lineTo(tx + 3, ty + 30); g.stroke();
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

function drawDoodles(g, rng, map) {
  // stray margin swirls, skipped where they would sit on an obstacle
  for (let i = 0; i < 8; i++) {
    const x = rand(rng, 100, WORLD.w - 100), y = rand(rng, 100, WORLD.h - 100);
    if (OBSTACLES.some(b => circleRectHit(x, y, 60, b.x, b.y, b.w, b.h))) continue;
    g.beginPath();
    for (let a = 0; a < Math.PI * 4; a += 0.3) {
      const rr = 2 + a * 2;
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      a === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
    }
    g.lineWidth = 1;
    g.strokeStyle = 'rgba(120,120,116,0.4)';
    g.stroke();
  }
}

/* ---------------- buildings ---------------- */

function drawBuilding(t, rng, b) {
  const { x, y, w, h, kind } = b;

  // wilds obstacles are organic shapes, not city blocks
  const wilds = {
    cabin: drawCabin, tower: drawTower, tent: drawTent,
    rock: drawRock, bigtree: drawBigTree, mushroom: drawMushrooms,
  };
  if (wilds[kind]) { wilds[kind](t, rng, b); return; }

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

/* ---------------- wilds obstacles ---------------- */

function wildsShadow(t, x, y, w, h) {
  t.fillStyle = 'rgba(90,90,86,0.12)';
  t.beginPath();
  t.ellipse(x + w / 2 + 5, y + h - 4, w * 0.5, h * 0.16, 0, 0, Math.PI * 2);
  t.fill();
}

function drawCabin(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const roofH = h * 0.34;
  // log walls
  t.fillStyle = PAPER;
  t.fillRect(x, y + roofH, w, h - roofH);
  t.strokeStyle = INK;
  t.lineWidth = 2;
  wobblyRect(t, rng, x, y + roofH, w, h - roofH, 1.6);
  t.stroke();
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 1;
  t.beginPath();
  for (let yy = y + roofH + 12; yy < y + h - 6; yy += 12) {
    t.moveTo(x + 3, yy + rand(rng, -1.5, 1.5));
    t.lineTo(x + w - 3, yy + rand(rng, -1.5, 1.5));
  }
  t.stroke();
  // gable roof
  t.fillStyle = PAPER;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(x - 8, y + roofH);
  t.lineTo(x + w / 2 + rand(rng, -3, 3), y);
  t.lineTo(x + w + 8, y + roofH);
  t.closePath();
  t.fill(); t.stroke();
  hatchRect(t, rng, x - 8, y + 4, w + 16, roofH - 6, 5);
  // chimney + smoke
  t.fillStyle = PAPER;
  t.fillRect(x + w * 0.72, y + 2, 12, roofH * 0.5);
  wobblyRect(t, rng, x + w * 0.72, y + 2, 12, roofH * 0.5, 1);
  t.stroke();
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 1.2;
  t.beginPath();
  t.moveTo(x + w * 0.72 + 6, y - 4);
  t.quadraticCurveTo(x + w * 0.72 + 14, y - 12, x + w * 0.72 + 8, y - 20);
  t.stroke();
  // door + window
  t.strokeStyle = INK;
  t.lineWidth = 1.4;
  t.fillStyle = '#dddbd3';
  const dx = x + w / 2 - 10, dy = y + h - 28;
  t.fillRect(dx, dy, 20, 26);
  wobblyRect(t, rng, dx, dy, 20, 26, 1);
  t.stroke();
  wobblyRect(t, rng, x + w * 0.16, y + roofH + 14, 18, 16, 1);
  t.stroke();
  t.beginPath();
  t.moveTo(x + w * 0.16 + 9, y + roofH + 14);
  t.lineTo(x + w * 0.16 + 9, y + roofH + 30);
  t.stroke();
}

function drawTower(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cabinH = h * 0.42;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // splayed legs with cross braces
  t.beginPath();
  t.moveTo(x + w * 0.22, y + cabinH); t.lineTo(x + 4, y + h);
  t.moveTo(x + w * 0.78, y + cabinH); t.lineTo(x + w - 4, y + h);
  t.stroke();
  t.lineWidth = 1.3;
  t.beginPath();
  t.moveTo(x + w * 0.16, y + h * 0.62); t.lineTo(x + w * 0.84, y + h * 0.92);
  t.moveTo(x + w * 0.84, y + h * 0.62); t.lineTo(x + w * 0.16, y + h * 0.92);
  t.stroke();
  // ladder up the middle
  t.strokeStyle = INK_LIGHT;
  t.beginPath();
  t.moveTo(x + w * 0.46, y + cabinH); t.lineTo(x + w * 0.46, y + h);
  t.moveTo(x + w * 0.54, y + cabinH); t.lineTo(x + w * 0.54, y + h);
  for (let yy = y + cabinH + 8; yy < y + h; yy += 11) {
    t.moveTo(x + w * 0.46, yy); t.lineTo(x + w * 0.54, yy);
  }
  t.stroke();
  // lookout cabin on top
  t.fillStyle = PAPER;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillRect(x + w * 0.12, y + h * 0.14, w * 0.76, cabinH - h * 0.14);
  wobblyRect(t, rng, x + w * 0.12, y + h * 0.14, w * 0.76, cabinH - h * 0.14, 1.4);
  t.stroke();
  // wide roof
  t.beginPath();
  t.moveTo(x - 4, y + h * 0.14);
  t.lineTo(x + w / 2, y);
  t.lineTo(x + w + 4, y + h * 0.14);
  t.closePath();
  t.fillStyle = PAPER;
  t.fill(); t.stroke();
  // lookout window
  t.lineWidth = 1.3;
  wobblyRect(t, rng, x + w * 0.3, y + h * 0.2, w * 0.4, h * 0.14, 1);
  t.stroke();
}

function drawTent(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.fillStyle = PAPER;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // A-frame silhouette
  t.beginPath();
  t.moveTo(x + 2, y + h);
  t.quadraticCurveTo(x + w * 0.15, y + h * 0.4, x + w / 2 + rand(rng, -3, 3), y + 2);
  t.quadraticCurveTo(x + w * 0.85, y + h * 0.4, x + w - 2, y + h);
  t.closePath();
  t.fill(); t.stroke();
  // door flap, shaded
  t.beginPath();
  t.moveTo(x + w / 2, y + 6);
  t.lineTo(x + w * 0.34, y + h);
  t.lineTo(x + w * 0.66, y + h);
  t.closePath();
  t.fillStyle = '#dddbd3';
  t.fill();
  t.lineWidth = 1.4;
  t.stroke();
  hatchRect(t, rng, x + w * 0.36, y + h * 0.5, w * 0.28, h * 0.5, 4);
  // ridge pennant
  t.strokeStyle = INK;
  t.beginPath();
  t.moveTo(x + w / 2, y + 2); t.lineTo(x + w / 2, y - 12);
  t.stroke();
  t.fillStyle = '#e6392a';
  t.beginPath();
  t.moveTo(x + w / 2, y - 12);
  t.lineTo(x + w / 2 + 12, y - 8);
  t.lineTo(x + w / 2, y - 4);
  t.closePath();
  t.fill(); t.stroke();
}

function drawRock(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.fillStyle = '#e7e5de';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // main boulder: lumpy hull
  t.beginPath();
  const cx = x + w / 2, cy = y + h / 2;
  const pts = 8;
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const rr = (i % 2 ? 0.85 : 1) * (Math.abs(Math.cos(a)) * w + Math.abs(Math.sin(a)) * h) / 2.2;
    const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.85;
    i === 0 ? t.moveTo(px, py) : t.lineTo(px, py);
  }
  t.closePath();
  t.fill(); t.stroke();
  // a smaller companion stone
  t.beginPath();
  t.ellipse(x + w * 0.85, y + h * 0.8, w * 0.16, h * 0.18, 0.3, 0, Math.PI * 2);
  t.fill(); t.stroke();
  // crack + base shading
  t.lineWidth = 1.2;
  t.strokeStyle = INK_LIGHT;
  t.beginPath();
  t.moveTo(cx - w * 0.1, y + h * 0.25);
  t.lineTo(cx + rand(rng, -6, 6), cy);
  t.lineTo(cx - w * 0.05, y + h * 0.8);
  t.stroke();
  hatchRect(t, rng, x + w * 0.12, y + h * 0.62, w * 0.5, h * 0.3, 4);
}

function drawBigTree(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2, cy = y + h * 0.42;
  // trunk
  t.fillStyle = PAPER;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(cx - w * 0.09, y + h);
  t.quadraticCurveTo(cx - w * 0.13, cy + h * 0.2, cx - w * 0.06, cy);
  t.lineTo(cx + w * 0.06, cy);
  t.quadraticCurveTo(cx + w * 0.13, cy + h * 0.2, cx + w * 0.09, y + h);
  t.closePath();
  t.fill(); t.stroke();
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 1;
  t.beginPath();
  t.moveTo(cx - 2, cy + h * 0.15); t.lineTo(cx - 3, y + h - 6);
  t.moveTo(cx + 3, cy + h * 0.2); t.lineTo(cx + 4, y + h - 8);
  t.stroke();
  // huge scribbled canopy, double pass
  t.fillStyle = PAPER;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  scribbleBlob(t, rng, cx, cy - h * 0.08, w * 0.46);
  t.fill(); t.stroke();
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 1.1;
  scribbleBlob(t, rng, cx - w * 0.12, cy - h * 0.16, w * 0.3);
  t.stroke();
  scribbleBlob(t, rng, cx + w * 0.14, cy, w * 0.26);
  t.stroke();
  // tyre swing for character
  t.strokeStyle = INK;
  t.lineWidth = 1.4;
  t.beginPath();
  t.moveTo(cx + w * 0.3, cy + h * 0.1);
  t.lineTo(cx + w * 0.3, cy + h * 0.34);
  t.stroke();
  t.beginPath();
  t.arc(cx + w * 0.3, cy + h * 0.4, 7, 0, Math.PI * 2);
  t.stroke();
}

function drawMushrooms(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  // 2-3 giant mushrooms of varying size
  const shrooms = [
    [x + w * 0.36, y + h, w * 0.36, h * 0.9],
    [x + w * 0.74, y + h, w * 0.24, h * 0.62],
    [x + w * 0.12, y + h, w * 0.16, h * 0.42],
  ];
  for (const [mx, my, mw, mh] of shrooms) {
    // stem
    t.fillStyle = PAPER;
    t.strokeStyle = INK;
    t.lineWidth = 1.8;
    t.beginPath();
    t.moveTo(mx - mw * 0.28, my);
    t.quadraticCurveTo(mx - mw * 0.2, my - mh * 0.55, mx - mw * 0.24, my - mh * 0.6);
    t.lineTo(mx + mw * 0.24, my - mh * 0.6);
    t.quadraticCurveTo(mx + mw * 0.2, my - mh * 0.55, mx + mw * 0.28, my);
    t.closePath();
    t.fill(); t.stroke();
    // cap
    t.beginPath();
    t.moveTo(mx - mw * 0.5, my - mh * 0.55);
    t.quadraticCurveTo(mx, my - mh * 1.25, mx + mw * 0.5, my - mh * 0.55);
    t.quadraticCurveTo(mx, my - mh * 0.42, mx - mw * 0.5, my - mh * 0.55);
    t.closePath();
    t.fill(); t.stroke();
    // spots
    t.fillStyle = '#dddbd3';
    for (let i = 0; i < 3; i++) {
      t.beginPath();
      t.arc(mx + rand(rng, -mw * 0.3, mw * 0.3), my - mh * rand(rng, 0.65, 0.95),
            rand(rng, 2, 4.5), 0, Math.PI * 2);
      t.fill();
      t.stroke();
    }
  }
}
