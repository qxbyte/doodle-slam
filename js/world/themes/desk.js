'use strict';

/* ============================================================
   Desk theme: wood-grain ground, washi-tape roads, homework
   sheets, coffee rings, paperclips, shavings, spilled-ink
   plaza, stationery obstacles.
   ============================================================ */

registerGround('desk', (g, rng, map) => {

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
});

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

registerRoadStyle('tape', drawTapeRoads);

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

registerFeature(10, drawPapers);
registerFeature(12, drawRings);
registerFeature(50, drawClips);
registerFeature(51, drawShavings);

registerPlaza('ink', (g, rng, map, p) => {

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
});

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

registerObstacles({
  eraser: drawEraser, pencilcase: drawPencilcase, mug: drawMug,
  stapler: drawStapler, pencil: drawPencil, ruler: drawRuler,
  sharpener: drawSharpener, notepad: drawNotepad,
});
