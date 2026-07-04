'use strict';

/* ============================================================
   Sewer theme — concrete tiles under the town, glowing green
   goo channels (map.water gets re-skinned on top of the common
   water pass), paired warp pipes (mechanic in the game loop),
   moss, drips, a drain-cover plaza and barrel/valve obstacles.
   ============================================================ */

registerGround('sewer', (g, rng, map) => {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, WORLD.w, WORLD.h);
  // cool grey-green mottling
  for (let i = 0; i < 20; i++) {
    g.fillStyle = `rgba(110,130,110,${rand(rng, 0.04, 0.08)})`;
    g.beginPath();
    g.ellipse(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h),
              rand(rng, 120, 300), rand(rng, 70, 160), rand(rng, 0, 3), 0, Math.PI * 2);
    g.fill();
  }
  // big concrete tile grid
  g.strokeStyle = 'rgba(90,100,95,0.28)';
  g.lineWidth = 1.4;
  for (let x = 200; x < WORLD.w; x += 200) {
    g.beginPath();
    for (let y = 0; y <= WORLD.h; y += 40) {
      const wob = Math.sin(y * 0.02 + x) * 2;
      y === 0 ? g.moveTo(x + wob, y) : g.lineTo(x + wob, y);
    }
    g.stroke();
  }
  for (let y = 200; y < WORLD.h; y += 200) {
    g.beginPath();
    for (let x = 0; x <= WORLD.w; x += 40) {
      const wob = Math.sin(x * 0.02 + y) * 2;
      x === 0 ? g.moveTo(x, y + wob) : g.lineTo(x, y + wob);
    }
    g.stroke();
  }
  // damp stains + speckles
  g.fillStyle = 'rgba(80,100,90,0.12)';
  for (let i = 0; i < 26; i++) {
    g.beginPath();
    g.arc(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 18, 60), 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = 'rgba(70,90,80,0.16)';
  for (let i = 0; i < 1200; i++) {
    g.fillRect(rand(rng, 0, WORLD.w), rand(rng, 0, WORLD.h), rand(rng, 1, 2.2), 1);
  }
});

/* re-skin the water rects as glowing goo (drawn right after the
   common water pass at order 30, before bridges at 32) */
function drawGoo(g, rng, map) {
  if (map.ground !== 'sewer') return;
  for (const r of map.water) {
    g.fillStyle = '#79b95c';
    g.beginPath(); g.roundRect(r.x, r.y, r.w, r.h, 14); g.fill();
    g.strokeStyle = '#3f7031';
    g.lineWidth = 2.2;
    wobblyRect(g, rng, r.x, r.y, r.w, r.h, 1.8);
    g.stroke();
    // surface swirls + bubbles + glow dashes
    g.strokeStyle = 'rgba(215,240,170,0.7)';
    g.lineWidth = 1.8;
    const lanes = Math.max(1, Math.floor(Math.min(r.w, r.h) / 70));
    const horiz = r.w >= r.h;
    for (let l = 1; l <= lanes; l++) {
      g.beginPath();
      if (horiz) {
        const y = r.y + r.h * l / (lanes + 1);
        for (let x = r.x + 12; x < r.x + r.w - 12; x += 9) {
          const wob = Math.sin(x * 0.04 + l * 3) * 5;
          x === r.x + 12 ? g.moveTo(x, y + wob) : g.lineTo(x, y + wob);
        }
      } else {
        const x = r.x + r.w * l / (lanes + 1);
        for (let y = r.y + 12; y < r.y + r.h - 12; y += 9) {
          const wob = Math.sin(y * 0.04 + l * 3) * 5;
          y === r.y + 12 ? g.moveTo(x + wob, y) : g.lineTo(x + wob, y);
        }
      }
      g.stroke();
    }
    g.strokeStyle = 'rgba(225,245,180,0.8)';
    g.lineWidth = 1.3;
    const bubbles = Math.floor(r.w * r.h / 11000);
    for (let i = 0; i < bubbles; i++) {
      g.beginPath();
      g.arc(rand(rng, r.x + 10, r.x + r.w - 10), rand(rng, r.y + 8, r.y + r.h - 8),
            rand(rng, 2, 4.5), 0, Math.PI * 2);
      g.stroke();
    }
  }
}

