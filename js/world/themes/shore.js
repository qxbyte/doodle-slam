'use strict';

/* ============================================================
   Shore theme: sand ground, surf foam along the waterline,
   shells, starfish, gulls, the tidepool plaza and the seaside
   obstacles (lighthouse, beach shack, overturned boat,
   sandcastle, parasol, crate stack).
   ============================================================ */

registerGround('sand', (g, rng, map) => {
  // warm sand with stippling and wind-combed ripples
  g.fillStyle = '#f2e7cf';
  g.fillRect(0, 0, WORLD.w, WORLD.h);
  for (let i = 0; i < 18; i++) {
    g.fillStyle = `rgba(210,180,130,${rand(rng, 0.05, 0.1)})`;
    g.beginPath();
    g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
              rand(rng, 90, 280), rand(rng, 50, 140), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(140,110,60,0.14)';
  for (let i = 0; i < 2400; i++) {
    g.fillRect(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 1, 2.2), 1);
  }
  // ripples: gentle nested arcs
  g.strokeStyle = 'rgba(150,120,70,0.22)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 60; i++) {
    const x = rand(rng, 40, WORLD.w - 40), y = rand(rng, 40, WORLD.h - 40);
    const r = rand(rng, 14, 30), a = rand(rng, 0, Math.PI);
    g.beginPath();
    g.arc(x, y, r, a, a + rand(rng, 0.8, 1.5));
    g.stroke();
  }
});

/* surf foam: dashed white scallops along the top edge of the sea */
function drawFoam(g, rng, map) {
  for (const w of map.water) {
    g.strokeStyle = 'rgba(255,255,255,0.85)';
    g.lineWidth = 3;
    g.beginPath();
    let x = w.x + 6;
    while (x < w.x + w.w - 10) {
      const seg = rand(rng, 22, 40);
      g.moveTo(x, w.y + 6 + rand(rng, -2, 2));
      g.quadraticCurveTo(x + seg / 2, w.y + 12 + rand(rng, -2, 2), x + seg, w.y + 6 + rand(rng, -2, 2));
      x += seg + rand(rng, 8, 18);
    }
    g.stroke();
    // bubbles just below the foam line
    g.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < w.w / 90; i++) {
      g.beginPath();
      g.arc(rand(rng, w.x + 10, w.x + w.w - 10), w.y + rand(rng, 12, 26), rand(rng, 1.5, 3.2), 0, Math.PI * 2);
      g.fill();
    }
  }
}

function drawShells(g, rng, map) {
  for (const [sx, sy] of map.shells) {
    g.save();
    g.translate(sx, sy);
    g.rotate(rand(rng, -0.6, 0.6));
    g.strokeStyle = INK;
    g.lineWidth = 1.3;
    g.fillStyle = '#faf3e2';
    // fan shell
    g.beginPath();
    g.moveTo(0, 6);
    g.quadraticCurveTo(-11, 2, -9, -6);
    g.quadraticCurveTo(0, -13, 9, -6);
    g.quadraticCurveTo(11, 2, 0, 6);
    g.closePath();
    g.fill(); g.stroke();
    g.lineWidth = 0.9;
    g.beginPath();
    for (const a of [-0.6, -0.2, 0.2, 0.6]) {
      g.moveTo(0, 5);
      g.lineTo(Math.sin(a) * 10, -6 + Math.abs(a) * 3);
    }
    g.stroke();
    g.restore();
  }
}

function drawStarfish(g, rng, map) {
  for (const [sx, sy] of map.starfish) {
    g.save();
    g.translate(sx, sy);
    g.rotate(rand(rng, 0, Math.PI));
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    g.fillStyle = '#f0b48c';
    g.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const a2 = a1 + Math.PI / 5;
      g.lineTo(Math.cos(a1) * 13, Math.sin(a1) * 13);
      g.quadraticCurveTo(Math.cos(a1 + Math.PI / 10) * 4, Math.sin(a1 + Math.PI / 10) * 4,
                         Math.cos(a2) * 13 * 0.42, Math.sin(a2) * 13 * 0.42);
    }
    g.closePath();
    g.fill(); g.stroke();
    g.fillStyle = INK;
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.arc(rand(rng, -4, 4), rand(rng, -4, 4), 0.8, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
  }
}

