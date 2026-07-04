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

/* DOM writes happen only when a displayed value actually changed —
   style/text churn every frame forces needless style recalcs */
const hudCache = {};
function hudSet(key, val, apply) {
  if (hudCache[key] === val) return;
  hudCache[key] = val;
  apply(val);
}

function updateHUD(game) {
  // timer
  hudSet('timer', formatTime(game.timeLeft), v => { ui.timer.textContent = v; });
  hudSet('urgent', game.timeLeft <= 30, v => ui.timer.classList.toggle('urgent', v));

  // score panel adapts to the match mode
  const mode = currentMode();
  hudSet('panel', L(mode.panel), v => { $('#panel-title').textContent = v; });
  const scores = mode.scores(game);
  const top = Math.max(1, ...scores);
  for (let i = 0; i < 4; i++) {
    const w = mode.key === 'turf'
      ? Math.min(100, scores[i] * 2.4)
      : (scores[i] / top) * 100;
    hudSet(`cw${i}`, Math.round(w * 10), v => {
      ui.covRows[i].querySelector('.c-fill').style.width = `${v / 10}%`;
    });
    hudSet(`cp${i}`, mode.fmt(scores[i]), v => {
      ui.covRows[i].querySelector('.c-pct').textContent = v;
    });
  }

  // player bars + skill cooldown
  const p = game.player;
  hudSet('hp', Math.round(p.hp), v => { ui.hpFill.style.width = `${v}%`; });
  hudSet('ink', Math.round(p.ink), v => { ui.inkFill.style.width = `${v}%`; });
  hudSet('bombs', p.bombs, v => {
    ui.bombCount.textContent = v;
    ui.bombHint.style.opacity = v > 0 ? 1 : 0.35;
  });
  hudSet('skill', p.skillCd > 0 ? Math.ceil(p.skillCd) : 0, v => {
    $('#skill-count').textContent = v > 0 ? `${v}s` : 'OK';
    $('#skill-hint').style.opacity = v > 0 ? 0.35 : 1;
  });
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
    `<b>${w.name}</b> &mdash; ` + L('{b} — Move faster and refill ink on your own paint.', { b: L(w.blurb) });
  $('#skill-name').textContent = SKILLS[teamId].name;
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

/* the minimap repaints ~7x/s — it walks the whole ownership grid,
   and at 176x118 css px nobody can tell 7Hz from 60Hz */
let minimapNextAt = 0;

function renderMinimap(game) {
  const now = performance.now();
  if (now < minimapNextAt) return;
  minimapNextAt = now + 150;
  const c = ui.minimapCtx;
  // 2x backing for retina; draw in logical 176x118 space
  c.setTransform(2, 0, 0, 2, 0, 0);
  const mw = ui.minimap.width / 2, mh = ui.minimap.height / 2;
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
  // ice, lava, water, then buildings
  c.fillStyle = 'rgba(165,210,235,0.55)';
  for (const r of ICE) {
    c.fillRect(r.x / WORLD.w * mw, r.y / WORLD.h * mh, r.w / WORLD.w * mw, r.h / WORLD.h * mh);
  }
  c.fillStyle = 'rgba(238,116,52,0.85)';
  for (const r of LAVA) {
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

  // the red button: live = pulsing dot, pending = ring + countdown
  const bx = game.button.x / WORLD.w * mw;
  const by = game.button.y / WORLD.h * mh;
  if (game.button.active) {
    const pulse = 3.2 + Math.sin(game.elapsed * 6) * 1;
    c.fillStyle = '#e6392a';
    c.strokeStyle = '#fdfdf8';
    c.lineWidth = 1.2;
    c.beginPath(); c.arc(bx, by, pulse, 0, Math.PI * 2); c.fill(); c.stroke();
  } else {
    const left = Math.ceil(game.button.nextAt - game.elapsed);
    if (left > 0 && game.timeLeft > left) {
      c.strokeStyle = 'rgba(230,57,42,0.9)';
      c.lineWidth = 1.2;
      c.setLineDash([2.5, 2.5]);
      c.beginPath(); c.arc(bx, by, 4, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.font = "800 8px 'Nunito', sans-serif";
      c.textAlign = bx > mw - 24 ? 'right' : 'left';
      c.textBaseline = 'middle';
      const tx = bx > mw - 24 ? bx - 6 : bx + 6;
      c.strokeStyle = 'rgba(253,253,248,0.9)';
      c.lineWidth = 2.5;
      c.strokeText(`${left}s`, tx, by);
      c.fillStyle = '#a8231a';
      c.fillText(`${left}s`, tx, by);
    }
  }
}
