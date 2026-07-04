'use strict';

/* ============================================================
   Fair theme — a night funfair drawn in chalk on a blackboard.
   The 'chalk' palette flips INK to chalk-white, so every shared
   sketch primitive turns into a chalk drawing automatically;
   this file adds the board ground, chalk-line paths, bunting,
   star doodles, the show-stage plaza and the ride obstacles.
   ============================================================ */

registerGround('chalk', (g, rng, map) => {
  // blackboard: deep board green, dust clouds, old eraser swipes
  g.fillStyle = PAPER;
  g.fillRect(0, 0, WORLD.w, WORLD.h);
  // uneven board shading
  for (let i = 0; i < 20; i++) {
    g.fillStyle = `rgba(255,255,255,${rand(rng, 0.015, 0.04)})`;
    g.beginPath();
    g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
              rand(rng, 120, 320), rand(rng, 70, 180), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
  // eraser swipes: wide soft streaks
  for (let i = 0; i < 12; i++) {
    const x = rand(rng, 100, WORLD.w - 100), y = rand(rng, 80, WORLD.h - 80);
    const a = rand(rng, -0.5, 0.5);
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.fillStyle = `rgba(240,242,236,${rand(rng, 0.03, 0.06)})`;
    g.beginPath();
    g.roundRect(-rand(rng, 90, 180), -22, rand(rng, 180, 360), 44, 22);
    g.fill();
    g.restore();
  }
  // chalk dust speckles
  g.fillStyle = 'rgba(240,242,236,0.18)';
  for (let i = 0; i < 2200; i++) {
    g.fillRect(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 0.8, 2), 1);
  }
  // ghost of an old half-erased doodle
  g.strokeStyle = 'rgba(240,242,236,0.10)';
  g.lineWidth = 3;
  wobblyCircle(g, rng, WORLD.w * 0.78, WORLD.h * 0.22, 120, 0.08);
  g.stroke();
  g.beginPath();
  g.moveTo(WORLD.w * 0.15, WORLD.h * 0.8);
  g.lineTo(WORLD.w * 0.22, WORLD.h * 0.68);
  g.lineTo(WORLD.w * 0.29, WORLD.h * 0.8);
  g.closePath();
  g.stroke();
});

/* chalk paths: double dashed lines with little direction arrows */
registerRoadStyle('chalk', (g, rng, map) => {
  for (const r of map.roads) {
    const horiz = r.y1 === r.y2;
    const half = r.w / 2;
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 2;
    g.setLineDash([18, 14]);
    for (const off of [-half, half]) {
      wobblyPath(g, rng, horiz
        ? [[r.x1, r.y1 + off], [r.x2, r.y2 + off]]
        : [[r.x1 + off, r.y1], [r.x2 + off, r.y2]], 2.5);
      g.stroke();
    }
    g.setLineDash([]);
    // arrows along the middle
    const len = horiz ? r.x2 - r.x1 : r.y2 - r.y1;
    for (let d = 160; d < len; d += 380) {
      const px = horiz ? r.x1 + d : r.x1, py = horiz ? r.y1 : r.y1 + d;
      g.beginPath();
      if (horiz) {
        g.moveTo(px - 10, py - 6); g.lineTo(px + 6, py); g.lineTo(px - 10, py + 6);
      } else {
        g.moveTo(px - 6, py - 10); g.lineTo(px, py + 6); g.lineTo(px + 6, py - 10);
      }
      g.stroke();
    }
  }
});

/* strings of bunting flags between two points */
function drawBunting(g, rng, map) {
  const tints = ['#e6392a', '#f0b41c', '#2f66e0', '#3ba24f'];
  map.bunting.forEach(([x1, y1, x2, y2], bi) => {
    const midX = (x1 + x2) / 2, midY = Math.max(y1, y2) + 40;   // sag
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(x1, y1);
    g.quadraticCurveTo(midX, midY, x2, y2);
    g.stroke();
    const flags = Math.floor(dist(x1, y1, x2, y2) / 55);
    for (let i = 1; i < flags; i++) {
      const t = i / flags;
      const px = lerp(lerp(x1, midX, t), lerp(midX, x2, t), t);
      const py = lerp(lerp(y1, midY, t), lerp(midY, y2, t), t);
      g.fillStyle = tints[(bi + i) % tints.length];
      g.beginPath();
      g.moveTo(px - 7, py);
      g.lineTo(px, py + 14);
      g.lineTo(px + 7, py);
      g.closePath();
      g.fill();
      g.strokeStyle = INK;
      g.lineWidth = 1.1;
      g.stroke();
    }
  });
}

