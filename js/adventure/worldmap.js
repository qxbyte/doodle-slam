'use strict';

/* ============================================================
   Adventure UI — the world map select screen, the story card
   and the level-end card. The world map is one hand-drawn
   canvas: each level owns a region; cleared regions glow in
   full colour, the frontier region waves a GO flag, locked
   ones sit grey under hatching. Click a reachable region to
   read its story and set off.
   ============================================================ */

const WORLDMAP = {
  w: 920, h: 520,
  // ten regions snaking bottom row -> up the right -> top row
  regions: [
    { x: 115, y: 420, r: 58 },
    { x: 245, y: 385, r: 58 },
    { x: 375, y: 430, r: 58 },
    { x: 505, y: 385, r: 58 },
    { x: 655, y: 420, r: 58 },
    { x: 790, y: 320, r: 58 },
    { x: 690, y: 185, r: 58 },
    { x: 540, y: 130, r: 58 },
    { x: 385, y: 185, r: 58 },
    { x: 200, y: 145, r: 62 },
  ],
};

let storyLevel = 0;

function buildAdventureScreen() {
  drawWorldMap();
  $('#adv-hero').textContent = `${L('HERO')} · ${TEAMS[Adventure.team].name} ⇄`;
  $('#adv-continue').textContent =
    `${L('CONTINUE')} · ${L('LEVEL')} ${Adventure.lastLevel() + 1}`;
}

function drawWorldMap() {
  const cv = $('#worldmap');
  cv.width = WORLDMAP.w * 2;    // 2x backing = crisp on retina
  cv.height = WORLDMAP.h * 2;
  const c = cv.getContext('2d');
  c.scale(2, 2);
  const rng = makeRng(777);
  const W = WORLDMAP.w, H = WORLDMAP.h;

  withDefaultPalette(() => {
    // parchment
    c.fillStyle = '#f4efe2';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = INK;
    c.lineWidth = 3;
    wobblyRect(c, rng, 10, 10, W - 20, H - 20, 2);
    c.stroke();
    c.lineWidth = 1.2;
    wobblyRect(c, rng, 20, 20, W - 40, H - 40, 1.4);
    c.stroke();
    // sea scribbles in the corners
    c.strokeStyle = INK_LIGHT;
    c.lineWidth = 1.2;
    for (const [wx, wy] of [[70, 80], [W - 90, 90], [90, H - 70], [W - 70, H - 90], [W / 2, H - 46]]) {
      for (let k = 0; k < 3; k++) {
        c.beginPath();
        c.moveTo(wx - 22, wy + k * 7);
        c.quadraticCurveTo(wx - 11, wy + k * 7 - 5, wx, wy + k * 7);
        c.quadraticCurveTo(wx + 11, wy + k * 7 + 5, wx + 22, wy + k * 7);
        c.stroke();
      }
    }
    // compass rose
    c.strokeStyle = INK;
    c.lineWidth = 1.6;
    wobblyCircle(c, rng, W - 80, 78, 30, 0.03);
    c.stroke();
    c.beginPath();
    for (let k = 0; k < 8; k++) {
      const a = k * Math.PI / 4;
      c.moveTo(W - 80 + Math.cos(a) * 10, 78 + Math.sin(a) * 10);
      c.lineTo(W - 80 + Math.cos(a) * (k % 2 ? 20 : 30), 78 + Math.sin(a) * (k % 2 ? 20 : 30));
    }
    c.stroke();
    c.fillStyle = INK;
    c.font = "16px 'Patrick Hand', cursive";
    c.textAlign = 'center';
    c.fillText('N', W - 80, 40);
    // title
    c.font = "italic 900 21px 'Archivo', sans-serif";
    c.textAlign = 'left';
    c.fillText(L('CHAPTER ONE · THE GREY'), 34, 52);

    // the dashed route: entrance arrow -> every region in order
    const pts = [{ x: 42, y: 470 }, ...WORLDMAP.regions];
    c.strokeStyle = INK_LIGHT;
    c.lineWidth = 2.4;
    c.setLineDash([10, 9]);
    c.beginPath();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const mx = (a.x + b.x) / 2 + (i % 2 ? 16 : -16);
      const my = (a.y + b.y) / 2 + (i % 2 ? -12 : 12);
      if (i === 0) c.moveTo(a.x, a.y);
      c.quadraticCurveTo(mx, my, b.x, b.y);
    }
    c.stroke();
    c.setLineDash([]);
    // the START arrow at the entrance
    c.fillStyle = '#e6392a';
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(52, 462); c.lineTo(30, 452); c.lineTo(36, 466); c.lineTo(26, 478);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = INK;
    c.font = "14px 'Patrick Hand', cursive";
    c.textAlign = 'center';
    c.fillText('START', 46, 500);

    // regions
    ADV_LEVELS.forEach((lvl, i) => {
      drawWorldRegion(c, rng, WORLDMAP.regions[i], lvl, i);
    });
  });
}

