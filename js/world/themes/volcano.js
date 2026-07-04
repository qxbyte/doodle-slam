'use strict';

/* ============================================================
   Volcano theme — ash-grey paper, bubbling lava pools (the
   damage mechanic lives in collision/game; painted here),
   smoke vents, a cinder-cone plaza and jagged crag obstacles.
   ============================================================ */

registerGround('ash', (g, rng, map) => {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, WORLD.w, WORLD.h);
  // warm grey mottling
  for (let i = 0; i < 22; i++) {
    g.fillStyle = `rgba(120,105,95,${rand(rng, 0.04, 0.09)})`;
    g.beginPath();
    g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
              rand(rng, 120, 320), rand(rng, 70, 170), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
  // cooled-rock crack lines
  g.strokeStyle = 'rgba(100,85,75,0.30)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 60; i++) {
    const x = rand(rng, 40, WORLD.w - 40), y = rand(rng, 40, WORLD.h - 40);
    g.beginPath();
    g.moveTo(x, y);
    let px = x, py = y;
    for (let s = 0; s < 3; s++) {
      px += rand(rng, -26, 26); py += rand(rng, -16, 16);
      g.lineTo(px, py);
    }
    g.stroke();
  }
  // soot speckles + faint embers
  g.fillStyle = 'rgba(90,75,65,0.18)';
  for (let i = 0; i < 1400; i++) {
    g.fillRect(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 1, 2.4), 1);
  }
  g.fillStyle = 'rgba(230,110,50,0.35)';
  for (let i = 0; i < 90; i++) {
    g.beginPath();
    g.arc(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 0.8, 1.8), 0, Math.PI * 2);
    g.fill();
  }
});

/* lava pools: walkable but deadly (see the game update loop) */
function drawLava(g, rng, map) {
  for (const r of map.lava) {
    // warning glow bleeding past the pool edge
    g.fillStyle = 'rgba(240,120,50,0.18)';
    g.beginPath(); g.roundRect(r.x - 14, r.y - 14, r.w + 28, r.h + 28, 34); g.fill();
    // molten body
    g.fillStyle = '#ee7434';
    g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, 22); g.fill();
    g.strokeStyle = '#a83c14';
    g.lineWidth = 2.4;
    wobblyRect(g, rng, r.x, r.y, r.w, r.h, 2.2);
    g.stroke();
    // hot streaks + bubbles
    g.strokeStyle = 'rgba(255,205,120,0.75)';
    g.lineWidth = 2;
    const lanes = Math.max(1, Math.floor(r.h / 55));
    for (let l = 1; l <= lanes; l++) {
      const y = r.y + r.h * l / (lanes + 1);
      g.beginPath();
      for (let x = r.x + 12; x < r.x + r.w - 12; x += 9) {
        const wob = Math.sin(x * 0.05 + l * 2) * 6;
        x === r.x + 12 ? g.moveTo(x, y + wob) : g.lineTo(x, y + wob);
      }
      g.stroke();
    }
    g.strokeStyle = 'rgba(255,225,150,0.8)';
    g.lineWidth = 1.4;
    const bubbles = Math.floor(r.w * r.h / 9000);
    for (let i = 0; i < bubbles; i++) {
      g.beginPath();
      g.arc(rand(rng, r.x + 10, r.x + r.w - 10), rand(rng, r.y + 8, r.y + r.h - 8),
            rand(rng, 2, 5), 0, Math.PI * 2);
      g.stroke();
    }
  }
}

