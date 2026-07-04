'use strict';

/* ============================================================
   Deep theme — the seabed. Pale underwater paper with light
   rays and bubbles; ocean currents that push fighters (the
   mechanic lives in entities/collision, painted here); kelp,
   fish, jellyfish; a giant-clam plaza; wreck/coral obstacles.
   ============================================================ */

registerGround('seabed', (g, rng, map) => {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, WORLD.w, WORLD.h);
  // soft blue mottling
  for (let i = 0; i < 20; i++) {
    g.fillStyle = `rgba(120,170,200,${rand(rng, 0.04, 0.09)})`;
    g.beginPath();
    g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
              rand(rng, 100, 300), rand(rng, 60, 160), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
  // slanted light rays from the surface
  for (let i = 0; i < 6; i++) {
    const x = rand(rng, -200, WORLD.w);
    g.fillStyle = `rgba(255,255,255,${rand(rng, 0.05, 0.1)})`;
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 160, 0);
    g.lineTo(x + 420, WORLD.h);
    g.lineTo(x + 180, WORLD.h);
    g.closePath();
    g.fill();
  }
  // sand ripple arcs + speckles
  g.strokeStyle = 'rgba(90,130,160,0.25)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 70; i++) {
    const x = rand(rng, 40, WORLD.w - 40), y = rand(rng, 40, WORLD.h - 40);
    g.beginPath();
    g.arc(x, y, rand(rng, 12, 26), Math.PI + 0.4, Math.PI * 2 - 0.4);
    g.stroke();
  }
  g.fillStyle = 'rgba(90,130,160,0.15)';
  for (let i = 0; i < 1600; i++) {
    g.fillRect(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 1, 2.2), 1);
  }
  // drifting bubbles
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  g.lineWidth = 1.2;
  for (let i = 0; i < 60; i++) {
    g.beginPath();
    g.arc(rand(rng, 20, WORLD.w - 20), rand(rng, 20, WORLD.h - 20), rand(rng, 2, 5.5), 0, Math.PI * 2);
    g.stroke();
  }
});

/* ocean currents: tinted lanes with flow arrows; entities get
   pushed while inside (see Fighter.applyCurrent) */
function drawCurrents(g, rng, map) {
  for (const c of map.currents) {
    g.fillStyle = 'rgba(120,185,215,0.22)';
    g.beginPath();
    g.roundRect(c.x, c.y, c.w, c.h, 30);
    g.fill();
    g.strokeStyle = 'rgba(90,150,180,0.5)';
    g.lineWidth = 1.6;
    g.setLineDash([14, 10]);
    g.stroke();
    g.setLineDash([]);
    // streamlines + arrowheads in the flow direction
    const horiz = Math.abs(c.dx) > Math.abs(c.dy);
    g.strokeStyle = 'rgba(255,255,255,0.65)';
    g.lineWidth = 2;
    const lanes = 3;
    for (let l = 1; l <= lanes; l++) {
      const off = (horiz ? c.h : c.w) * l / (lanes + 1);
      g.beginPath();
      if (horiz) {
        const y = c.y + off;
        for (let x = c.x + 14; x < c.x + c.w - 14; x += 8) {
          const wob = Math.sin(x * 0.045 + l) * 5;
          x === c.x + 14 ? g.moveTo(x, y + wob) : g.lineTo(x, y + wob);
        }
      } else {
        const x = c.x + off;
        for (let y = c.y + 14; y < c.y + c.h - 14; y += 8) {
          const wob = Math.sin(y * 0.045 + l) * 5;
          y === c.y + 14 ? g.moveTo(x + wob, y) : g.lineTo(x + wob, y);
        }
      }
      g.stroke();
      // arrowhead at the exit end
      const ax = horiz ? (c.dx > 0 ? c.x + c.w - 16 : c.x + 16) : c.x + off;
      const ay = horiz ? c.y + off : (c.dy > 0 ? c.y + c.h - 16 : c.y + 16);
      g.beginPath();
      g.moveTo(ax - c.dx * 10 - c.dy * 6, ay - c.dy * 10 - c.dx * 6);
      g.lineTo(ax, ay);
      g.lineTo(ax - c.dx * 10 + c.dy * 6, ay - c.dy * 10 + c.dx * 6);
      g.stroke();
    }
  }
}

