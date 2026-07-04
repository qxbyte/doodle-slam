'use strict';

/* ============================================================
   Common theme pieces shared by every map: paper ground,
   street/dirt roads, water & bridges, trees & pines, grass,
   flowers, margin doodles, fountain & pond plaza styles.
   ============================================================ */

registerGround('paper', (g, rng, map) => {

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
});

function drawStreetRoads(g, rng, map) {
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

registerRoadStyle('asphalt', drawStreetRoads);
registerRoadStyle('dirt', drawStreetRoads);

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

function drawTrees(g, rng, map) {
  for (const [tx, ty] of map.trees) {
    g.lineWidth = 1.5;
    g.strokeStyle = INK;
    scribbleBlob(g, rng, tx, ty, rand(rng, 18, 30));
    g.stroke();
    g.beginPath(); g.moveTo(tx, ty + 18); g.lineTo(tx + 3, ty + 30); g.stroke();
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

registerFeature(30, drawWater);
registerFeature(32, drawBridges);
registerFeature(40, drawGrass);
registerFeature(42, drawFlowers);
registerFeature(56, drawTrees);
registerFeature(58, drawPines);
registerFeature(66, drawDoodles);

registerPlaza('fountain', (g, rng, map, p) => {

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
});

registerPlaza('pond', (g, rng, map, p) => {

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
});