/* smoke vents: little rocky mouths with curling plumes */
function drawVents(g, rng, map) {
  for (const [vx, vy] of map.vents) {
    g.strokeStyle = INK;
    g.lineWidth = 1.6;
    g.fillStyle = '#b0a49a';
    g.beginPath();
    g.moveTo(vx - 14, vy); g.lineTo(vx - 5, vy - 12); g.lineTo(vx + 5, vy - 12); g.lineTo(vx + 14, vy);
    g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#5a5049';
    g.beginPath(); g.ellipse(vx, vy - 12, 5, 2.4, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    // smoke curls
    g.strokeStyle = 'rgba(120,110,105,0.55)';
    g.lineWidth = 2;
    for (const [ox, s] of [[-2, 10], [4, 15], [-5, 20]]) {
      g.beginPath();
      g.arc(vx + ox, vy - 20 - s, rand(rng, 4, 7), 0.4, Math.PI * 1.5);
      g.stroke();
    }
  }
}

registerFeature(19, drawLava);
registerFeature(45, drawVents);

/* plaza: a glowing fissure ring — the red button sits over the magma */
registerPlaza('vent', (g, rng, map, p) => {
  g.fillStyle = 'rgba(240,120,50,0.22)';
  g.beginPath(); g.arc(p.x, p.y, 36, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#a83c14';
  g.lineWidth = 2;
  wobblyCircle(g, rng, p.x, p.y, 30, 0.06);
  g.stroke();
  // radial cracks with hot cores
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rand(rng, -0.2, 0.2);
    const r1 = 30, r2 = rand(rng, 44, 60);
    g.strokeStyle = '#a83c14';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
    g.lineTo(p.x + Math.cos(a) * r2, p.y + Math.sin(a) * r2);
    g.stroke();
    g.strokeStyle = 'rgba(255,190,110,0.8)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1);
    g.lineTo(p.x + Math.cos(a) * (r1 + (r2 - r1) * 0.6), p.y + Math.sin(a) * (r1 + (r2 - r1) * 0.6));
    g.stroke();
  }
});

/* ---------------- volcano obstacles ---------------- */

/* a small cinder cone with a smoking crater */
function drawCone(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#8d7d72';
  t.beginPath();
  t.moveTo(x + 4, y + h - 4);
  t.lineTo(x + w * 0.34, y + 8);
  t.lineTo(x + w * 0.66, y + 8);
  t.lineTo(x + w - 4, y + h - 4);
  t.closePath();
  t.fill(); t.stroke();
  // crater mouth + inner glow
  t.fillStyle = '#5a5049';
  t.beginPath(); t.ellipse(x + w / 2, y + 10, w * 0.16, 6, 0, 0, Math.PI * 2); t.fill(); t.stroke();
  t.fillStyle = '#ee7434';
  t.beginPath(); t.ellipse(x + w / 2, y + 10, w * 0.09, 3.2, 0, 0, Math.PI * 2); t.fill();
  // lava dribbles down the flank
  t.strokeStyle = '#ee7434';
  t.lineWidth = 3;
  t.beginPath();
  t.moveTo(x + w * 0.42, y + 14);
  t.quadraticCurveTo(x + w * 0.36, y + h * 0.5, x + w * 0.40, y + h * 0.72);
  t.stroke();
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(x + w * 0.58, y + 14);
  t.quadraticCurveTo(x + w * 0.64, y + h * 0.4, x + w * 0.60, y + h * 0.55);
  t.stroke();
  // rock hatching
  t.strokeStyle = 'rgba(70,60,55,0.4)';
  t.lineWidth = 1.2;
  t.beginPath();
  for (const k of [0.3, 0.5, 0.7]) {
    t.moveTo(x + w * (0.5 - k * 0.4), y + h * k);
    t.lineTo(x + w * (0.5 - k * 0.4) + 14, y + h * k - 8);
  }
  t.stroke();
  // smoke above
  t.strokeStyle = 'rgba(120,110,105,0.55)';
  t.lineWidth = 2.4;
  for (const [ox, s] of [[-4, 12], [6, 22], [-2, 34]]) {
    t.beginPath();
    t.arc(x + w / 2 + ox, y - s, rand(rng, 5, 9), 0.4, Math.PI * 1.5);
    t.stroke();
  }
}

/* jagged basalt crag cluster */
function drawCrag(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2;
  const spike = (sx, sw, sh) => {
    t.fillStyle = '#7d7068';
    t.beginPath();
    t.moveTo(sx, y + h - 4);
    t.lineTo(sx + sw * 0.3, y + h - 4 - sh);
    t.lineTo(sx + sw * 0.55, y + h - 4 - sh * 0.75);
    t.lineTo(sx + sw, y + h - 4);
    t.closePath();
    t.fill(); t.stroke();
    // facet line
    t.strokeStyle = 'rgba(60,52,48,0.5)';
    t.lineWidth = 1.2;
    t.beginPath();
    t.moveTo(sx + sw * 0.3, y + h - 4 - sh);
    t.lineTo(sx + sw * 0.42, y + h - 4);
    t.stroke();
    t.strokeStyle = INK;
    t.lineWidth = 2;
  };
  spike(x + 2, w * 0.44, h * 0.9);
  spike(x + w * 0.34, w * 0.42, h * 0.65);
  spike(x + w * 0.62, w * 0.36, h * 0.8);
}

registerObstacles({ cone: drawCone, crag: drawCrag });
