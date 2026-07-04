'use strict';

/* ============================================================
   Peaks theme: snow ground, slippery ice lakes (the mechanic
   lives in entities/collision — here we only paint them),
   snowdrifts, snowy pines, ski tracks, cable-car lines, and
   the alpine obstacles (lodge, lift pylon, snowman).
   ============================================================ */

registerGround('snow', (g, rng, map) => {
  // bluish-white snowpack with soft mottling and sparkle glints
  g.fillStyle = '#f4f7f9';
  g.fillRect(0, 0, WORLD.w, WORLD.h);
  for (let i = 0; i < 22; i++) {
    g.fillStyle = `rgba(170,195,220,${rand(rng, 0.05, 0.1)})`;
    g.beginPath();
    g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
              rand(rng, 100, 300), rand(rng, 60, 160), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(140,165,195,0.12)';
  for (let i = 0; i < 1800; i++) {
    g.fillRect(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 1, 2.2), 1);
  }
  // sparkles
  g.strokeStyle = 'rgba(255,255,255,0.9)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 40; i++) {
    const x = rand(rng, 30, WORLD.w - 30), y = rand(rng, 30, WORLD.h - 30);
    const s = rand(rng, 2.5, 5);
    g.beginPath();
    g.moveTo(x - s, y); g.lineTo(x + s, y);
    g.moveTo(x, y - s); g.lineTo(x, y + s);
    g.stroke();
  }
});

/* frozen lakes: slippery to walk on, still paintable */
function drawIce(g, rng, map) {
  for (const r of map.ice) {
    g.fillStyle = 'rgba(165,210,235,0.4)';
    g.beginPath();
    g.roundRect(r.x, r.y, r.w, r.h, 40);
    g.fill();
    g.strokeStyle = INK;
    g.lineWidth = 1.8;
    g.stroke();
    // inner sheen band
    g.strokeStyle = 'rgba(255,255,255,0.7)';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(r.x + r.w * 0.18, r.y + r.h * 0.72);
    g.quadraticCurveTo(r.x + r.w * 0.4, r.y + r.h * 0.5, r.x + r.w * 0.32, r.y + r.h * 0.24);
    g.stroke();
    // cracks
    g.strokeStyle = 'rgba(90,130,160,0.55)';
    g.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      let cx = rand(rng, r.x + r.w * 0.2, r.x + r.w * 0.8);
      let cy = rand(rng, r.y + r.h * 0.2, r.y + r.h * 0.8);
      g.beginPath();
      g.moveTo(cx, cy);
      for (let k = 0; k < 4; k++) {
        cx += rand(rng, -50, 50);
        cy += rand(rng, -34, 34);
        g.lineTo(clamp(cx, r.x + 8, r.x + r.w - 8), clamp(cy, r.y + 8, r.y + r.h - 8));
      }
      g.stroke();
    }
    // skate scratches
    g.strokeStyle = 'rgba(120,150,175,0.4)';
    g.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const sx = rand(rng, r.x + 20, r.x + r.w - 60);
      const sy = rand(rng, r.y + 20, r.y + r.h - 30);
      g.beginPath();
      g.moveTo(sx, sy);
      g.quadraticCurveTo(sx + 26, sy + rand(rng, -14, 14), sx + 50, sy + rand(rng, -8, 8));
      g.stroke();
    }
  }
}

function drawDrifts(g, rng, map) {
  for (const [dx, dy] of map.drifts) {
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.strokeStyle = 'rgba(150,175,205,0.6)';
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(dx - 34, dy + 8);
    g.quadraticCurveTo(dx - 14, dy - 16, dx + 6, dy - 4);
    g.quadraticCurveTo(dx + 22, dy - 12, dx + 36, dy + 8);
    g.closePath();
    g.fill();
    g.stroke();
  }
}

/* parallel wavy ski tracks between two points */
function drawTracks(g, rng, map) {
  for (const [x1, y1, x2, y2] of map.tracks) {
    const a = Math.atan2(y2 - y1, x2 - x1);
    const nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2);
    g.strokeStyle = 'rgba(140,165,195,0.55)';
    g.lineWidth = 2;
    for (const off of [-5, 5]) {
      g.beginPath();
      g.moveTo(x1 + nx * off, y1 + ny * off);
      const steps = 6;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const wob = Math.sin(t * Math.PI * 2.5) * 14;
        g.lineTo(
          lerp(x1, x2, t) + nx * (off + wob),
          lerp(y1, y2, t) + ny * (off + wob)
        );
      }
      g.stroke();
    }
  }
}