function drawKelp(g, rng, map) {
  for (const [kx, ky] of map.kelp) {
    const height = rand(rng, 90, 150);
    const sway = rand(rng, 10, 22);
    for (const off of [-7, 0, 7]) {
      g.strokeStyle = 'rgba(90,150,110,0.75)';
      g.lineWidth = 2.4;
      g.beginPath();
      g.moveTo(kx + off, ky);
      g.quadraticCurveTo(kx + off + sway, ky - height * 0.5, kx + off - sway * 0.5, ky - height);
      g.stroke();
      // leaves
      g.fillStyle = 'rgba(110,170,125,0.6)';
      for (let t = 0.3; t < 1; t += 0.3) {
        const lx = kx + off + sway * Math.sin(t * Math.PI);
        const ly = ky - height * t;
        g.beginPath();
        g.ellipse(lx + 5, ly, 6, 2.4, -0.5, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
}

function drawFishes(g, rng, map) {
  for (const [fx, fy] of map.fishes) {
    const flip = rng() < 0.5 ? -1 : 1;
    for (let i = 0; i < 3; i++) {
      const x = fx + i * 22 * flip + rand(rng, -6, 6);
      const y = fy + (i % 2) * 12 - 6;
      g.strokeStyle = INK;
      g.lineWidth = 1.4;
      g.fillStyle = 'rgba(255,255,255,0.5)';
      g.beginPath();
      g.ellipse(x, y, 8, 4, 0, 0, Math.PI * 2);
      g.fill(); g.stroke();
      g.beginPath();
      g.moveTo(x - 8 * flip, y);
      g.lineTo(x - 13 * flip, y - 4);
      g.lineTo(x - 13 * flip, y + 4);
      g.closePath();
      g.stroke();
      g.fillStyle = INK;
      g.beginPath(); g.arc(x + 4 * flip, y - 1, 0.9, 0, Math.PI * 2); g.fill();
    }
  }
}

function drawJellies(g, rng, map) {
  for (const [jx, jy] of map.jellies) {
    const r = rand(rng, 10, 16);
    g.fillStyle = 'rgba(215,170,220,0.4)';
    g.strokeStyle = 'rgba(150,110,170,0.7)';
    g.lineWidth = 1.6;
    g.beginPath();
    g.arc(jx, jy, r, Math.PI, 0);
    g.quadraticCurveTo(jx + r * 0.6, jy + 4, jx + r * 0.3, jy + 3);
    g.quadraticCurveTo(jx, jy + 6, jx - r * 0.3, jy + 3);
    g.quadraticCurveTo(jx - r * 0.6, jy + 4, jx - r, jy);
    g.closePath();
    g.fill(); g.stroke();
    // tentacles
    g.lineWidth = 1.2;
    for (const off of [-r * 0.5, 0, r * 0.5]) {
      g.beginPath();
      g.moveTo(jx + off, jy + 4);
      g.quadraticCurveTo(jx + off + 5, jy + 14, jx + off - 3, jy + 24);
      g.stroke();
    }
  }
}

registerFeature(19, drawCurrents);
registerFeature(43, drawKelp);
registerFeature(57, drawFishes);
registerFeature(61, drawJellies);

/* the giant clam: the red button sits on its pearl */
registerPlaza('clam', (g, rng, map, p) => {
  // lower shell
  g.strokeStyle = INK;
  g.lineWidth = 2;
  g.fillStyle = '#e8d8e0';
  g.beginPath();
  g.moveTo(p.x - 42, p.y + 6);
  g.quadraticCurveTo(p.x, p.y + 30, p.x + 42, p.y + 6);
  g.quadraticCurveTo(p.x, p.y + 16, p.x - 42, p.y + 6);
  g.closePath();
  g.fill(); g.stroke();
  // upper shell, open
  g.fillStyle = '#f0e4ea';
  g.beginPath();
  g.moveTo(p.x - 42, p.y + 4);
  g.quadraticCurveTo(p.x - 20, p.y - 34, p.x + 30, p.y - 26);
  g.quadraticCurveTo(p.x + 44, p.y - 12, p.x + 42, p.y + 4);
  g.quadraticCurveTo(p.x, p.y - 8, p.x - 42, p.y + 4);
  g.closePath();
  g.fill(); g.stroke();
  // shell ribs
  g.lineWidth = 1.2;
  g.strokeStyle = INK_LIGHT;
  g.beginPath();
  for (const k of [-0.55, -0.15, 0.3]) {
    g.moveTo(p.x + 44 * k, p.y + 2);
    g.lineTo(p.x + 50 * k - 4, p.y - 24);
  }
  g.stroke();
  // the pearl
  g.fillStyle = '#fdfdf8';
  g.strokeStyle = INK;
  g.lineWidth = 1.6;
  g.beginPath(); g.arc(p.x, p.y - 2, 9, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.9)';
  g.beginPath(); g.arc(p.x - 3, p.y - 5, 2.4, 0, Math.PI * 2); g.fill();
  // bubbles rising
  g.strokeStyle = 'rgba(255,255,255,0.7)';
  g.lineWidth = 1.2;
  for (const [bx, byy, br] of [[10, -38, 3], [-6, -50, 2.2], [16, -58, 1.8]]) {
    g.beginPath(); g.arc(p.x + bx, p.y + byy, br, 0, Math.PI * 2); g.stroke();
  }
});

/* ---------------- deep obstacles ---------------- */

function drawWreck(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  // tilted broken hull
  t.save();
  t.translate(x + w / 2, y + h * 0.6);
  t.rotate(-0.08);
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#c9b8a0';
  t.beginPath();
  t.moveTo(-w * 0.46, -h * 0.1);
  t.quadraticCurveTo(-w * 0.2, h * 0.34, w * 0.1, h * 0.3);
  t.lineTo(w * 0.46, h * 0.1);
  t.lineTo(w * 0.42, -h * 0.26);
  t.lineTo(-w * 0.4, -h * 0.3);
  t.closePath();
  t.fill(); t.stroke();
  // planks + hole
  t.strokeStyle = 'rgba(90,70,40,0.5)';
  t.lineWidth = 1.2;
  t.beginPath();
  for (const k of [-0.12, 0.04, 0.2]) {
    t.moveTo(-w * 0.42, h * k);
    t.quadraticCurveTo(0, h * (k + 0.12), w * 0.42, h * k);
  }
  t.stroke();
  t.fillStyle = '#3d5566';
  t.strokeStyle = INK;
  t.lineWidth = 1.6;
  t.beginPath();
  t.ellipse(-w * 0.12, h * 0.05, 16, 11, 0.3, 0, Math.PI * 2);
  t.fill(); t.stroke();
  // broken mast + crow's nest
  t.lineWidth = 2.4;
  t.beginPath();
  t.moveTo(w * 0.1, -h * 0.28);
  t.lineTo(w * 0.24, -h * 0.85);
  t.stroke();
  t.lineWidth = 1.6;
  t.beginPath();
  t.moveTo(w * 0.05, -h * 0.6); t.lineTo(w * 0.36, -h * 0.66);
  t.stroke();
  // tattered flag
  t.fillStyle = '#8d5a38';
  t.beginPath();
  t.moveTo(w * 0.24, -h * 0.85);
  t.lineTo(w * 0.4, -h * 0.78);
  t.lineTo(w * 0.3, -h * 0.74);
  t.lineTo(w * 0.36, -h * 0.68);
  t.lineTo(w * 0.23, -h * 0.72);
  t.closePath();
  t.fill(); t.stroke();
  t.restore();
}

function drawCoral(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  // branching antler coral
  t.strokeStyle = '#d87a6a';
  t.lineWidth = 5;
  t.lineCap = 'round';
  const branch = (bx, byy, a, len, depth) => {
    const ex = bx + Math.cos(a) * len, ey = byy + Math.sin(a) * len;
    t.beginPath(); t.moveTo(bx, byy); t.lineTo(ex, ey); t.stroke();
    if (depth > 0) {
      branch(ex, ey, a - rand(rng, 0.3, 0.7), len * 0.66, depth - 1);
      branch(ex, ey, a + rand(rng, 0.3, 0.7), len * 0.66, depth - 1);
    }
  };
  branch(x + w * 0.3, y + h, -Math.PI / 2 - 0.2, h * 0.4, 2);
  t.strokeStyle = '#e0956a';
  t.lineWidth = 4;
  branch(x + w * 0.62, y + h, -Math.PI / 2 + 0.25, h * 0.36, 2);
  // fan coral
  t.strokeStyle = '#c86a88';
  t.lineWidth = 1.6;
  const fx = x + w * 0.85, fy = y + h;
  for (let i = -2; i <= 2; i++) {
    t.beginPath();
    t.moveTo(fx, fy);
    t.quadraticCurveTo(fx + i * 8, fy - h * 0.3, fx + i * 12, fy - h * 0.44);
    t.stroke();
  }
  t.beginPath();
  t.arc(fx, fy - h * 0.3, h * 0.22, Math.PI * 1.15, Math.PI * 1.85);
  t.stroke();
  // outline pass to sit it in the sketch world
  t.strokeStyle = INK;
  t.lineWidth = 1.2;
  t.beginPath();
  t.moveTo(x + 4, y + h); t.lineTo(x + w - 4, y + h);
  t.stroke();
}

function drawAnchor(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2;
  t.strokeStyle = INK;
  t.fillStyle = '#8b93a5';
  t.lineWidth = 2;
  // ring
  t.beginPath(); t.arc(cx, y + 10, 8, 0, Math.PI * 2); t.stroke();
  // shank
  t.lineWidth = 6;
  t.beginPath(); t.moveTo(cx, y + 18); t.lineTo(cx, y + h * 0.78); t.stroke();
  // stock
  t.lineWidth = 5;
  t.beginPath(); t.moveTo(cx - w * 0.3, y + h * 0.26); t.lineTo(cx + w * 0.3, y + h * 0.26); t.stroke();
  // arms + flukes
  t.lineWidth = 6;
  t.beginPath();
  t.moveTo(cx - w * 0.38, y + h * 0.55);
  t.quadraticCurveTo(cx, y + h * 1.02, cx + w * 0.38, y + h * 0.55);
  t.stroke();
  t.lineWidth = 2;
  t.fillStyle = '#8b93a5';
  for (const dir of [-1, 1]) {
    t.beginPath();
    t.moveTo(cx + dir * w * 0.38, y + h * 0.55);
    t.lineTo(cx + dir * w * 0.5, y + h * 0.66);
    t.lineTo(cx + dir * w * 0.33, y + h * 0.7);
    t.closePath();
    t.fill(); t.stroke();
  }
  // rope trailing off
  t.strokeStyle = '#b98a5e';
  t.lineWidth = 2.4;
  t.beginPath();
  t.moveTo(cx, y + 4);
  t.quadraticCurveTo(cx + w * 0.4, y - 14, cx + w * 0.6, y + 6);
  t.stroke();
}

function drawChest(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // open lid
  t.fillStyle = '#a8743e';
  t.beginPath();
  t.moveTo(x + 4, y + h * 0.42);
  t.quadraticCurveTo(x + w / 2, y - h * 0.3, x + w - 4, y + h * 0.42);
  t.lineTo(x + w - 8, y + h * 0.5);
  t.lineTo(x + 8, y + h * 0.5);
  t.closePath();
  t.fill(); t.stroke();
  // body
  t.fillStyle = '#b98a5e';
  t.beginPath(); t.roundRect(x + 6, y + h * 0.5, w - 12, h * 0.46, 4); t.fill(); t.stroke();
  // straps + lock
  t.fillStyle = '#8b93a5';
  for (const k of [0.28, 0.72]) {
    t.fillRect(x + w * k - 3, y + h * 0.5, 6, h * 0.46);
    t.strokeRect(x + w * k - 3, y + h * 0.5, 6, h * 0.46);
  }
  // treasure heap + sparkles
  t.fillStyle = '#f0d489';
  t.beginPath();
  t.ellipse(x + w / 2, y + h * 0.5, w * 0.34, h * 0.14, 0, Math.PI, 0);
  t.fill(); t.stroke();
  t.fillStyle = '#fdfdf8';
  for (const [px, py] of [[0.36, 0.42], [0.56, 0.38], [0.66, 0.46]]) {
    t.beginPath(); t.arc(x + w * px, y + h * py, 3, 0, Math.PI * 2); t.fill(); t.stroke();
  }
  t.strokeStyle = '#f0b41c';
  t.lineWidth = 1.6;
  for (const [sx2, sy2] of [[0.2, 0.2], [0.82, 0.26]]) {
    const px = x + w * sx2, py = y + h * sy2;
    t.beginPath();
    t.moveTo(px - 5, py); t.lineTo(px + 5, py);
    t.moveTo(px, py - 5); t.lineTo(px, py + 5);
    t.stroke();
  }
}

function drawDivebell(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  // bell dome
  t.fillStyle = '#d8b84e';
  t.beginPath();
  t.moveTo(x + 8, y + h * 0.85);
  t.quadraticCurveTo(x + 4, y + h * 0.2, cx, y + h * 0.08);
  t.quadraticCurveTo(x + w - 4, y + h * 0.2, x + w - 8, y + h * 0.85);
  t.closePath();
  t.fill(); t.stroke();
  // base ring
  t.fillStyle = '#8b93a5';
  t.beginPath(); t.roundRect(x + 2, y + h * 0.82, w - 4, h * 0.14, 5); t.fill(); t.stroke();
  // rivet seams
  t.lineWidth = 1.2;
  t.strokeStyle = 'rgba(90,70,30,0.6)';
  t.beginPath();
  t.moveTo(x + 8, y + h * 0.5);
  t.quadraticCurveTo(cx, y + h * 0.4, x + w - 8, y + h * 0.5);
  t.stroke();
  t.fillStyle = 'rgba(90,70,30,0.6)';
  for (let k = 0.2; k <= 0.8; k += 0.15) {
    t.beginPath(); t.arc(x + w * k, y + h * 0.47 - Math.sin(k * Math.PI) * 6, 1.4, 0, Math.PI * 2); t.fill();
  }
  // porthole with a peeking fish
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = 'rgba(200,230,240,0.9)';
  t.beginPath(); t.arc(cx, y + h * 0.42, w * 0.16, 0, Math.PI * 2); t.fill(); t.stroke();
  t.fillStyle = '#e0956a';
  t.beginPath(); t.ellipse(cx + 2, y + h * 0.42, 6, 3.4, 0, 0, Math.PI * 2); t.fill();
  t.lineWidth = 1.2;
  t.stroke();
  // air hose rising
  t.strokeStyle = INK_LIGHT;
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(cx, y + h * 0.08);
  t.quadraticCurveTo(cx + 14, y - 16, cx + 4, y - 34);
  t.stroke();
}

registerObstacles({
  wreck: drawWreck, coral: drawCoral, anchor: drawAnchor,
  chest: drawChest, divebell: drawDivebell,
});