function drawWorldRegion(c, rng, reg, lvl, i) {
  const lit = Adventure.clearedLevel(i);
  const reachable = Adventure.unlocked(i);
  const { x, y, r } = reg;

  // the landmass blob
  c.save();
  c.beginPath();
  for (let k = 0; k <= 26; k++) {
    const a = (k / 26) * Math.PI * 2;
    const rr = r * (1 + Math.sin(a * 3 + i * 2) * 0.09 + rand(rng, -0.02, 0.02));
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.78;
    k === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
  }
  c.closePath();
  c.fillStyle = lit
    ? ['#dbe7fb', '#e2f0dd', '#fbe9d9'][i % 3]
    : reachable ? '#f6f3ea' : '#e4e2da';
  c.fill();
  c.strokeStyle = INK;
  c.lineWidth = 2.4;
  c.stroke();
  c.clip();
  if (!reachable) {
    hatchRect(c, rng, x - r, y - r, r * 2, r * 2, 9);   // fogged out
  }
  if (lit) {
    // colour splats celebrate a saved region
    const cols = ['#2f66e0', '#e6392a', '#f0b41c', '#3ba24f'];
    for (let k = 0; k < 5; k++) {
      drawSplat(c, rng, x + rand(rng, -r * 0.55, r * 0.55), y + rand(rng, -r * 0.4, r * 0.4),
                rand(rng, 12, 22), cols[k % 4]);
    }
  }
  c.restore();

  // the region's signature doodle (scaled to the small map tiles)
  c.strokeStyle = lit || reachable ? INK : INK_LIGHT;
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.lineWidth = 1.6;
  const g = lvl.region;
  if (g === 'city') {
    for (const [bx, bw, bh] of [[-24, 14, 20], [-6, 16, 30], [14, 13, 17]]) {
      c.fillRect(x + bx, y - bh + 8, bw, bh);
      c.strokeRect(x + bx, y - bh + 8, bw, bh);
    }
  } else if (g === 'river') {
    c.strokeStyle = '#6e96af';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(x - 30, y - 12);
    c.quadraticCurveTo(x - 6, y + 4, x + 8, y - 6);
    c.quadraticCurveTo(x + 22, y - 14, x + 32, y - 2);
    c.stroke();
    c.strokeStyle = lit || reachable ? INK : INK_LIGHT;
    c.lineWidth = 1.6;
    c.beginPath(); c.arc(x + 2, y - 4, 12, Math.PI, 0); c.stroke();
    c.beginPath();
    c.moveTo(x - 10, y - 4); c.lineTo(x - 10, y + 4);
    c.moveTo(x + 14, y - 4); c.lineTo(x + 14, y + 4);
    c.stroke();
  } else if (g === 'fair') {
    wobblyCircle(c, rng, x, y - 4, 16, 0.04);
    c.stroke();
    c.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      c.moveTo(x, y - 4);
      c.lineTo(x + Math.cos(a) * 16, y - 4 + Math.sin(a) * 16);
    }
    c.stroke();
    c.beginPath();
    c.moveTo(x - 10, y + 18); c.lineTo(x, y - 4); c.lineTo(x + 10, y + 18);
    c.stroke();
  } else if (g === 'pines') {
    for (const [px, sc] of [[-18, 0.62], [2, 0.8], [20, 0.55]]) {
      c.beginPath();
      c.moveTo(x + px - 16 * sc, y + 18 * sc);
      c.lineTo(x + px, y - 26 * sc);
      c.lineTo(x + px + 16 * sc, y + 18 * sc);
      c.closePath();
      c.fill(); c.stroke();
    }
  } else if (g === 'ferns') {
    c.fillStyle = '#c98a8a';
    c.beginPath(); c.arc(x, y - 4, 15, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#fdfdf8';
    c.fillRect(x - 4, y - 4, 8, 14);
    c.strokeRect(x - 4, y - 4, 8, 14);
    for (const [dx2, dy2] of [[-8, -10], [2, -14], [8, -8]]) {
      c.beginPath(); c.arc(x + dx2, y + dy2, 2, 0, Math.PI * 2); c.fill(); c.stroke();
    }
  } else if (g === 'peaks') {
    for (const [px, sc] of [[-12, 1], [14, 0.75]]) {
      c.beginPath();
      c.moveTo(x + px - 20 * sc, y + 16 * sc);
      c.lineTo(x + px, y - 20 * sc);
      c.lineTo(x + px + 20 * sc, y + 16 * sc);
      c.closePath();
      c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(x + px - 6 * sc, y - 8 * sc);
      c.lineTo(x + px, y - 20 * sc);
      c.lineTo(x + px + 6 * sc, y - 8 * sc);
      c.closePath();
      c.fillStyle = '#fdfdf8';
      c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)';
    }
  } else if (g === 'shore') {
    c.fillStyle = '#fdfdf8';
    c.beginPath();
    c.moveTo(x - 7, y + 14); c.lineTo(x - 4, y - 16); c.lineTo(x + 4, y - 16); c.lineTo(x + 7, y + 14);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#e6392a';
    for (const sy2 of [-10, 0]) c.fillRect(x - 5, y + sy2, 10, 5);
    c.strokeRect(x - 6, y - 22, 12, 7);
  } else if (g === 'desk') {
    c.save();
    c.translate(x, y);
    c.rotate(-0.5);
    c.fillStyle = '#f0b41c';
    c.fillRect(-20, -6, 32, 12);
    c.strokeRect(-20, -6, 32, 12);
    c.beginPath();
    c.moveTo(12, -6); c.lineTo(22, 0); c.lineTo(12, 6);
    c.closePath();
    c.fillStyle = '#e8d5a4';
    c.fill(); c.stroke();
    c.restore();
  } else if (g === 'moon') {
    c.fillStyle = '#e8e4c8';
    c.beginPath(); c.arc(x, y - 2, 15, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 1.2;
    c.beginPath(); c.arc(x - 5, y - 6, 3.4, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(x + 5, y + 2, 2.4, 0, Math.PI * 2); c.stroke();
    c.lineWidth = 1.6;
  } else {
    // the volcano
    c.fillStyle = '#8d7d72';
    c.beginPath();
    c.moveTo(x - 20, y + 14); c.lineTo(x - 6, y - 12); c.lineTo(x + 6, y - 12); c.lineTo(x + 20, y + 14);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ee7434';
    c.beginPath(); c.ellipse(x, y - 12, 6, 2.4, 0, 0, Math.PI * 2); c.fill();
    c.strokeStyle = 'rgba(120,110,105,0.6)';
    c.beginPath(); c.arc(x - 2, y - 22, 5, 0.4, Math.PI * 1.5); c.stroke();
  }

  // name plate + state
  c.fillStyle = '#fdfdf8';
  c.strokeStyle = INK;
  c.lineWidth = 1.8;
  const label = `${i + 1} · ${lvl.name}`;
  c.font = "italic 900 10.5px 'Archivo', sans-serif";
  const tw = c.measureText(label).width + 20;
  c.beginPath(); c.roundRect(x - tw / 2, y + r * 0.86 - 10, tw, 20, 10); c.fill(); c.stroke();
  c.fillStyle = reachable ? INK : '#a5a5a0';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, x, y + r * 0.86 + 1);

  if (lit) {
    // a proud little flag
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(x + r * 0.55, y - r * 0.5); c.lineTo(x + r * 0.55, y - r * 0.5 - 30); c.stroke();
    c.fillStyle = '#3ba24f';
    c.beginPath();
    c.moveTo(x + r * 0.55, y - r * 0.5 - 30);
    c.lineTo(x + r * 0.55 + 20, y - r * 0.5 - 24);
    c.lineTo(x + r * 0.55, y - r * 0.5 - 18);
    c.closePath();
    c.fill(); c.stroke();
  } else if (reachable) {
    // GO! marker bouncing on the frontier
    c.fillStyle = '#e6392a';
    c.strokeStyle = INK;
    c.lineWidth = 1.8;
    c.beginPath(); c.roundRect(x - 20, y - r - 22, 40, 22, 11); c.fill(); c.stroke();
    c.fillStyle = '#fff';
    c.font = "italic 900 12px 'Archivo', sans-serif";
    c.fillText('GO!', x, y - r - 11);
  } else {
    c.fillStyle = '#8a8a86';
    c.font = "15px 'Patrick Hand', cursive";
    c.fillText('🔒', x, y - r * 0.7);
  }
}