/* chalk stars, moons and spirals like kids doodle in the margins */
function drawChalkStars(g, rng, map) {
  map.chalkstars.forEach(([sx, sy], i) => {
    g.strokeStyle = INK_LIGHT;
    g.lineWidth = 1.6;
    const kind = i % 3;
    if (kind === 0) {
      // five-point star
      g.beginPath();
      for (let k = 0; k <= 5; k++) {
        const a = -Math.PI / 2 + k * Math.PI * 4 / 5;
        const px = sx + Math.cos(a) * 12, py = sy + Math.sin(a) * 12;
        k === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.closePath();
      g.stroke();
    } else if (kind === 1) {
      // crescent moon
      g.beginPath(); g.arc(sx, sy, 11, 0.6, Math.PI * 2 - 0.6); g.stroke();
      g.beginPath(); g.arc(sx + 5, sy, 8, 0.9, Math.PI * 2 - 0.9); g.stroke();
    } else {
      // loose spiral
      g.beginPath();
      for (let a = 0; a < Math.PI * 3.5; a += 0.3) {
        const rr = 2 + a * 1.8;
        const px = sx + Math.cos(a) * rr, py = sy + Math.sin(a) * rr;
        a === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
      }
      g.stroke();
    }
  });
}

registerFeature(49, drawBunting);
registerFeature(54, drawChalkStars);

/* the show stage: a chalk star spotlight circle */
registerPlaza('stage', (g, rng, map, p) => {
  // crossed spotlight beams
  g.fillStyle = 'rgba(240,240,210,0.10)';
  for (const a of [-0.5, 0.35]) {
    g.save();
    g.translate(p.x, p.y);
    g.rotate(a);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(-70, -260);
    g.lineTo(70, -260);
    g.closePath();
    g.fill();
    g.restore();
  }
  // boards
  g.strokeStyle = INK;
  g.lineWidth = 2;
  wobblyCircle(g, rng, p.x, p.y, 58, 0.04);
  g.fillStyle = 'rgba(255,255,255,0.07)';
  g.fill();
  g.stroke();
  // big chalk star centre
  g.strokeStyle = INK;
  g.lineWidth = 2.4;
  g.beginPath();
  for (let k = 0; k <= 5; k++) {
    const a = -Math.PI / 2 + k * Math.PI * 4 / 5;
    const px = p.x + Math.cos(a) * 30, py = p.y + Math.sin(a) * 30;
    k === 0 ? g.moveTo(px, py) : g.lineTo(px, py);
  }
  g.closePath();
  g.stroke();
});

/* ---------------- fair obstacles ---------------- */

function drawFerriswheel(t, rng, b) {
  const { x, y, w, h } = b;
  const cx = x + w / 2, cy = y + h * 0.44, r = Math.min(w, h) * 0.4;
  const tints = ['#e6392a', '#f0b41c', '#2f66e0', '#3ba24f'];
  // A-frame legs
  t.strokeStyle = INK;
  t.lineWidth = 2.4;
  t.beginPath();
  t.moveTo(cx - w * 0.2, y + h - 6); t.lineTo(cx, cy);
  t.moveTo(cx + w * 0.2, y + h - 6); t.lineTo(cx, cy);
  t.stroke();
  // wheel: double rim + spokes
  t.lineWidth = 2;
  wobblyCircle(t, rng, cx, cy, r, 0.02);
  t.stroke();
  t.lineWidth = 1.2;
  wobblyCircle(t, rng, cx, cy, r * 0.82, 0.03);
  t.stroke();
  t.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    t.moveTo(cx, cy);
    t.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  t.stroke();
  // hub
  t.fillStyle = '#f0b41c';
  t.lineWidth = 1.8;
  t.beginPath(); t.arc(cx, cy, 6, 0, Math.PI * 2); t.fill(); t.stroke();
  // gondolas hanging off the rim
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const gx = cx + Math.cos(a) * r, gy = cy + Math.sin(a) * r;
    t.beginPath(); t.moveTo(gx, gy); t.lineTo(gx, gy + 7); t.stroke();
    t.fillStyle = tints[i % 4];
    t.beginPath(); t.roundRect(gx - 8, gy + 7, 16, 12, 4); t.fill();
    t.lineWidth = 1.4; t.stroke(); t.lineWidth = 1.8;
  }
}