/* warp pipe mouths — pairs share a number tag so routes read at a glance */
function drawPipes(g, rng, map) {
  map.pipes.forEach((pp, i) => {
    for (const [px, py] of [[pp.ax, pp.ay], [pp.bx, pp.by]]) {
      // rim glow
      g.fillStyle = 'rgba(90,180,100,0.20)';
      g.beginPath(); g.arc(px, py, 34, 0, Math.PI * 2); g.fill();
      // pipe collar
      g.fillStyle = '#57a05a';
      g.strokeStyle = INK;
      g.lineWidth = 2.2;
      g.beginPath(); g.arc(px, py, 26, 0, Math.PI * 2); g.fill(); g.stroke();
      // dark mouth + inner rim
      g.fillStyle = '#2c4430';
      g.beginPath(); g.arc(px, py, 17, 0, Math.PI * 2); g.fill(); g.stroke();
      g.strokeStyle = 'rgba(215,240,170,0.6)';
      g.lineWidth = 1.4;
      g.beginPath(); g.arc(px, py, 21.5, 0, Math.PI * 2); g.stroke();
      // bolts on the collar
      g.fillStyle = '#324a36';
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * Math.PI * 2 + i;
        g.beginPath(); g.arc(px + Math.cos(a) * 22, py + Math.sin(a) * 22, 1.6, 0, Math.PI * 2); g.fill();
      }
      // pair number tag
      g.fillStyle = '#fdfdf8';
      g.strokeStyle = INK;
      g.lineWidth = 1.6;
      g.beginPath(); g.arc(px + 20, py - 20, 9, 0, Math.PI * 2); g.fill(); g.stroke();
      g.fillStyle = INK;
      g.font = "800 12px 'Nunito', sans-serif";
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(String(i + 1), px + 20, py - 19);
    }
  });
}

/* moss tufts + ceiling drips */
function drawMossDrips(g, rng, map) {
  g.fillStyle = 'rgba(105,150,90,0.5)';
  for (const [mx, my] of map.moss) {
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      g.arc(mx + rand(rng, -16, 16), my + rand(rng, -10, 10), rand(rng, 2.5, 6), 0, Math.PI * 2);
      g.fill();
    }
  }
  g.strokeStyle = 'rgba(130,160,170,0.6)';
  g.lineWidth = 1.6;
  for (const [dx, dy] of map.drips) {
    g.beginPath();
    g.moveTo(dx, dy); g.lineTo(dx, dy + rand(rng, 10, 20));
    g.stroke();
    g.beginPath();
    g.ellipse(dx, dy + rand(rng, 26, 34), 3, 1.6, 0, 0, Math.PI * 2);
    g.stroke();
  }
}

registerFeature(31, drawGoo);
registerFeature(47, drawMossDrips);
// pipe mouths live on the top layer so paint can never bury them
registerTopFeature(10, drawPipes);

/* plaza: a big riveted drain cover for the red button */
registerPlaza('drain', (g, rng, map, p) => {
  g.fillStyle = '#9aa39b';
  g.strokeStyle = INK;
  g.lineWidth = 2.2;
  g.beginPath(); g.arc(p.x, p.y, 34, 0, Math.PI * 2); g.fill(); g.stroke();
  g.lineWidth = 1.6;
  g.beginPath(); g.arc(p.x, p.y, 27, 0, Math.PI * 2); g.stroke();
  // grate slots
  g.lineWidth = 3;
  g.strokeStyle = '#4c554e';
  for (const k of [-14, -7, 0, 7, 14]) {
    const half = Math.sqrt(Math.max(0, 24 * 24 - k * k)) * 0.8;
    g.beginPath();
    g.moveTo(p.x + k, p.y - half);
    g.lineTo(p.x + k, p.y + half);
    g.stroke();
  }
});

/* ---------------- sewer obstacles ---------------- */

