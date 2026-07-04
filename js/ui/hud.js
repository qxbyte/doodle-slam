'use strict';

/* ============================================================
   In-match HUD: coverage panel, timer, toast feed, status
   bars and the minimap.
   ============================================================ */

const $ = sel => document.querySelector(sel);

const ui = {
  hud: null, covRows: null, timer: null, feed: null,
  hpFill: null, inkFill: null, bombCount: null, bombHint: null,
  minimap: null, minimapCtx: null,
};

function initHUD() {
  ui.hud = $('#hud');
  ui.timer = $('#timer');
  ui.feed = $('#feed');
  ui.hpFill = $('#hp-fill');
  ui.inkFill = $('#ink-fill');
  ui.bombCount = $('#bomb-count');
  ui.bombHint = $('#bomb-hint');
  ui.minimap = $('#minimap');
  ui.minimapCtx = ui.minimap.getContext('2d');

  // coverage rows, one per team
  const wrap = $('#coverage-panel .cov-rows');
  wrap.innerHTML = '';
  for (const team of TEAMS) {
    const row = document.createElement('div');
    row.className = 'cov-row';
    row.innerHTML = `
      <div class="c-bar"><div class="c-fill" style="background:${team.color}"></div></div>
      <div class="c-pct" style="color:${team.dark}">0.0%</div>`;
    wrap.appendChild(row);
  }
  ui.covRows = [...wrap.querySelectorAll('.cov-row')];
}

function updateHUD(game) {
  // timer
  ui.timer.textContent = formatTime(game.timeLeft);
  ui.timer.classList.toggle('urgent', game.timeLeft <= 30);

  // coverage
  const cov = game.lastCoverage;
  for (let i = 0; i < 4; i++) {
    const pct = cov[i] * 100;
    ui.covRows[i].querySelector('.c-fill').style.width = `${Math.min(100, pct * 2.4)}%`;
    ui.covRows[i].querySelector('.c-pct').textContent = `${pct.toFixed(1)}%`;
  }

  // player bars
  const p = game.player;
  ui.hpFill.style.width = `${p.hp}%`;
  ui.inkFill.style.width = `${p.ink}%`;
  ui.bombCount.textContent = p.bombs;
  ui.bombHint.style.opacity = p.bombs > 0 ? 1 : 0.35;
}

/* red vignette pulse when the player takes damage */
let hurtTimeout = null;
function flashHurt() {
  const el = $('#hurt-flash');
  el.classList.add('on');
  clearTimeout(hurtTimeout);
  hurtTimeout = setTimeout(() => el.classList.remove('on'), 160);
}

/* the status panel names the selected fighter's weapon */
function setWeaponNote(teamId) {
  const w = WEAPONS[teamId];
  $('#weapon-note').innerHTML =
    `<b>${w.name}</b> &mdash; ${w.blurb}. Move faster and refill ink on your own paint.`;
}

/* big centre banner when SLAM TIME hits */
function showSlamBanner() {
  const el = $('#slam-banner');
  el.classList.remove('show');
  void el.offsetWidth;   // restart the animation
  el.classList.add('show');
}

function pushToast(text, kind = '') {
  if (typeof game !== 'undefined' && game.demo) return;   // attract mode is silent
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.textContent = text;
  ui.feed.prepend(el);
  while (ui.feed.children.length > 4) ui.feed.lastChild.remove();
  setTimeout(() => { el.classList.add('out'); }, 3600);
  setTimeout(() => { el.remove(); }, 4200);
}

function renderMinimap(game) {
  const c = ui.minimapCtx;
  const mw = ui.minimap.width, mh = ui.minimap.height;
  const sx = mw / GRID_W, sy = mh / GRID_H;
  c.fillStyle = '#fdfdfa';
  c.fillRect(0, 0, mw, mh);

  // paint cells
  for (let gy = 0; gy < GRID_H; gy++) {
    for (let gx = 0; gx < GRID_W; gx++) {
      const v = grid[gy * GRID_W + gx];
      if (v >= 0) {
        c.fillStyle = TEAMS[v].color;
        c.fillRect(gx * sx, gy * sy, sx + 0.5, sy + 0.5);
      }
    }
  }
  // ice, water, then buildings
  c.fillStyle = 'rgba(165,210,235,0.55)';
  for (const r of ICE) {
    c.fillRect(r.x / WORLD.w * mw, r.y / WORLD.h * mh, r.w / WORLD.w * mw, r.h / WORLD.h * mh);
  }
  c.fillStyle = 'rgba(110,150,175,0.5)';
  for (const w of WATER) {
    c.fillRect(w.x / WORLD.w * mw, w.y / WORLD.h * mh, w.w / WORLD.w * mw, w.h / WORLD.h * mh);
  }
  c.fillStyle = '#b9b9b2';
  for (const b of BUILDINGS) {
    c.fillRect(b.x / WORLD.w * mw, b.y / WORLD.h * mh, b.w / WORLD.w * mw, b.h / WORLD.h * mh);
  }
  // current camera viewport
  c.strokeStyle = '#1c1c1a';
  c.lineWidth = 1.5;
  c.strokeRect(
    cam.x / WORLD.w * mw + 0.75,
    cam.y / WORLD.h * mh + 0.75,
    Math.min(innerWidth / cam.zoom, WORLD.w) / WORLD.w * mw - 1.5,
    Math.min(innerHeight / cam.zoom, WORLD.h) / WORLD.h * mh - 1.5
  );

  // fighters
  for (const f of game.fighters) {
    if (!f.alive) continue;
    c.strokeStyle = '#1c1c1a';
    c.lineWidth = 1;
    c.fillStyle = TEAMS[f.team].color;
    c.beginPath();
    c.arc(f.x / WORLD.w * mw, f.y / WORLD.h * mh, f.isPlayer ? 3.4 : 2.6, 0, Math.PI * 2);
    c.fill(); c.stroke();
  }
}