/* click a reachable region to read its story */
function initWorldMapClicks() {
  $('#worldmap').addEventListener('click', e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * WORLDMAP.w;
    const my = (e.clientY - rect.top) / rect.height * WORLDMAP.h;
    WORLDMAP.regions.forEach((reg, i) => {
      if (dist(mx, my, reg.x, reg.y) < reg.r && Adventure.unlocked(i)) {
        SFX.play('click');
        showStory(i);
      }
    });
  });
}

/* the story card shown before a level begins */
function showStory(idx) {
  storyLevel = idx;
  const lvl = ADV_LEVELS[idx];
  $('#level-end-panel').classList.add('hidden');
  $('#screen-adventure').classList.add('hidden');
  $('#story-title').textContent = `${L('LEVEL')} ${idx + 1} · ${lvl.name}`;
  $('#story-text').textContent = L(lvl.intro);
  const cv = $('#story-portrait');
  const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.clearRect(0, 0, cv.width, cv.height);
  c.scale(2, 2);
  withDefaultPalette(() => drawCharacter(c, Adventure.team, 50, 48, { scale: 2.2, pose: 'run' }));
  $('#story-panel').classList.remove('hidden');
}

/* level cleared / failed card */
function showLevelEnd(win) {
  const idx = game.adv.level;
  const lvl = ADV_LEVELS[idx];
  const last = idx >= ADV_LEVELS.length - 1;
  $('#level-end-title').textContent = win ? L('LEVEL CLEAR!') : L('LEVEL FAILED');
  $('#level-end-story').textContent =
    win ? L(lvl.outro) : L('The grey wins this round… try again!');
  $('#level-next').classList.toggle('hidden', !(win && !last));
  $('#level-retry').classList.toggle('hidden', win);
  $('#level-end-panel').classList.remove('hidden');
}
