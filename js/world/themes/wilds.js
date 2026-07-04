'use strict';

/* ============================================================
   Wilds theme: fallen logs, campfire & standing-stones plazas,
   organic obstacles (cabin, watchtower, tent, boulder, ancient
   tree, giant mushrooms).
   ============================================================ */

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

registerFeature(48, drawLogs);

registerPlaza('campfire', (g, rng, map, p) => {

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
});

registerPlaza('stones', (g, rng, map, p) => {

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
});

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

registerObstacles({
  cabin: drawCabin, tower: drawTower, tent: drawTent,
  rock: drawRock, bigtree: drawBigTree, mushroom: drawMushrooms,
});