function drawCarousel(t, rng, b) {
  const { x, y, w, h } = b;
  const cx = x + w / 2;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // platform
  t.fillStyle = 'rgba(255,255,255,0.08)';
  t.beginPath();
  t.ellipse(cx, y + h * 0.82, w * 0.46, h * 0.15, 0, 0, Math.PI * 2);
  t.fill(); t.stroke();
  // striped tent roof
  const roofY = y + h * 0.32, peakY = y + 4;
  for (let i = 0; i < 6; i++) {
    t.fillStyle = i % 2 ? '#e6392a' : PAPER;
    const a1 = x + (w / 6) * i, a2 = x + (w / 6) * (i + 1);
    t.beginPath();
    t.moveTo(cx, peakY);
    t.lineTo(a1, roofY);
    t.lineTo(a2, roofY);
    t.closePath();
    t.fill();
    t.lineWidth = 1.2;
    t.stroke();
  }
  t.lineWidth = 2;
  t.beginPath(); t.moveTo(x, roofY); t.lineTo(x + w, roofY); t.stroke();
  // pennant
  t.beginPath(); t.moveTo(cx, peakY); t.lineTo(cx, peakY - 14); t.stroke();
  t.fillStyle = '#f0b41c';
  t.beginPath(); t.moveTo(cx, peakY - 14); t.lineTo(cx + 12, peakY - 10); t.lineTo(cx, peakY - 6);
  t.closePath(); t.fill(); t.stroke();
  // poles + horses
  t.lineWidth = 1.6;
  for (const k of [0.24, 0.5, 0.76]) {
    const px = x + w * k;
    t.beginPath(); t.moveTo(px, roofY); t.lineTo(px, y + h * 0.8); t.stroke();
  }
  for (const [k, off] of [[0.24, 0], [0.5, -6], [0.76, 3]]) {
    const px = x + w * k, py = y + h * 0.62 + off;
    t.fillStyle = '#f0f2ec';
    // tiny chalk horse: body + head + legs
    t.beginPath(); t.ellipse(px, py, 11, 6, 0, 0, Math.PI * 2); t.fill(); t.stroke();
    t.beginPath(); t.arc(px + 10, py - 6, 4, 0, Math.PI * 2); t.fill(); t.stroke();
    t.beginPath();
    t.moveTo(px - 6, py + 5); t.lineTo(px - 7, py + 12);
    t.moveTo(px + 6, py + 5); t.lineTo(px + 7, py + 12);
    t.stroke();
  }
}

function drawBalloonstand(t, rng, b) {
  const { x, y, w, h } = b;
  const tints = ['#e6392a', '#f0b41c', '#2f66e0', '#3ba24f', '#e88ab8'];
  // cart
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = 'rgba(255,255,255,0.1)';
  t.beginPath(); t.roundRect(x + w * 0.2, y + h * 0.6, w * 0.6, h * 0.34, 6); t.fill(); t.stroke();
  t.beginPath(); t.arc(x + w * 0.32, y + h * 0.97, 5, 0, Math.PI * 2); t.stroke();
  t.beginPath(); t.arc(x + w * 0.68, y + h * 0.97, 5, 0, Math.PI * 2); t.stroke();
  // balloon bunch on wobbly strings
  const bx = x + w * 0.5, byy = y + h * 0.62;
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.42;
    const px = bx + Math.cos(a) * w * 0.34, py = byy + Math.sin(a) * h * 0.52;
    t.strokeStyle = INK_LIGHT;
    t.lineWidth = 1.1;
    t.beginPath();
    t.moveTo(bx, byy);
    t.quadraticCurveTo((bx + px) / 2 + 4, (byy + py) / 2, px, py + 8);
    t.stroke();
    t.fillStyle = tints[i % tints.length];
    t.strokeStyle = INK;
    t.lineWidth = 1.5;
    t.beginPath(); t.ellipse(px, py, 8, 10, 0, 0, Math.PI * 2); t.fill(); t.stroke();
    t.fillStyle = 'rgba(255,255,255,0.5)';
    t.beginPath(); t.ellipse(px - 2.5, py - 3, 2.4, 3, -0.4, 0, Math.PI * 2); t.fill();
  }
}

function drawGamestall(t, rng, b) {
  const { x, y, w, h } = b;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // counter
  t.fillStyle = 'rgba(255,255,255,0.1)';
  t.beginPath(); t.roundRect(x, y + h * 0.4, w, h * 0.6, 6); t.fill(); t.stroke();
  // striped awning
  for (let i = 0; i < 6; i++) {
    t.fillStyle = i % 2 ? '#2f66e0' : PAPER;
    t.beginPath();
    t.rect(x - 6 + ((w + 12) / 6) * i, y, (w + 12) / 6, h * 0.24);
    t.fill();
    t.lineWidth = 1.1;
    t.stroke();
  }
  t.lineWidth = 2;
  t.beginPath();
  const scallops = 6;
  for (let i = 0; i < scallops; i++) {
    t.arc(x - 6 + ((w + 12) / scallops) * (i + 0.5), y + h * 0.24, (w + 12) / scallops / 2, 0, Math.PI);
  }
  t.stroke();
  // can pyramid + ball on the counter
  t.fillStyle = '#f0f2ec';
  t.lineWidth = 1.4;
  const cy2 = y + h * 0.58;
  for (const [ox, oy] of [[-16, 12], [0, 12], [16, 12], [-8, 0], [8, 0]]) {
    t.beginPath(); t.roundRect(x + w * 0.4 + ox - 5, cy2 + oy - 6, 10, 13, 2); t.fill(); t.stroke();
  }
  t.fillStyle = '#e6392a';
  t.beginPath(); t.arc(x + w * 0.78, cy2 + 16, 6, 0, Math.PI * 2); t.fill(); t.stroke();
  // RING TOSS sign
  t.font = `15px 'Patrick Hand', cursive`;
  t.fillStyle = INK;
  t.textAlign = 'center';
  t.fillText('KNOCK EM!', x + w / 2, y + h - 8);
}