/* gulls: little M-birds with a soft shadow on the sand */
function drawGulls(g, rng, map) {
  for (const [gx, gy] of map.gulls) {
    g.fillStyle = 'rgba(120,110,80,0.18)';
    g.beginPath();
    g.ellipse(gx + 14, gy + 26, 10, 3.5, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    g.beginPath();
    g.moveTo(gx - 9, gy);
    g.quadraticCurveTo(gx - 4, gy - 7, gx, gy);
    g.quadraticCurveTo(gx + 4, gy - 7, gx + 9, gy);
    g.stroke();
  }
}

registerFeature(31, drawFoam);
registerFeature(44, drawShells);
registerFeature(45, drawStarfish);
registerFeature(64, drawGulls);

/* tidepool: a shallow rock pool, the red button sits beside it */
registerPlaza('tidepool', (g, rng, map, p) => {
  g.fillStyle = 'rgba(110,160,180,0.3)';
  wobblyCircle(g, rng, p.x, p.y, 46, 0.14);
  g.fill();
  g.strokeStyle = INK;
  g.lineWidth = 1.7;
  g.stroke();
  // wet rim
  g.strokeStyle = 'rgba(140,110,60,0.4)';
  g.lineWidth = 4;
  wobblyCircle(g, rng, p.x, p.y, 52, 0.12);
  g.stroke();
  // a starfish and bubbles inside
  g.fillStyle = '#f0b48c';
  g.strokeStyle = INK;
  g.lineWidth = 1.1;
  g.save();
  g.translate(p.x - 12, p.y + 8);
  g.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    g.lineTo(Math.cos(a1) * 9, Math.sin(a1) * 9);
    g.lineTo(Math.cos(a2) * 3.6, Math.sin(a2) * 3.6);
  }
  g.closePath();
  g.fill(); g.stroke();
  g.restore();
  g.fillStyle = 'rgba(255,255,255,0.8)';
  for (const [bx, by, br] of [[14, -10, 2.4], [20, -2, 1.6], [8, -18, 1.8]]) {
    g.beginPath(); g.arc(p.x + bx, p.y + by, br, 0, Math.PI * 2); g.fill();
  }
});

/* ---------------- shore obstacles ---------------- */

function drawLighthouse(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2;
  // tapered striped tower
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#f6f5f0';
  t.beginPath();
  t.moveTo(cx - w * 0.34, y + h);
  t.lineTo(cx - w * 0.2, y + h * 0.24);
  t.lineTo(cx + w * 0.2, y + h * 0.24);
  t.lineTo(cx + w * 0.34, y + h);
  t.closePath();
  t.fill(); t.stroke();
  // red stripes following the taper
  t.fillStyle = '#e6392a';
  for (const k of [0.36, 0.62]) {
    const yTop = y + h * k, yBot = y + h * (k + 0.13);
    const wTop = w * (0.2 + 0.14 * (yTop - y - h * 0.24) / (h * 0.76));
    const wBot = w * (0.2 + 0.14 * (yBot - y - h * 0.24) / (h * 0.76));
    t.beginPath();
    t.moveTo(cx - wTop, yTop);
    t.lineTo(cx + wTop, yTop);
    t.lineTo(cx + wBot, yBot);
    t.lineTo(cx - wBot, yBot);
    t.closePath();
    t.fill(); t.stroke();
  }
  // gallery + lantern room
  t.fillStyle = '#3c3c3a';
  t.fillRect(cx - w * 0.26, y + h * 0.22, w * 0.52, 5);
  t.fillStyle = '#f6e6a8';
  t.beginPath(); t.roundRect(cx - w * 0.15, y + h * 0.06, w * 0.3, h * 0.16, 4); t.fill(); t.stroke();
  t.lineWidth = 1.2;
  t.beginPath();
  t.moveTo(cx, y + h * 0.06); t.lineTo(cx, y + h * 0.22);
  t.stroke();
  // dome cap
  t.fillStyle = '#e6392a';
  t.lineWidth = 2;
  t.beginPath();
  t.arc(cx, y + h * 0.06, w * 0.15, Math.PI, 0);
  t.closePath();
  t.fill(); t.stroke();
  // light beams
  t.strokeStyle = 'rgba(240,180,28,0.65)';
  t.lineWidth = 3;
  t.beginPath();
  t.moveTo(cx - w * 0.18, y + h * 0.12); t.lineTo(cx - w * 0.55, y + h * 0.04);
  t.moveTo(cx + w * 0.18, y + h * 0.12); t.lineTo(cx + w * 0.55, y + h * 0.04);
  t.stroke();
  // door
  t.strokeStyle = INK;
  t.lineWidth = 1.6;
  t.fillStyle = '#dddbd3';
  t.beginPath(); t.roundRect(cx - 11, y + h - 30, 22, 28, [8, 8, 0, 0]); t.fill(); t.stroke();
}

