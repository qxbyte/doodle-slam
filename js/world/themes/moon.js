'use strict';

/* ============================================================
   Moon theme: regolith ground, craters, planted flags,
   footprint trails, big-crater plaza, space obstacles
   (lander, crashed saucer, base dome, rocket pad).
   ============================================================ */

registerGround('moon', (g, rng, map) => {

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
});

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

registerFeature(14, drawCraters);
registerFeature(16, drawPrints);
registerFeature(52, drawFlags);

registerPlaza('crater', (g, rng, map, p) => {

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
});

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

registerObstacles({
  lander: drawLander, ufo: drawUfo, dome: drawDome, rocketpad: drawRocketpad,
});
