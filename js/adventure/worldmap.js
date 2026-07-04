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
  regions: [
    { x: 200, y: 360, r: 100 },   // the city
    { x: 470, y: 170, r: 100 },   // the pines
    { x: 750, y: 370, r: 100 },   // the fair
  ],
};

let storyLevel = 0;

function buildAdventureScreen() {
  // hero chips — SPLASH by default, any fighter selectable
  const chips = $('#adv-heroes');
  chips.innerHTML = '';
  for (const team of TEAMS) {
    const chip = document.createElement('button');
    chip.className = 'adv-hero' + (Adventure.team === team.id ? ' selected' : '');
    const cv = document.createElement('canvas');
    cv.width = 96; cv.height = 84;
    cv.style.width = '48px';
    cv.style.height = '42px';
    const c = cv.getContext('2d');
    c.scale(2.4, 2.4);
    withDefaultPalette(() => drawCharacter(c, team.id, 20, 19, { scale: 0.95, pose: 'run' }));
    chip.appendChild(cv);
    chip.insertAdjacentHTML('beforeend',
      `<span class="ah-name" style="color:${team.color}">${team.name}</span>`);
    chip.addEventListener('click', () => {
      Adventure.team = team.id;
      buildAdventureScreen();
    });
    chips.appendChild(chip);
  }

  drawWorldMap();
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

    // the dashed route: entrance arrow -> region -> region -> region
    const pts = [{ x: 56, y: 452 }, ...WORLDMAP.regions];
    c.strokeStyle = INK_LIGHT;
    c.lineWidth = 2.4;
    c.setLineDash([12, 10]);
    c.beginPath();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const mx = (a.x + b.x) / 2 + (i % 2 ? 40 : -40);
      const my = (a.y + b.y) / 2 + (i % 2 ? -30 : 30);
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
    c.moveTo(66, 444); c.lineTo(44, 434); c.lineTo(50, 448); c.lineTo(40, 460);
    c.closePath();
    c.fill(); c.stroke();
    c.fillStyle = INK;
    c.font = "15px 'Patrick Hand', cursive";
    c.textAlign = 'center';
    c.fillText('START', 56, 484);

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

  // the region's signature doodle
  c.strokeStyle = lit || reachable ? INK : INK_LIGHT;
  c.fillStyle = 'rgba(255,255,255,0.5)';
  c.lineWidth = 1.8;
  if (lvl.region === 'city') {
    for (const [bx, bw, bh] of [[-38, 24, 34], [-8, 26, 48], [24, 22, 28]]) {
      c.fillRect(x + bx, y - bh + 14, bw, bh);
      wobblyRect(c, rng, x + bx, y - bh + 14, bw, bh, 1);
      c.stroke();
      for (let wy = y - bh + 20; wy < y + 6; wy += 11) {
        c.strokeRect(x + bx + 5, wy, 5, 6);
        c.strokeRect(x + bx + 14, wy, 5, 6);
      }
    }
  } else if (lvl.region === 'pines') {
    for (const [px, s] of [[-30, 0.9], [2, 1.15], [32, 0.8]]) {
      c.beginPath();
      c.moveTo(x + px - 16 * s, y + 18 * s);
      c.lineTo(x + px, y - 26 * s);
      c.lineTo(x + px + 16 * s, y + 18 * s);
      c.closePath();
      c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(x + px, y + 18 * s); c.lineTo(x + px, y + 26 * s);
      c.stroke();
    }
  } else {
    // the fair: a little ferris wheel
    wobblyCircle(c, rng, x, y - 6, 26, 0.04);
    c.stroke();
    c.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = k * Math.PI / 3;
      c.moveTo(x, y - 6);
      c.lineTo(x + Math.cos(a) * 26, y - 6 + Math.sin(a) * 26);
    }
    c.stroke();
    c.beginPath();
    c.moveTo(x - 16, y + 30); c.lineTo(x, y - 6); c.lineTo(x + 16, y + 30);
    c.stroke();
  }

  // name plate + state
  c.fillStyle = '#fdfdf8';
  c.strokeStyle = INK;
  c.lineWidth = 1.8;
  const label = `${i + 1} · ${lvl.name}`;
  c.font = "italic 900 13px 'Archivo', sans-serif";
  const tw = c.measureText(label).width + 20;
  c.beginPath(); c.roundRect(x - tw / 2, y + r * 0.78 - 12, tw, 24, 12); c.fill(); c.stroke();
  c.fillStyle = reachable ? INK : '#a5a5a0';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, x, y + r * 0.78 + 1);

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
    c.beginPath(); c.roundRect(x - 24, y - r * 0.95 - 14, 48, 26, 13); c.fill(); c.stroke();
    c.fillStyle = '#fff';
    c.font = "italic 900 14px 'Archivo', sans-serif";
    c.fillText('GO!', x, y - r * 0.95 - 1);
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