function drawShack(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const roofH = h * 0.3;
  // plank walls
  t.fillStyle = '#efe3c8';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillRect(x, y + roofH, w, h - roofH);
  wobblyRect(t, rng, x, y + roofH, w, h - roofH, 1.5);
  t.stroke();
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 1;
  t.beginPath();
  for (let px = x + 18; px < x + w - 6; px += 18) {
    t.moveTo(px, y + roofH + 3);
    t.lineTo(px + rand(rng, -2, 2), y + h - 3);
  }
  t.stroke();
  // slanted roof with fringe
  t.fillStyle = '#d9c9a0';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(x - 10, y + roofH);
  t.lineTo(x + w * 0.2, y);
  t.lineTo(x + w + 10, y + roofH * 0.5);
  t.lineTo(x + w + 10, y + roofH);
  t.closePath();
  t.fill(); t.stroke();
  hatchRect(t, rng, x - 6, y + 4, w + 12, roofH - 8, 6);
  // serving window with a striped awning
  t.fillStyle = '#3c3c3a';
  t.fillRect(x + w * 0.16, y + roofH + 14, w * 0.36, h * 0.3);
  t.strokeStyle = INK;
  t.lineWidth = 1.5;
  t.strokeRect(x + w * 0.16, y + roofH + 14, w * 0.36, h * 0.3);
  t.fillStyle = '#e6392a';
  for (let i = 0; i < 4; i++) {
    if (i % 2) continue;
    t.fillRect(x + w * 0.16 + i * w * 0.09, y + roofH + 6, w * 0.09, 10);
  }
  t.strokeRect(x + w * 0.16, y + roofH + 6, w * 0.36, 10);
  // ICE CREAM sign + leaning surfboard
  t.font = `15px 'Patrick Hand', cursive`;
  t.fillStyle = INK;
  t.textAlign = 'center';
  t.fillText('ICE CREAM', x + w * 0.34, y + h - 8);
  t.save();
  t.translate(x + w * 0.8, y + h * 0.62);
  t.rotate(0.16);
  t.fillStyle = '#7ec8d8';
  t.strokeStyle = INK;
  t.lineWidth = 1.6;
  t.beginPath();
  t.ellipse(0, 0, 11, h * 0.32, 0, 0, Math.PI * 2);
  t.fill(); t.stroke();
  t.beginPath();
  t.moveTo(0, -h * 0.26); t.lineTo(0, h * 0.26);
  t.lineWidth = 1;
  t.stroke();
  t.restore();
}

function drawBoat(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  // overturned hull with a keel line and peeling planks
  t.fillStyle = '#7ea8c0';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(x + 4, y + h * 0.85);
  t.quadraticCurveTo(x + w * 0.1, y + h * 0.15, x + w * 0.5, y + h * 0.08);
  t.quadraticCurveTo(x + w * 0.9, y + h * 0.15, x + w - 4, y + h * 0.85);
  t.closePath();
  t.fill(); t.stroke();
  // keel
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(x + w * 0.08, y + h * 0.5);
  t.quadraticCurveTo(x + w * 0.5, y + h * 0.3, x + w * 0.92, y + h * 0.5);
  t.stroke();
  // planks
  t.strokeStyle = 'rgba(40,60,80,0.4)';
  t.lineWidth = 1.1;
  for (const k of [0.62, 0.74]) {
    t.beginPath();
    t.moveTo(x + w * 0.05, y + h * k);
    t.quadraticCurveTo(x + w * 0.5, y + h * (k - 0.16), x + w * 0.95, y + h * k);
    t.stroke();
  }
  // patched hole
  t.fillStyle = '#f6f5f0';
  wobblyRect(t, rng, x + w * 0.6, y + h * 0.36, 26, 18, 1);
  t.fill();
  t.strokeStyle = INK;
  t.lineWidth = 1.2;
  t.stroke();
  t.beginPath();
  t.moveTo(x + w * 0.6, y + h * 0.36 + 9); t.lineTo(x + w * 0.6 + 26, y + h * 0.36 + 9);
  t.stroke();
}