/* cable-car lines strung between pylon tops, gondolas hanging */
function drawCables(g, rng, map) {
  for (const [x1, y1, x2, y2] of map.cables) {
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2 + 26;   // slight sag
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(x1, y1);
    g.quadraticCurveTo(midX, midY, x2, y2);
    g.stroke();
    // two gondolas per span
    for (const t of [0.32, 0.7]) {
      const gx = lerp(lerp(x1, midX, t), lerp(midX, x2, t), t);
      const gy = lerp(lerp(y1, midY, t), lerp(midY, y2, t), t);
      g.beginPath();
      g.moveTo(gx, gy); g.lineTo(gx, gy + 9);
      g.stroke();
      g.fillStyle = '#e6392a';
      g.beginPath();
      g.roundRect(gx - 10, gy + 9, 20, 15, 4);
      g.fill();
      g.lineWidth = 1.4;
      g.stroke();
      g.fillStyle = 'rgba(200,225,235,0.9)';
      g.fillRect(gx - 6, gy + 12, 12, 6);
      g.strokeRect(gx - 6, gy + 12, 12, 6);
      g.lineWidth = 1.6;
    }
  }
}

/* snowy pines: the wilds pine silhouette wearing snow caps */
function drawSnowPines(g, rng, map) {
  for (const [px, py] of map.snowpines) {
    const s = rand(rng, 0.85, 1.3);
    g.save();
    g.translate(px, py);
    g.scale(s, s);
    g.strokeStyle = INK;
    g.lineWidth = 1.5;
    for (let tier = 0; tier < 3; tier++) {
      const ty = -tier * 13, tw = 26 - tier * 6;
      g.fillStyle = PAPER;
      g.beginPath();
      g.moveTo(-tw, ty + 10);
      g.lineTo(0, ty - 12 + rand(rng, -2, 2));
      g.lineTo(tw, ty + 10);
      g.closePath();
      g.fill(); g.stroke();
      // snow cap on each tier
      g.fillStyle = '#ffffff';
      g.strokeStyle = 'rgba(150,175,205,0.7)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(-tw * 0.55, ty + 2);
      g.quadraticCurveTo(0, ty - 14, tw * 0.55, ty + 2);
      g.quadraticCurveTo(tw * 0.2, ty + 6, 0, ty + 2);
      g.quadraticCurveTo(-tw * 0.2, ty + 6, -tw * 0.55, ty + 2);
      g.closePath();
      g.fill(); g.stroke();
      g.strokeStyle = INK;
      g.lineWidth = 1.5;
    }
    g.beginPath(); g.moveTo(0, 10); g.lineTo(0, 18); g.stroke();
    g.restore();
  }
}

registerFeature(18, drawIce);
registerFeature(46, drawDrifts);
registerFeature(47, drawTracks);
registerFeature(53, drawCables);
registerFeature(59, drawSnowPines);

/* ---------------- alpine obstacles ---------------- */

function drawLodge(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const roofH = h * 0.38;
  // stone base
  t.fillStyle = '#e3e0d6';
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillRect(x, y + roofH, w, h - roofH);
  wobblyRect(t, rng, x, y + roofH, w, h - roofH, 1.6);
  t.stroke();
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    wobblyCircle(t, rng, rand(rng, x + 14, x + w - 14), rand(rng, y + h - 26, y + h - 8), rand(rng, 4, 8), 0.2);
    t.stroke();
  }
  // wide snowy roof
  t.fillStyle = PAPER;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(x - 14, y + roofH);
  t.lineTo(x + w / 2, y);
  t.lineTo(x + w + 14, y + roofH);
  t.closePath();
  t.fill(); t.stroke();
  t.fillStyle = '#ffffff';
  t.strokeStyle = 'rgba(150,175,205,0.7)';
  t.lineWidth = 1.4;
  t.beginPath();
  t.moveTo(x - 10, y + roofH * 0.55);
  t.lineTo(x + w / 2, y - 3);
  t.lineTo(x + w + 10, y + roofH * 0.55);
  t.quadraticCurveTo(x + w * 0.7, y + roofH * 0.42, x + w / 2, y + roofH * 0.5);
  t.quadraticCurveTo(x + w * 0.3, y + roofH * 0.42, x - 10, y + roofH * 0.55);
  t.closePath();
  t.fill(); t.stroke();
  // glowing windows + door
  t.strokeStyle = INK;
  t.lineWidth = 1.5;
  t.fillStyle = '#f6e6a8';
  for (const wx of [0.16, 0.68]) {
    t.fillRect(x + w * wx, y + roofH + 16, w * 0.16, h * 0.2);
    wobblyRect(t, rng, x + w * wx, y + roofH + 16, w * 0.16, h * 0.2, 1);
    t.stroke();
  }
  t.fillStyle = '#b98a5e';
  t.beginPath();
  t.roundRect(x + w / 2 - 14, y + h - 36, 28, 34, [6, 6, 0, 0]);
  t.fill(); t.stroke();
  // LODGE sign + icicles on the eave
  t.font = `18px 'Patrick Hand', cursive`;
  t.fillStyle = INK;
  t.textAlign = 'center';
  t.fillText('LODGE', x + w / 2, y + roofH + 13);
  t.fillStyle = '#ffffff';
  t.strokeStyle = 'rgba(150,175,205,0.8)';
  t.lineWidth = 1;
  for (let ix = x + 6; ix < x + w - 6; ix += rand(rng, 16, 26)) {
    const len = rand(rng, 5, 12);
    t.beginPath();
    t.moveTo(ix - 3, y + roofH);
    t.lineTo(ix, y + roofH + len);
    t.lineTo(ix + 3, y + roofH);
    t.closePath();
    t.fill(); t.stroke();
  }
}