function drawPopcorncart(t, rng, b) {
  const { x, y, w, h } = b;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // glass box
  t.fillStyle = 'rgba(255,255,255,0.14)';
  t.beginPath(); t.roundRect(x + w * 0.14, y + h * 0.18, w * 0.72, h * 0.5, 4); t.fill(); t.stroke();
  t.lineWidth = 1.2;
  t.beginPath();
  t.moveTo(x + w * 0.5, y + h * 0.18); t.lineTo(x + w * 0.5, y + h * 0.68);
  t.stroke();
  // roof
  t.fillStyle = '#e6392a';
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(x + w * 0.06, y + h * 0.18);
  t.lineTo(x + w * 0.5, y + 2);
  t.lineTo(x + w * 0.94, y + h * 0.18);
  t.closePath();
  t.fill(); t.stroke();
  // popcorn spilling
  t.fillStyle = '#f0f2ec';
  t.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    t.beginPath();
    t.arc(x + w * rand(rng, 0.24, 0.76), y + h * rand(rng, 0.3, 0.6), rand(rng, 2.4, 4), 0, Math.PI * 2);
    t.fill(); t.stroke();
  }
  // base + wheels
  t.lineWidth = 2;
  t.fillStyle = 'rgba(255,255,255,0.08)';
  t.beginPath(); t.roundRect(x + w * 0.2, y + h * 0.68, w * 0.6, h * 0.2, 3); t.fill(); t.stroke();
  t.beginPath(); t.arc(x + w * 0.32, y + h * 0.93, 5.5, 0, Math.PI * 2); t.stroke();
  t.beginPath(); t.arc(x + w * 0.68, y + h * 0.93, 5.5, 0, Math.PI * 2); t.stroke();
  t.font = `13px 'Patrick Hand', cursive`;
  t.fillStyle = INK;
  t.textAlign = 'center';
  t.fillText('POP!', x + w / 2, y + h * 0.82);
}

function drawCircustent(t, rng, b) {
  const { x, y, w, h } = b;
  const cx = x + w / 2;
  const roofY = y + h * 0.42;
  t.strokeStyle = INK;
  // striped big top
  for (let i = 0; i < 8; i++) {
    t.fillStyle = i % 2 ? '#e6392a' : PAPER;
    const a1 = x + (w / 8) * i, a2 = x + (w / 8) * (i + 1);
    t.beginPath();
    t.moveTo(cx, y + 6);
    t.lineTo(a1, roofY);
    t.lineTo(a2, roofY);
    t.closePath();
    t.fill();
    t.lineWidth = 1.1;
    t.stroke();
  }
  // walls with scalloped hem
  t.fillStyle = 'rgba(255,255,255,0.1)';
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(x + w * 0.08, roofY);
  t.lineTo(x + w * 0.14, y + h - 4);
  t.lineTo(x + w * 0.86, y + h - 4);
  t.lineTo(x + w * 0.92, roofY);
  t.closePath();
  t.fill(); t.stroke();
  t.beginPath();
  for (let i = 0; i < 6; i++) {
    t.arc(x + w * 0.14 + (w * 0.72 / 6) * (i + 0.5), y + h - 4, w * 0.72 / 12, 0, Math.PI);
  }
  t.stroke();
  // entrance flap + pennant
  t.fillStyle = 'rgba(0,0,0,0.35)';
  t.beginPath();
  t.moveTo(cx - w * 0.09, y + h - 4);
  t.lineTo(cx, roofY + h * 0.16);
  t.lineTo(cx + w * 0.09, y + h - 4);
  t.closePath();
  t.fill();
  t.lineWidth = 1.4;
  t.stroke();
  t.lineWidth = 2;
  t.beginPath(); t.moveTo(cx, y + 6); t.lineTo(cx, y - 14); t.stroke();
  t.fillStyle = '#f0b41c';
  t.beginPath(); t.moveTo(cx, y - 14); t.lineTo(cx + 14, y - 9); t.lineTo(cx, y - 4);
  t.closePath(); t.fill(); t.stroke();
}

registerObstacles({
  ferriswheel: drawFerriswheel, carousel: drawCarousel,
  balloonstand: drawBalloonstand, gamestall: drawGamestall,
  popcorncart: drawPopcorncart, circustent: drawCircustent,
});