function drawSandcastle(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 1.8;
  t.fillStyle = '#eddcae';
  // two crenellated towers + wall between
  const tower = (tx, tw, th) => {
    t.fillRect(tx, y + h - th, tw, th);
    wobblyRect(t, rng, tx, y + h - th, tw, th, 1.2);
    t.stroke();
    // crenellations
    for (let i = 0; i < 3; i++) {
      t.fillRect(tx + i * tw / 3 + 2, y + h - th - 7, tw / 3 - 5, 8);
      t.strokeRect(tx + i * tw / 3 + 2, y + h - th - 7, tw / 3 - 5, 8);
    }
    // bucket ridges
    t.strokeStyle = 'rgba(140,110,60,0.5)';
    t.lineWidth = 1;
    t.beginPath();
    for (let ry = y + h - th + 8; ry < y + h - 4; ry += 9) {
      t.moveTo(tx + 2, ry); t.lineTo(tx + tw - 2, ry);
    }
    t.stroke();
    t.strokeStyle = INK;
    t.lineWidth = 1.8;
  };
  tower(x + 4, w * 0.3, h * 0.72);
  tower(x + w - w * 0.3 - 4, w * 0.3, h * 0.6);
  // wall + gate
  t.fillRect(x + w * 0.3, y + h - h * 0.4, w * 0.4, h * 0.4);
  wobblyRect(t, rng, x + w * 0.3, y + h - h * 0.4, w * 0.4, h * 0.4, 1.2);
  t.stroke();
  t.fillStyle = '#8d7a52';
  t.beginPath();
  t.arc(x + w / 2, y + h, w * 0.09, Math.PI, 0);
  t.closePath();
  t.fill(); t.stroke();
  // paper flag on a toothpick
  t.beginPath();
  t.moveTo(x + w * 0.19, y + h - h * 0.72 - 7);
  t.lineTo(x + w * 0.19, y + h - h * 0.72 - 26);
  t.stroke();
  t.fillStyle = '#2f66e0';
  t.beginPath();
  t.moveTo(x + w * 0.19, y + h - h * 0.72 - 26);
  t.lineTo(x + w * 0.19 + 14, y + h - h * 0.72 - 21);
  t.lineTo(x + w * 0.19, y + h - h * 0.72 - 16);
  t.closePath();
  t.fill(); t.stroke();
}

function drawUmbrella(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w * 0.5, cy = y + h * 0.42, r = Math.min(w, h) * 0.52;
  // beach towel underneath
  t.save();
  t.translate(x + w * 0.6, y + h * 0.8);
  t.rotate(0.12);
  t.fillStyle = '#7ec8d8';
  t.strokeStyle = INK;
  t.lineWidth = 1.5;
  t.fillRect(-w * 0.3, -h * 0.12, w * 0.6, h * 0.26);
  t.strokeRect(-w * 0.3, -h * 0.12, w * 0.6, h * 0.26);
  t.strokeStyle = 'rgba(255,255,255,0.8)';
  t.lineWidth = 2.5;
  t.beginPath();
  for (const k of [-0.04, 0.04]) {
    t.moveTo(-w * 0.28, k * h); t.lineTo(w * 0.28, k * h);
  }
  t.stroke();
  t.restore();
  // parasol, top view: alternating wedges
  t.strokeStyle = INK;
  t.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a1 = (i / 8) * Math.PI * 2, a2 = ((i + 1) / 8) * Math.PI * 2;
    t.fillStyle = i % 2 ? '#e6392a' : '#f6f5f0';
    t.beginPath();
    t.moveTo(cx, cy);
    t.arc(cx, cy, r, a1, a2);
    t.closePath();
    t.fill();
  }
  wobblyCircle(t, rng, cx, cy, r, 0.03);
  t.stroke();
  t.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    t.moveTo(cx, cy);
    t.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  t.lineWidth = 1.1;
  t.stroke();
  t.fillStyle = INK;
  t.beginPath(); t.arc(cx, cy, 3.4, 0, Math.PI * 2); t.fill();
}

function drawCrates(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 1.8;
  const crate = (cx2, cy2, s) => {
    t.fillStyle = '#e8d5a4';
    t.fillRect(cx2, cy2, s, s);
    wobblyRect(t, rng, cx2, cy2, s, s, 1.2);
    t.stroke();
    t.lineWidth = 1;
    t.beginPath();
    t.moveTo(cx2 + 3, cy2 + 3); t.lineTo(cx2 + s - 3, cy2 + s - 3);
    t.moveTo(cx2 + s - 3, cy2 + 3); t.lineTo(cx2 + 3, cy2 + s - 3);
    t.stroke();
    wobblyRect(t, rng, cx2 + 4, cy2 + 4, s - 8, s - 8, 0.8);
    t.stroke();
    t.lineWidth = 1.8;
  };
  const s = Math.min(w, h) * 0.58;
  crate(x + 4, y + h - s, s);
  crate(x + w - s - 4, y + h - s, s);
  crate(x + (w - s) / 2, y + h - s * 1.9, s);
  // FISH stencil
  t.font = `11px 'Patrick Hand', cursive`;
  t.fillStyle = 'rgba(40,40,40,0.7)';
  t.textAlign = 'center';
  t.fillText('FISH', x + (w) / 2, y + h - s * 1.9 + s / 2 + 4);
}

registerObstacles({
  lighthouse: drawLighthouse, shack: drawShack, boat: drawBoat,
  sandcastle: drawSandcastle, umbrella: drawUmbrella, crates: drawCrates,
});