function drawPylon(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // lattice tower
  t.beginPath();
  t.moveTo(x + w * 0.2, y + h); t.lineTo(cx - w * 0.1, y + 4);
  t.moveTo(x + w * 0.8, y + h); t.lineTo(cx + w * 0.1, y + 4);
  t.stroke();
  t.lineWidth = 1.1;
  t.beginPath();
  for (let k = 0.15; k < 0.95; k += 0.2) {
    const lw = w * (0.2 + 0.28 * k), rw = w * (0.8 - 0.28 * k);
    t.moveTo(x + lw, y + h * k); t.lineTo(x + w - lw, y + h * (k + 0.2));
    t.moveTo(x + w - lw, y + h * k); t.lineTo(x + lw, y + h * (k + 0.2));
  }
  t.stroke();
  // crossarm with sheave wheels
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(cx - w * 0.5, y + 6); t.lineTo(cx + w * 0.5, y + 6);
  t.stroke();
  t.fillStyle = '#8b93a5';
  for (const off of [-w * 0.4, w * 0.4]) {
    t.beginPath();
    t.arc(cx + off, y + 8, 4.5, 0, Math.PI * 2);
    t.fill(); t.stroke();
  }
  // concrete feet
  t.fillStyle = '#d5dade';
  for (const fx of [x + w * 0.08, x + w * 0.66]) {
    t.fillRect(fx, y + h - 8, w * 0.26, 8);
    t.strokeRect(fx, y + h - 8, w * 0.26, 8);
  }
}

function drawSnowman(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#ffffff';
  // body + head
  wobblyCircle(t, rng, cx, y + h * 0.68, Math.min(w, h) * 0.34, 0.05);
  t.fill(); t.stroke();
  wobblyCircle(t, rng, cx, y + h * 0.3, Math.min(w, h) * 0.23, 0.05);
  t.fill(); t.stroke();
  // coal eyes + carrot nose
  t.fillStyle = INK;
  t.beginPath(); t.arc(cx - 7, y + h * 0.26, 2, 0, Math.PI * 2); t.fill();
  t.beginPath(); t.arc(cx + 7, y + h * 0.26, 2, 0, Math.PI * 2); t.fill();
  t.fillStyle = '#e88a2a';
  t.beginPath();
  t.moveTo(cx, y + h * 0.31);
  t.lineTo(cx + 16, y + h * 0.34);
  t.lineTo(cx, y + h * 0.36);
  t.closePath();
  t.fill();
  t.lineWidth = 1.2;
  t.stroke();
  // coal buttons
  t.fillStyle = INK;
  for (const k of [0.56, 0.66, 0.76]) {
    t.beginPath(); t.arc(cx, y + h * k, 2.2, 0, Math.PI * 2); t.fill();
  }
  // stick arms
  t.strokeStyle = '#7a5a38';
  t.lineWidth = 2.4;
  t.beginPath();
  t.moveTo(cx - w * 0.3, y + h * 0.55); t.lineTo(cx - w * 0.56, y + h * 0.4);
  t.moveTo(cx - w * 0.48, y + h * 0.45) ; t.lineTo(cx - w * 0.54, y + h * 0.52);
  t.moveTo(cx + w * 0.3, y + h * 0.55); t.lineTo(cx + w * 0.56, y + h * 0.44);
  t.stroke();
  // bucket hat
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#2f66e0';
  t.beginPath();
  t.moveTo(cx - 14, y + h * 0.14);
  t.lineTo(cx - 10, y + h * 0.02);
  t.lineTo(cx + 10, y + h * 0.02);
  t.lineTo(cx + 14, y + h * 0.14);
  t.closePath();
  t.fill(); t.stroke();
  t.beginPath();
  t.moveTo(cx - 19, y + h * 0.15); t.lineTo(cx + 19, y + h * 0.15);
  t.stroke();
}

registerObstacles({
  lodge: drawLodge, pylon: drawPylon, snowman: drawSnowman,
});
