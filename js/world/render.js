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

  drawGroundBase(g, rng, map);
  drawPapers(g, rng, map);
  drawRings(g, rng, map);
  drawCraters(g, rng, map);
  drawPrints(g, rng, map);
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
  drawClips(g, rng, map);
  drawShavings(g, rng, map);
  drawFlags(g, rng, map);
  drawTrees(g, rng, map);
  drawPines(g, rng, map);
  drawCars(g, rng, map);
  drawKiosks(g, rng, map);
  drawDoodles(g, rng, map);
  drawVignette(g);

  /* ---------------- top layer (buildings) ---------------- */
  topLayer = document.createElement('canvas');
  topLayer.width = WORLD.w; topLayer.height = WORLD.h;
  const t = topLayer.getContext('2d');
  t.lineJoin = 'round';
  t.lineCap = 'round';

  for (const b of map.buildings) drawBuilding(t, rng, b);
}

/* ---------------- ground base surfaces ---------------- */

function drawGroundBase(g, rng, map) {
  if (map.ground === 'desk') {
    // warm wood: base, long grain strokes, plank seams, a few knots
    g.fillStyle = '#eedfcf';
    g.fillRect(0, 0, WORLD.w, WORLD.h);
    g.strokeStyle = 'rgba(150,108,74,0.13)';
    g.lineWidth = 1.4;
    for (let y = 10; y < WORLD.h; y += rand(rng, 14, 30)) {
      g.beginPath();
      let px = 0, py = y;
      g.moveTo(px, py);
      while (px < WORLD.w) {
        px += rand(rng, 80, 220);
        py = y + rand(rng, -4, 4);
        g.quadraticCurveTo(px - rand(rng, 30, 80), y + rand(rng, -7, 7), px, py);
      }
      g.stroke();
    }
    // plank seams
    g.strokeStyle = 'rgba(130,90,60,0.25)';
    g.lineWidth = 2;
    for (const sy of [400, 810, 1220]) {
      wobblyPath(g, rng, [[0, sy], [WORLD.w, sy]], 1.2);
      g.stroke();
    }
    // knots
    for (let i = 0; i < 5; i++) {
      const kx = rand(rng, 150, WORLD.w - 150), ky = rand(rng, 100, WORLD.h - 100);
      g.strokeStyle = 'rgba(140,95,60,0.3)';
      g.lineWidth = 1.3;
      for (let r = 4; r < 18; r += 4.5) {
        g.beginPath();
        g.ellipse(kx, ky, r * 1.5, r, rand(rng, -0.2, 0.2), 0, Math.PI * 2);
        g.stroke();
      }
    }
  } else if (map.ground === 'moon') {
    // pale regolith with speckles and soft mottling
    g.fillStyle = '#e9edef';
    g.fillRect(0, 0, WORLD.w, WORLD.h);
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(150,158,168,${rand(rng, 0.03, 0.07)})`;
      g.beginPath();
      g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
                rand(rng, 80, 260), rand(rng, 60, 180), rand(rng, 0, 3), 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = 'rgba(90,98,110,0.14)';
    for (let i = 0; i < 2600; i++) {
      g.fillRect(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 1, 2.6), rand(rng, 1, 2));
    }
    // tiny star sparkles scratched into the ground
    g.strokeStyle = 'rgba(120,128,140,0.5)';
    g.lineWidth = 1;
    for (let i = 0; i < 26; i++) {
      const x = rand(rng, 40, WORLD.w - 40), y = rand(rng, 40, WORLD.h - 40);
      const s = rand(rng, 3, 6);
      g.beginPath();
      g.moveTo(x - s, y); g.lineTo(x + s, y);
      g.moveTo(x, y - s); g.lineTo(x, y + s);
      g.stroke();
    }
  } else {
    // classic paper
    g.fillStyle = PAPER;
    g.fillRect(0, 0, WORLD.w, WORLD.h);
    g.fillStyle = 'rgba(90,90,86,0.05)';
    for (let i = 0; i < 1600; i++) {
      g.fillRect(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 1, 2.4), 1);
    }
    // stray paper fibres
    g.strokeStyle = 'rgba(90,90,86,0.07)';
    g.lineWidth = 0.8;
    for (let i = 0; i < 140; i++) {
      const x = rand(rng, 0, WORLD.w), y = rand(rng, 0, WORLD.h), a = rand(rng, 0, Math.PI);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + Math.cos(a) * rand(rng, 4, 10), y + Math.sin(a) * rand(rng, 4, 10));
      g.stroke();
    }
  }
}

/* soft darkening toward the edges — makes the arena feel lit */
function drawVignette(g) {
  const grad = g.createRadialGradient(
    WORLD.w / 2, WORLD.h / 2, Math.min(WORLD.w, WORLD.h) * 0.45,
    WORLD.w / 2, WORLD.h / 2, Math.max(WORLD.w, WORLD.h) * 0.72
  );
  grad.addColorStop(0, 'rgba(70,60,50,0)');
  grad.addColorStop(1, 'rgba(70,60,50,0.10)');
  g.fillStyle = grad;
  g.fillRect(0, 0, WORLD.w, WORLD.h);
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
  if (map.roadStyle === 'tape') return drawTapeRoads(g, rng, map);
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

/* washi-tape strips stuck onto the desk — straight, translucent,
   torn at both ends */
function drawTapeRoads(g, rng, map) {
  for (const r of map.roads) {
    const horiz = r.y1 === r.y2;
    const half = r.w / 2;
    g.save();
    g.translate(r.x1, r.y1);
    if (!horiz) g.rotate(Math.PI / 2);
    const len = horiz ? r.x2 - r.x1 : r.y2 - r.y1;
    // translucent body with torn zigzag ends
    g.beginPath();
    g.moveTo(0, -half);
    g.lineTo(len, -half);
    for (let y = -half; y < half; y += 9) {
      g.lineTo(len - rand(rng, 0, 10), y + 4.5);
      g.lineTo(len, y + 9);
    }
    g.lineTo(0, half);
    for (let y = half; y > -half; y -= 9) {
      g.lineTo(rand(rng, 0, 10), y - 4.5);
      g.lineTo(0, y - 9);
    }
    g.closePath();
    g.fillStyle = 'rgba(252,248,235,0.55)';
    g.fill();
    g.strokeStyle = 'rgba(160,146,120,0.55)';
    g.lineWidth = 1.4;
    g.stroke();
    // faint sheen stripes across the tape
    g.strokeStyle = 'rgba(255,255,255,0.35)';
    g.lineWidth = 3;
    for (let x = 60; x < len; x += rand(rng, 120, 260)) {
      g.beginPath();
      g.moveTo(x, -half + 4);
      g.lineTo(x + 18, half - 4);
      g.stroke();
    }
    g.restore();
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
  } else if (map.plazaStyle === 'ink') {
    // a tipped-over ink bottle and its glossy spill
    const spillRng = makeRng(map.seed + 7);
    drawSplat(g, spillRng, p.x, p.y, 58, '#26262c');
    drawSplat(g, spillRng, p.x - 30, p.y + 18, 26, '#26262c');
    // highlight on the wet ink
    g.fillStyle = 'rgba(255,255,255,0.22)';
    g.beginPath();
    g.ellipse(p.x - 14, p.y - 14, 20, 9, -0.5, 0, Math.PI * 2);
    g.fill();
    // the bottle, lying on its side above the puddle
    g.save();
    g.translate(p.x + 52, p.y - 56);
    g.rotate(1.9);
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    g.fillStyle = '#3a3a44';
    g.beginPath(); g.roundRect(-16, -22, 32, 34, 6); g.fill(); g.stroke();
    g.fillStyle = '#c9c9c2';
    g.beginPath(); g.roundRect(-9, -34, 18, 12, 2); g.fill(); g.stroke();  // cap off
    g.fillStyle = '#fff';
    g.beginPath(); g.roundRect(-10, -12, 20, 16, 2); g.fill(); g.stroke(); // label
    g.font = `10px 'Patrick Hand', cursive`;
    g.fillStyle = INK;
    g.textAlign = 'center';
    g.fillText('INK', 0, 0);
    g.restore();
    // drips connecting bottle mouth to the puddle
    g.fillStyle = '#26262c';
    for (const [dx, dy, r] of [[38, -34, 5], [28, -20, 7], [16, -6, 9]]) {
      g.beginPath(); g.arc(p.x + dx, p.y + dy, r, 0, Math.PI * 2); g.fill();
    }
  } else if (map.plazaStyle === 'crater') {
    // the big crater: bold rim, inner shading, ejecta rays, rim rocks
    g.strokeStyle = INK;
    g.lineWidth = 2.4;
    wobblyCircle(g, rng, p.x, p.y, 64, 0.08);
    g.fillStyle = 'rgba(140,148,160,0.18)';
    g.fill();
    g.stroke();
    g.lineWidth = 1.2;
    g.strokeStyle = INK_LIGHT;
    wobblyCircle(g, rng, p.x + 6, p.y + 7, 46, 0.1);
    g.stroke();
    // crescent shadow inside
    g.fillStyle = 'rgba(90,98,110,0.25)';
    g.beginPath();
    g.arc(p.x + 8, p.y + 9, 44, -0.6, Math.PI * 0.9);
    g.arc(p.x + 2, p.y + 3, 34, Math.PI * 0.9, -0.6, true);
    g.closePath();
    g.fill();
    // ejecta rays
    g.strokeStyle = 'rgba(120,128,140,0.5)';
    g.lineWidth = 1.3;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + 0.25;
      g.beginPath();
      g.moveTo(p.x + Math.cos(a) * 70, p.y + Math.sin(a) * 70);
      g.lineTo(p.x + Math.cos(a) * rand(rng, 90, 125), p.y + Math.sin(a) * rand(rng, 90, 125));
      g.stroke();
    }
    // rim pebbles
    g.fillStyle = '#d5dade';
    g.strokeStyle = INK;
    g.lineWidth = 1.2;
    for (let i = 0; i < 6; i++) {
      const a = rand(rng, 0, Math.PI * 2);
      g.beginPath();
      g.ellipse(p.x + Math.cos(a) * 66, p.y + Math.sin(a) * 66,
                rand(rng, 3, 6), rand(rng, 2.5, 4.5), a, 0, Math.PI * 2);
      g.fill(); g.stroke();
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

  // non-city obstacles are custom shapes, not paper blocks
  const custom = {
    cabin: drawCabin, tower: drawTower, tent: drawTent,
    rock: drawRock, bigtree: drawBigTree, mushroom: drawMushrooms,
    eraser: drawEraser, pencilcase: drawPencilcase, mug: drawMug,
    stapler: drawStapler, pencil: drawPencil, ruler: drawRuler,
    sharpener: drawSharpener, notepad: drawNotepad,
    lander: drawLander, ufo: drawUfo, dome: drawDome, rocketpad: drawRocketpad,
  };
  if (custom[kind]) { custom[kind](t, rng, b); return; }

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

/* ---------------- desk scenery (ground) ---------------- */

function drawPapers(g, rng, map) {
  const doodles = ['star', 'house', 'math', 'tictactoe', 'face', 'spring'];
  map.papers.forEach(([px, py, rot], i) => {
    g.save();
    g.translate(px, py);
    g.rotate(rot);
    // sheet with soft shadow
    g.fillStyle = 'rgba(90,70,50,0.14)';
    g.fillRect(-86, -56, 180, 122);
    g.fillStyle = '#fbfaf4';
    g.fillRect(-90, -60, 180, 120);
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 1.2;
    wobblyRect(g, rng, -90, -60, 180, 120, 1);
    g.stroke();
    // ruled lines
    g.strokeStyle = 'rgba(110,140,190,0.35)';
    g.lineWidth = 1;
    for (let y = -38; y < 56; y += 16) {
      g.beginPath(); g.moveTo(-82, y); g.lineTo(82, y); g.stroke();
    }
    g.strokeStyle = 'rgba(200,110,110,0.4)';
    g.beginPath(); g.moveTo(-68, -60); g.lineTo(-68, 60); g.stroke();
    // one doodle per sheet
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    const kind = doodles[i % doodles.length];
    if (kind === 'star') {
      g.beginPath();
      for (let k = 0; k <= 5; k++) {
        const a = -Math.PI / 2 + k * Math.PI * 4 / 5;
        const x = Math.cos(a) * 22, y = Math.sin(a) * 22;
        k === 0 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.closePath(); g.stroke();
    } else if (kind === 'house') {
      wobblyRect(g, rng, -18, -6, 36, 30, 1); g.stroke();
      g.beginPath(); g.moveTo(-24, -6); g.lineTo(0, -28); g.lineTo(24, -6); g.stroke();
      wobblyRect(g, rng, -5, 8, 10, 16, 0.8); g.stroke();
    } else if (kind === 'math') {
      g.font = `18px 'Patrick Hand', cursive`;
      g.fillStyle = INK;
      g.textAlign = 'left';
      g.fillText('2+2=5?', -50, -10);
      g.fillText('x = ?!', -30, 26);
      g.beginPath(); g.moveTo(6, -16); g.lineTo(52, -16); g.stroke();
    } else if (kind === 'tictactoe') {
      g.beginPath();
      g.moveTo(-10, -26); g.lineTo(-10, 26); g.moveTo(10, -26); g.lineTo(10, 26);
      g.moveTo(-28, -9); g.lineTo(28, -9); g.moveTo(-28, 9); g.lineTo(28, 9);
      g.stroke();
      g.beginPath(); g.arc(-19, -18, 6, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.moveTo(4, 3); g.lineTo(16, 15); g.moveTo(16, 3); g.lineTo(4, 15); g.stroke();
      g.beginPath(); g.arc(19, -18, 6, 0, Math.PI * 2); g.stroke();
    } else if (kind === 'face') {
      wobblyCircle(g, rng, 0, 0, 22, 0.06); g.stroke();
      g.beginPath(); g.arc(-8, -6, 2, 0, Math.PI * 2); g.fillStyle = INK; g.fill();
      g.beginPath(); g.arc(8, -6, 2, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.arc(0, 4, 10, 0.3, Math.PI - 0.3); g.stroke();
    } else {
      // spring scribble
      g.beginPath();
      for (let x = -40; x < 40; x += 2) {
        const y = Math.sin(x * 0.55) * 12;
        x === -40 ? g.moveTo(x, y) : g.lineTo(x, y);
      }
      g.stroke();
    }
    g.restore();
  });
}

function drawRings(g, rng, map) {
  // coffee-cup stains: broken double rings
  for (const [cx, cy] of map.rings) {
    g.strokeStyle = 'rgba(150,92,50,0.28)';
    for (const [r, w] of [[42, 7], [34, 3]]) {
      let a = rand(rng, 0, Math.PI * 2);
      while (a < Math.PI * 2 + 1) {
        const seg = rand(rng, 0.5, 1.6);
        g.lineWidth = w * rand(rng, 0.7, 1.2);
        g.beginPath();
        g.arc(cx, cy, r + rand(rng, -2, 2), a, a + seg);
        g.stroke();
        a += seg + rand(rng, 0.15, 0.5);
      }
    }
    // a couple of splashes
    g.fillStyle = 'rgba(150,92,50,0.22)';
    for (let i = 0; i < 3; i++) {
      const a = rand(rng, 0, Math.PI * 2);
      g.beginPath();
      g.arc(cx + Math.cos(a) * rand(rng, 46, 60), cy + Math.sin(a) * rand(rng, 46, 60),
            rand(rng, 2, 5), 0, Math.PI * 2);
      g.fill();
    }
  }
}

function drawClips(g, rng, map) {
  for (const [cx, cy, rot] of map.clips) {
    g.save();
    g.translate(cx, cy);
    g.rotate(rot);
    g.strokeStyle = '#8b93a5';
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-14, 8);
    g.arcTo(-14, -14, 0, -14, 9);
    g.arcTo(14, -14, 14, 0, 9);
    g.lineTo(14, 6);
    g.arcTo(14, 16, 6, 16, 7);
    g.arcTo(-8, 16, -8, 6, 7);
    g.lineTo(-8, -4);
    g.stroke();
    g.restore();
  }
}

function drawShavings(g, rng, map) {
  // pencil shavings: little wooden fans with graphite edges
  for (const [sx, sy] of map.shavings) {
    for (let i = 0; i < 4; i++) {
      const x = sx + rand(rng, -26, 26), y = sy + rand(rng, -18, 18);
      const a = rand(rng, 0, Math.PI * 2);
      g.save();
      g.translate(x, y);
      g.rotate(a);
      g.fillStyle = '#e6d3a8';
      g.strokeStyle = 'rgba(120,90,50,0.6)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(0, 0);
      g.quadraticCurveTo(14, -10, 26, -2);
      g.quadraticCurveTo(16, 4, 0, 0);
      g.closePath();
      g.fill(); g.stroke();
      g.strokeStyle = '#4a4a48';
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(20, -6); g.quadraticCurveTo(24, -4, 26, -2);
      g.stroke();
      g.restore();
    }
  }
}

/* ---------------- moon scenery (ground) ---------------- */

function drawCraters(g, rng, map) {
  for (const [cx, cy, r] of map.craters) {
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    wobblyCircle(g, rng, cx, cy, r, 0.07);
    g.fillStyle = 'rgba(140,148,160,0.13)';
    g.fill();
    g.stroke();
    // inner crescent shadow
    g.fillStyle = 'rgba(90,98,110,0.2)';
    g.beginPath();
    g.arc(cx + r * 0.12, cy + r * 0.14, r * 0.7, -0.5, Math.PI * 0.85);
    g.arc(cx + r * 0.04, cy + r * 0.05, r * 0.52, Math.PI * 0.85, -0.5, true);
    g.closePath();
    g.fill();
    // highlight rim on the lit side
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(cx - r * 0.08, cy - r * 0.1, r * 0.86, Math.PI * 0.95, Math.PI * 1.75);
    g.stroke();
  }
}

function drawFlags(g, rng, map) {
  for (const [fx, fy] of map.flags) {
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(fx, fy);
    g.lineTo(fx + rand(rng, -2, 2), fy - 34);
    g.stroke();
    g.fillStyle = '#e6392a';
    g.beginPath();
    g.moveTo(fx, fy - 34);
    g.lineTo(fx + 20, fy - 29);
    g.lineTo(fx, fy - 23);
    g.closePath();
    g.fill();
    g.lineWidth = 1.4;
    g.stroke();
    // little mound at the base
    g.strokeStyle = INK_LIGHT;
    g.beginPath();
    g.arc(fx, fy + 2, 6, Math.PI, 0);
    g.stroke();
  }
}

function drawPrints(g, rng, map) {
  // astronaut footprint trails between two points
  for (const [x1, y1, x2, y2] of map.prints) {
    const steps = Math.floor(dist(x1, y1, x2, y2) / 34);
    const a = Math.atan2(y2 - y1, x2 - x1);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = lerp(x1, x2, t) + Math.cos(a + Math.PI / 2) * (i % 2 ? 8 : -8);
      const py = lerp(y1, y2, t) + Math.sin(a + Math.PI / 2) * (i % 2 ? 8 : -8);
      g.save();
      g.translate(px, py);
      g.rotate(a + rand(rng, -0.15, 0.15));
      g.fillStyle = 'rgba(110,118,130,0.3)';
      g.beginPath();
      g.roundRect(-7, -4, 14, 8, 3.5);
      g.fill();
      // tread bars
      g.strokeStyle = 'rgba(90,98,110,0.35)';
      g.lineWidth = 1;
      g.beginPath();
      for (const bx of [-4, 0, 4]) { g.moveTo(bx, -3); g.lineTo(bx, 3); }
      g.stroke();
      g.restore();
    }
  }
}

/* ---------------- desk obstacles ---------------- */

function drawEraser(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  // white rubber with a printed sleeve around the middle
  t.fillStyle = '#f6f5f0';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath(); t.roundRect(x, y, w, h, 14); t.fill(); t.stroke();
  // worn corner shading
  hatchRect(t, rng, x + 4, y + h - 18, w * 0.3, 14, 4);
  // sleeve
  t.fillStyle = '#c9d3e2';
  t.beginPath(); t.roundRect(x + w * 0.3, y - 3, w * 0.4, h + 6, 6); t.fill(); t.stroke();
  t.font = `900 15px 'Archivo', sans-serif`;
  t.fillStyle = INK;
  t.textAlign = 'center';
  t.fillText('2B', x + w / 2, y + h / 2 + 5);
}

function drawPencilcase(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.fillStyle = '#dfe6ee';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath(); t.roundRect(x, y, w, h, 18); t.fill(); t.stroke();
  // zipper track along the top
  t.strokeStyle = INK;
  t.lineWidth = 1.4;
  t.beginPath(); t.moveTo(x + 14, y + 16); t.lineTo(x + w - 14, y + 16); t.stroke();
  t.beginPath();
  for (let zx = x + 16; zx < x + w - 16; zx += 7) {
    t.moveTo(zx, y + 12); t.lineTo(zx, y + 20);
  }
  t.stroke();
  // zipper pull
  t.fillStyle = '#8b93a5';
  t.beginPath(); t.roundRect(x + w - 34, y + 8, 18, 8, 3); t.fill(); t.stroke();
  t.beginPath(); t.arc(x + w - 12, y + 16, 4, 0, Math.PI * 2); t.stroke();
  // patch label with a doodle star
  t.fillStyle = '#fff';
  wobblyRect(t, rng, x + w * 0.36, y + h * 0.4, w * 0.28, h * 0.34, 1.2);
  t.fill(); t.stroke();
  t.font = `15px 'Patrick Hand', cursive`;
  t.fillStyle = INK;
  t.textAlign = 'center';
  t.fillText('PENS!', x + w / 2, y + h * 0.62);
  // stitching
  t.setLineDash([4, 4]);
  t.strokeStyle = INK_LIGHT;
  t.beginPath(); t.roundRect(x + 8, y + 26, w - 16, h - 34, 12); t.stroke();
  t.setLineDash([]);
}

function drawMug(t, rng, b) {
  const { x, y, w, h } = b;
  const cx = x + w * 0.44, cy = y + h / 2, r = Math.min(w, h) * 0.4;
  wildsShadow(t, x, y, w, h);
  // handle
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#f6f5f0';
  t.beginPath();
  t.ellipse(cx + r + 12, cy, 16, 24, 0, 0, Math.PI * 2);
  t.fill(); t.stroke();
  t.fillStyle = PAPER;
  t.beginPath();
  t.ellipse(cx + r + 12, cy, 7, 13, 0, 0, Math.PI * 2);
  t.fill(); t.stroke();
  // body (top view)
  t.fillStyle = '#f6f5f0';
  wobblyCircle(t, rng, cx, cy, r, 0.02);
  t.fill(); t.stroke();
  // coffee inside with a sheen
  t.fillStyle = '#7a4b28';
  wobblyCircle(t, rng, cx, cy, r * 0.78, 0.03);
  t.fill();
  t.lineWidth = 1.4;
  t.stroke();
  t.fillStyle = 'rgba(255,255,255,0.25)';
  t.beginPath();
  t.ellipse(cx - r * 0.25, cy - r * 0.25, r * 0.3, r * 0.14, -0.6, 0, Math.PI * 2);
  t.fill();
  // steam curls
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 1.6;
  for (const off of [-14, 6]) {
    t.beginPath();
    t.moveTo(cx + off, cy - r - 6);
    t.quadraticCurveTo(cx + off + 8, cy - r - 18, cx + off, cy - r - 28);
    t.quadraticCurveTo(cx + off - 8, cy - r - 38, cx + off + 2, cy - r - 46);
    t.stroke();
  }
}

function drawStapler(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  // base plate
  t.fillStyle = '#c9cdd6';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath(); t.roundRect(x, y + h * 0.45, w, h * 0.55, 10); t.fill(); t.stroke();
  // arm, slightly ajar
  t.fillStyle = '#e05a4e';
  t.beginPath();
  t.roundRect(x + 6, y, w - 30, h * 0.52, 12);
  t.fill(); t.stroke();
  // hinge
  t.fillStyle = '#8b93a5';
  t.beginPath(); t.roundRect(x + w - 30, y + h * 0.18, 24, h * 0.5, 6); t.fill(); t.stroke();
  // mouth line + staples
  t.strokeStyle = INK;
  t.lineWidth = 1.3;
  t.beginPath(); t.moveTo(x + 10, y + h * 0.45); t.lineTo(x + w * 0.6, y + h * 0.45); t.stroke();
  t.strokeStyle = '#8b93a5';
  t.beginPath();
  for (let sx2 = x + 16; sx2 < x + w * 0.5; sx2 += 6) {
    t.moveTo(sx2, y + h * 0.34); t.lineTo(sx2, y + h * 0.42);
  }
  t.stroke();
}

function drawPencil(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const bodyW = w * 0.74;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // barrel with two facet lines
  t.fillStyle = '#f2d489';
  t.beginPath(); t.rect(x + w * 0.14, y, bodyW, h); t.fill(); t.stroke();
  t.strokeStyle = 'rgba(120,90,40,0.5)';
  t.lineWidth = 1.2;
  t.beginPath();
  t.moveTo(x + w * 0.14, y + h * 0.33); t.lineTo(x + w * 0.14 + bodyW, y + h * 0.33);
  t.moveTo(x + w * 0.14, y + h * 0.66); t.lineTo(x + w * 0.14 + bodyW, y + h * 0.66);
  t.stroke();
  // sharpened tip
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#e8cf9e';
  t.beginPath();
  t.moveTo(x + w * 0.14, y);
  t.lineTo(x, y + h / 2);
  t.lineTo(x + w * 0.14, y + h);
  t.closePath();
  t.fill(); t.stroke();
  t.fillStyle = '#3c3c3a';
  t.beginPath();
  t.moveTo(x + w * 0.045, y + h * 0.32);
  t.lineTo(x, y + h / 2);
  t.lineTo(x + w * 0.045, y + h * 0.68);
  t.closePath();
  t.fill();
  // ferrule + eraser
  t.fillStyle = '#b9c0cc';
  t.beginPath(); t.rect(x + w * 0.88, y, w * 0.05, h); t.fill(); t.stroke();
  t.fillStyle = '#e8a8a0';
  t.beginPath(); t.roundRect(x + w * 0.93, y, w * 0.07, h, [0, 8, 8, 0]); t.fill(); t.stroke();
  // brand text
  t.font = `900 12px 'Archivo', sans-serif`;
  t.fillStyle = 'rgba(90,70,30,0.7)';
  t.textAlign = 'center';
  t.fillText('DOODLE No.2', x + w / 2, y + h / 2 + 4);
}

function drawRuler(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.fillStyle = '#f7f3e3';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath(); t.roundRect(x, y, w, h, 4); t.fill(); t.stroke();
  // ticks + numbers along the top edge
  t.lineWidth = 1.2;
  t.font = `10px 'Patrick Hand', cursive`;
  t.fillStyle = INK;
  t.textAlign = 'center';
  let n = 0;
  for (let tx = x + 10; tx < x + w - 6; tx += 20) {
    const major = n % 5 === 0;
    t.beginPath();
    t.moveTo(tx, y);
    t.lineTo(tx, y + (major ? h * 0.42 : h * 0.25));
    t.stroke();
    if (major) t.fillText(String(n / 5), tx, y + h - 8);
    n++;
  }
}

function drawSharpener(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.fillStyle = '#d8dee8';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath(); t.roundRect(x, y, w, h, 8); t.fill(); t.stroke();
  // pencil hole on the side
  t.fillStyle = '#3c3c3a';
  t.beginPath();
  t.ellipse(x + 8, y + h / 2, 6, 12, 0, 0, Math.PI * 2);
  t.fill(); t.stroke();
  // blade screw
  t.fillStyle = '#f6f5f0';
  t.beginPath(); t.arc(x + w * 0.62, y + h * 0.32, 5, 0, Math.PI * 2); t.fill(); t.stroke();
  t.beginPath();
  t.moveTo(x + w * 0.62 - 3, y + h * 0.32); t.lineTo(x + w * 0.62 + 3, y + h * 0.32);
  t.stroke();
  // blade slot
  t.strokeStyle = INK;
  t.lineWidth = 1.3;
  t.beginPath();
  t.moveTo(x + w * 0.35, y + h * 0.62); t.lineTo(x + w * 0.85, y + h * 0.55);
  t.stroke();
}

function drawNotepad(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  // stack: two offset sheets under the top one
  t.strokeStyle = INK;
  t.lineWidth = 1.6;
  for (const [ox, oy, tint] of [[8, 10, '#e8d992'], [4, 5, '#efe2a4']]) {
    t.fillStyle = tint;
    t.beginPath(); t.rect(x + ox, y + oy, w - 12, h - 12); t.fill(); t.stroke();
  }
  t.fillStyle = '#f6ecb4';
  t.lineWidth = 2;
  wobblyRect(t, rng, x, y, w - 12, h - 12, 1.4);
  t.fill(); t.stroke();
  // curled corner
  t.fillStyle = '#e8d992';
  t.beginPath();
  t.moveTo(x + w - 12, y + h - 34);
  t.lineTo(x + w - 12, y + h - 12);
  t.lineTo(x + w - 34, y + h - 12);
  t.closePath();
  t.fill(); t.stroke();
  // doodle on the top sheet
  t.strokeStyle = INK;
  t.lineWidth = 1.5;
  wobblyCircle(t, rng, x + (w - 12) / 2, y + (h - 12) / 2 - 4, 16, 0.08);
  t.stroke();
  t.beginPath(); t.arc(x + (w - 12) / 2 - 6, y + (h - 12) / 2 - 8, 1.6, 0, Math.PI * 2);
  t.fillStyle = INK; t.fill();
  t.beginPath(); t.arc(x + (w - 12) / 2 + 6, y + (h - 12) / 2 - 8, 1.6, 0, Math.PI * 2); t.fill();
  t.beginPath(); t.arc(x + (w - 12) / 2, y + (h - 12) / 2 - 2, 8, 0.4, Math.PI - 0.4); t.stroke();
  t.font = `13px 'Patrick Hand', cursive`;
  t.textAlign = 'center';
  t.fillText('brb!', x + (w - 12) / 2, y + h - 24);
}

/* ---------------- moon obstacles ---------------- */

function drawLander(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // legs with foot pads
  for (const [lx, dir] of [[x + w * 0.18, -1], [x + w * 0.82, 1]]) {
    t.beginPath();
    t.moveTo(cx + (lx - cx) * 0.5, y + h * 0.55);
    t.lineTo(lx, y + h * 0.92);
    t.stroke();
    t.fillStyle = '#d5dade';
    t.beginPath();
    t.ellipse(lx + dir * 4, y + h * 0.94, 12, 4, 0, 0, Math.PI * 2);
    t.fill(); t.stroke();
  }
  // descent stage: gold foil box with hatching
  t.fillStyle = '#f0d489';
  t.beginPath(); t.roundRect(x + w * 0.2, y + h * 0.45, w * 0.6, h * 0.32, 6); t.fill(); t.stroke();
  hatchRect(t, rng, x + w * 0.2, y + h * 0.45, w * 0.6, h * 0.32, 7);
  // ascent stage: grey pod with window
  t.fillStyle = '#e3e7ec';
  t.beginPath();
  t.moveTo(x + w * 0.3, y + h * 0.45);
  t.lineTo(x + w * 0.34, y + h * 0.16);
  t.lineTo(x + w * 0.66, y + h * 0.16);
  t.lineTo(x + w * 0.7, y + h * 0.45);
  t.closePath();
  t.fill(); t.stroke();
  t.fillStyle = '#3c3c3a';
  t.beginPath(); t.arc(cx, y + h * 0.3, 7, 0, Math.PI * 2); t.fill(); t.stroke();
  // antenna
  t.beginPath();
  t.moveTo(cx + w * 0.12, y + h * 0.16);
  t.lineTo(cx + w * 0.18, y + h * 0.02);
  t.stroke();
  t.beginPath();
  t.arc(cx + w * 0.2, y + h * 0.02, 6, Math.PI * 0.7, Math.PI * 1.9);
  t.stroke();
}

function drawUfo(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2, cy = y + h * 0.55;
  // crash gouge behind it
  t.strokeStyle = 'rgba(90,98,110,0.4)';
  t.lineWidth = 3;
  t.beginPath();
  t.moveTo(x - 40, cy + h * 0.3);
  t.quadraticCurveTo(x + w * 0.2, cy + h * 0.34, x + w * 0.42, cy + h * 0.22);
  t.stroke();
  // saucer rim, tilted into the ground
  t.save();
  t.translate(cx, cy);
  t.rotate(-0.16);
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#d8dee8';
  t.beginPath(); t.ellipse(0, 0, w * 0.46, h * 0.28, 0, 0, Math.PI * 2); t.fill(); t.stroke();
  // rim lights
  t.fillStyle = '#f0d489';
  for (let i = -2; i <= 2; i++) {
    t.beginPath();
    t.arc(i * w * 0.16, h * 0.1, 4.5, 0, Math.PI * 2);
    t.fill(); t.stroke();
  }
  // glass dome, cracked
  t.fillStyle = 'rgba(200,225,235,0.75)';
  t.beginPath(); t.ellipse(0, -h * 0.2, w * 0.2, h * 0.2, 0, Math.PI, 0); t.fill(); t.stroke();
  t.lineWidth = 1.2;
  t.beginPath();
  t.moveTo(-w * 0.06, -h * 0.3);
  t.lineTo(-w * 0.01, -h * 0.22);
  t.lineTo(-w * 0.07, -h * 0.14);
  t.stroke();
  t.restore();
  // smoke curl from the rim
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 1.6;
  t.beginPath();
  t.moveTo(x + w * 0.82, y + h * 0.2);
  t.quadraticCurveTo(x + w * 0.92, y - 6, x + w * 0.82, y - 22);
  t.quadraticCurveTo(x + w * 0.72, y - 36, x + w * 0.84, y - 48);
  t.stroke();
}

function drawDome(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2, base = y + h * 0.86;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#e9edf1';
  // dome shell
  t.beginPath();
  t.moveTo(x + 4, base);
  t.quadraticCurveTo(x + 4, y + 8, cx, y + 8);
  t.quadraticCurveTo(x + w - 4, y + 8, x + w - 4, base);
  t.closePath();
  t.fill(); t.stroke();
  // panel grid following the curve
  t.lineWidth = 1.1;
  t.strokeStyle = INK_LIGHT;
  for (const k of [0.32, 0.6]) {
    t.beginPath();
    t.moveTo(x + 4 + (cx - x) * k * 0.5, base);
    t.quadraticCurveTo(x + 4 + (cx - x) * k, y + 8 + (base - y) * k * 0.35, cx, y + 8 + (base - y) * k * 0.3);
    t.stroke();
    t.beginPath();
    t.moveTo(x + w - 4 - (cx - x) * k * 0.5, base);
    t.quadraticCurveTo(x + w - 4 - (cx - x) * k, y + 8 + (base - y) * k * 0.35, cx, y + 8 + (base - y) * k * 0.3);
    t.stroke();
  }
  for (const ky of [0.4, 0.62]) {
    t.beginPath();
    t.moveTo(x + 10, y + (base - y) * ky + 8);
    t.quadraticCurveTo(cx, y + (base - y) * (ky - 0.16), x + w - 10, y + (base - y) * ky + 8);
    t.stroke();
  }
  // porthole + airlock door
  t.strokeStyle = INK;
  t.lineWidth = 1.8;
  t.fillStyle = 'rgba(200,225,235,0.85)';
  t.beginPath(); t.arc(cx - w * 0.18, y + h * 0.5, 13, 0, Math.PI * 2); t.fill(); t.stroke();
  t.fillStyle = '#c9cdd6';
  t.beginPath(); t.roundRect(cx + w * 0.06, y + h * 0.52, 30, h * 0.34, [8, 8, 0, 0]); t.fill(); t.stroke();
  t.beginPath(); t.arc(cx + w * 0.06 + 23, y + h * 0.7, 2, 0, Math.PI * 2); t.fillStyle = INK; t.fill();
  // antenna mast
  t.strokeStyle = INK;
  t.beginPath();
  t.moveTo(cx, y + 8); t.lineTo(cx, y - 16);
  t.moveTo(cx - 7, y - 8); t.lineTo(cx + 7, y - 8);
  t.stroke();
  t.beginPath(); t.arc(cx, y - 18, 2.5, 0, Math.PI * 2); t.fillStyle = '#e6392a'; t.fill(); t.stroke();
}

function drawRocketpad(t, rng, b) {
  const { x, y, w, h } = b;
  const cx = x + w / 2;
  // pad: hatched circle with warning ring
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#dfe3e8';
  t.beginPath();
  t.ellipse(cx, y + h * 0.82, w * 0.46, h * 0.16, 0, 0, Math.PI * 2);
  t.fill(); t.stroke();
  t.setLineDash([8, 6]);
  t.lineWidth = 1.4;
  t.beginPath();
  t.ellipse(cx, y + h * 0.82, w * 0.34, h * 0.11, 0, 0, Math.PI * 2);
  t.stroke();
  t.setLineDash([]);
  // gantry tower on the left
  t.strokeStyle = INK;
  t.lineWidth = 1.8;
  t.beginPath();
  t.moveTo(x + w * 0.12, y + h * 0.8); t.lineTo(x + w * 0.12, y + h * 0.1);
  t.moveTo(x + w * 0.22, y + h * 0.8); t.lineTo(x + w * 0.22, y + h * 0.14);
  t.stroke();
  t.lineWidth = 1.1;
  t.beginPath();
  for (let gy = y + h * 0.16; gy < y + h * 0.78; gy += h * 0.1) {
    t.moveTo(x + w * 0.12, gy); t.lineTo(x + w * 0.22, gy + h * 0.05);
    t.moveTo(x + w * 0.22, gy); t.lineTo(x + w * 0.12, gy + h * 0.05);
  }
  t.stroke();
  t.beginPath();
  t.moveTo(x + w * 0.22, y + h * 0.24); t.lineTo(x + w * 0.4, y + h * 0.26);
  t.stroke();
  // the rocket, standing
  const rw = w * 0.24, rx = cx + w * 0.08, top = y + h * 0.06;
  t.fillStyle = '#f0f0ec';
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(rx, top + h * 0.14);
  t.quadraticCurveTo(rx + rw / 2, top - h * 0.08, rx + rw, top + h * 0.14);
  t.lineTo(rx + rw, y + h * 0.68);
  t.lineTo(rx, y + h * 0.68);
  t.closePath();
  t.fill(); t.stroke();
  // nose stripe + window
  t.fillStyle = '#e6392a';
  t.beginPath();
  t.moveTo(rx, top + h * 0.14);
  t.quadraticCurveTo(rx + rw / 2, top - h * 0.08, rx + rw, top + h * 0.14);
  t.lineTo(rx + rw, top + h * 0.2);
  t.lineTo(rx, top + h * 0.2);
  t.closePath();
  t.fill(); t.stroke();
  t.fillStyle = 'rgba(200,225,235,0.9)';
  t.beginPath(); t.arc(rx + rw / 2, top + h * 0.32, 8, 0, Math.PI * 2); t.fill(); t.stroke();
  // fins
  t.fillStyle = '#e6392a';
  t.beginPath();
  t.moveTo(rx, y + h * 0.52); t.lineTo(rx - 14, y + h * 0.72); t.lineTo(rx, y + h * 0.68);
  t.closePath(); t.fill(); t.stroke();
  t.beginPath();
  t.moveTo(rx + rw, y + h * 0.52); t.lineTo(rx + rw + 14, y + h * 0.72); t.lineTo(rx + rw, y + h * 0.68);
  t.closePath(); t.fill(); t.stroke();
  // engine bell
  t.fillStyle = '#8b93a5';
  t.beginPath();
  t.moveTo(rx + rw * 0.28, y + h * 0.68);
  t.lineTo(rx + rw * 0.16, y + h * 0.76);
  t.lineTo(rx + rw * 0.84, y + h * 0.76);
  t.lineTo(rx + rw * 0.72, y + h * 0.68);
  t.closePath();
  t.fill(); t.stroke();
}