/* a cluster of chemical barrels, one leaking */
function drawVat(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const barrel = (bx, by, bw, bh, col) => {
    t.strokeStyle = INK;
    t.lineWidth = 2;
    t.fillStyle = col;
    t.beginPath(); t.roundRect(bx, by, bw, bh, 4); t.fill(); t.stroke();
    t.lineWidth = 1.4;
    t.beginPath();
    t.moveTo(bx, by + bh * 0.25); t.lineTo(bx + bw, by + bh * 0.25);
    t.moveTo(bx, by + bh * 0.72); t.lineTo(bx + bw, by + bh * 0.72);
    t.stroke();
  };
  barrel(x + 4, y + h * 0.25, w * 0.4, h * 0.7, '#8b93a5');
  barrel(x + w * 0.5, y + h * 0.32, w * 0.38, h * 0.63, '#57a05a');
  // one tipped on top, leaking goo
  t.save();
  t.translate(x + w * 0.42, y + h * 0.22);
  t.rotate(-0.5);
  barrel(-w * 0.18, -h * 0.16, w * 0.36, h * 0.32, '#79b95c');
  t.restore();
  t.fillStyle = 'rgba(121,185,92,0.75)';
  t.beginPath();
  t.ellipse(x + w * 0.32, y + h * 0.97, w * 0.2, 5, 0, 0, Math.PI * 2);
  t.fill();
  // hazard mark
  t.strokeStyle = '#3f7031';
  t.lineWidth = 1.6;
  t.beginPath(); t.arc(x + w * 0.69, y + h * 0.6, 7, 0, Math.PI * 2); t.stroke();
  t.beginPath();
  t.moveTo(x + w * 0.69, y + h * 0.6 - 6); t.lineTo(x + w * 0.69, y + h * 0.6 + 2);
  t.stroke();
  t.beginPath(); t.arc(x + w * 0.69, y + h * 0.6 + 4.6, 0.9, 0, Math.PI * 2); t.stroke();
}

/* a wall-mounted valve wheel on a pipe stub */
function drawValve(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  const cx = x + w / 2, cy = y + h / 2;
  // pipe stub
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#8b93a5';
  t.beginPath(); t.roundRect(x + 4, cy - h * 0.16, w - 8, h * 0.32, 6); t.fill(); t.stroke();
  t.lineWidth = 1.2;
  t.beginPath();
  t.moveTo(x + w * 0.2, cy - h * 0.16); t.lineTo(x + w * 0.2, cy + h * 0.16);
  t.moveTo(x + w * 0.8, cy - h * 0.16); t.lineTo(x + w * 0.8, cy + h * 0.16);
  t.stroke();
  // valve wheel
  t.strokeStyle = '#a83c14';
  t.lineWidth = 4;
  t.beginPath(); t.arc(cx, cy - h * 0.1, Math.min(w, h) * 0.26, 0, Math.PI * 2); t.stroke();
  t.lineWidth = 2.4;
  for (let k = 0; k < 3; k++) {
    const a = k / 3 * Math.PI * 2 + 0.5;
    t.beginPath();
    t.moveTo(cx, cy - h * 0.1);
    t.lineTo(cx + Math.cos(a) * Math.min(w, h) * 0.26, cy - h * 0.1 + Math.sin(a) * Math.min(w, h) * 0.26);
    t.stroke();
  }
  t.strokeStyle = INK;
  t.lineWidth = 1.6;
  t.beginPath(); t.arc(cx, cy - h * 0.1, 3, 0, Math.PI * 2); t.stroke();
}

/* a square support pillar */
function drawPillar(t, rng, b) {
  const { x, y, w, h } = b;
  wildsShadow(t, x, y, w, h);
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillStyle = '#b7bcb2';
  t.beginPath(); t.roundRect(x + 2, y + 2, w - 4, h - 4, 5); t.fill(); t.stroke();
  hatchRect(t, rng, x + 2, y + 2, w - 4, h - 4, 9);
  // moss at the foot + a crack
  t.fillStyle = 'rgba(105,150,90,0.55)';
  for (let i = 0; i < 5; i++) {
    t.beginPath();
    t.arc(x + rand(rng, 8, w - 8), y + h - rand(rng, 4, 12), rand(rng, 2.5, 5), 0, Math.PI * 2);
    t.fill();
  }
  t.strokeStyle = 'rgba(90,100,95,0.6)';
  t.lineWidth = 1.3;
  t.beginPath();
  t.moveTo(x + w * 0.3, y + 4);
  t.lineTo(x + w * 0.42, y + h * 0.3);
  t.lineTo(x + w * 0.34, y + h * 0.5);
  t.stroke();
}

registerObstacles({ vat: drawVat, valve: drawValve, pillar: drawPillar });
