'use strict';

/* ============================================================
   Full-screen menus: title, map select, fighter select, results.
   ============================================================ */

const SCREEN_IDS = ['#screen-title', '#screen-adventure', '#screen-stages', '#screen-maps', '#screen-select', '#screen-results'];

function showScreen(id) {
  for (const s of SCREEN_IDS) {
    $(s).classList.toggle('hidden', s !== id);
  }
  ui.hud.classList.toggle('hidden', id !== null);
}

/* ---------------- stage select ---------------- */

function buildStageCards() {
  const wrap = $('#stage-cards');
  wrap.innerHTML = '';
  STAGES.forEach((stage, i) => {
    const card = document.createElement('button');
    card.className = 'stage-card';
    card.dataset.stage = i;
    const cv = document.createElement('canvas');
    cv.width = 464; cv.height = 300;          // 2x backing = crisp on retina
    drawStageVignette(cv, stage.vignette);
    card.appendChild(cv);
    const prog = Campaign.stageStars(i);
    const locked = !Campaign.stageUnlocked(i);
    if (locked) card.classList.add('locked');
    card.insertAdjacentHTML('beforeend', `
      <div class="s-label">${stage.label}<span class="s-stars">★ ${prog.got}/${prog.total}</span></div>
      <div class="s-name">${stage.name}</div>
      <div class="s-desc">${locked ? L('Locked — earn a star in the previous stage.') : L(stage.desc)}</div>
      ${locked ? '<div class="s-lock">🔒</div>' : ''}`);
    wrap.appendChild(card);
  });
}

/* Each stage gets one signature doodle, drawn with the sketch kit */
function drawStageVignette(cv, kind) {
  withDefaultPalette(() => drawStageVignetteInner(cv, kind));
}

function drawStageVignetteInner(cv, kind) {
  const c = cv.getContext('2d');
  const rng = makeRng(VIGNETTE_SEEDS[kind] || 99);
  const dims = { width: 232, height: 150 };   // logical space the art targets
  c.scale(cv.width / dims.width, cv.height / dims.height);
  c.fillStyle = VIGNETTE_BG[kind] || PAPER;
  c.fillRect(0, 0, dims.width, dims.height);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = INK;
  (VIGNETTES[kind] || VIGNETTES.city)(c, rng, dims);
}

/* Clicking blank paper on the stage screen bursts a paint splat —
   the same language as in-game shot impacts */
function attachSplatFX(screenEl) {
  screenEl.addEventListener('click', e => {
    if (e.target.closest('button')) return;   // cards & BACK keep their job
    const rng = makeRng((Math.random() * 1e9) | 0);
    const team = TEAMS[(Math.random() * TEAMS.length) | 0];
    const size = 120 + Math.random() * 90;
    const cv = document.createElement('canvas');
    cv.className = 'fx-splat';
    cv.width = size * 2; cv.height = size * 2;
    cv.style.left = `${e.clientX - size}px`;
    cv.style.top = `${e.clientY - size}px`;
    cv.style.width = `${size * 2}px`;
    cv.style.height = `${size * 2}px`;
    drawSplat(cv.getContext('2d'), rng, size, size, size * 0.4, team.color);
    screenEl.appendChild(cv);
    SFX.play('uiSplat');
    setTimeout(() => cv.remove(), 900);
  });
}

/* drag (or vertical-wheel) to scroll the journey line sideways;
   a real drag swallows the click so cards don't mis-fire */
function attachDragScroll(el) {
  let down = false, startX = 0, startLeft = 0, moved = 0;
  el.addEventListener('mousedown', e => {
    down = true; moved = 0;
    startX = e.clientX; startLeft = el.scrollLeft;
  });
  addEventListener('mousemove', e => {
    if (!down) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    el.scrollLeft = startLeft - dx;
  });
  addEventListener('mouseup', () => { down = false; });
  el.addEventListener('click', e => {
    if (moved > 6) {
      e.stopPropagation();
      e.preventDefault();
      moved = 0;
    }
  }, true);
  el.addEventListener('wheel', e => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
}

/* ---------------- map select (filtered by stage) ---------------- */

function buildMapCards(stageIdx = null) {
  const wrap = $('#map-cards');
  wrap.innerHTML = '';
  MAPS.forEach((map, i) => {
    if (stageIdx !== null && map.stage !== stageIdx) return;
    const card = document.createElement('button');
    card.className = 'map-card';
    card.dataset.map = i;
    const cv = document.createElement('canvas');
    cv.width = 528; cv.height = 352;          // 2x backing = crisp on retina
    drawMapPreview(cv, map);
    card.appendChild(cv);
    const stars = Campaign.stars(map.name);
    const chs = Campaign.descs(map.name);
    card.insertAdjacentHTML('beforeend', `
      <div class="m-name">${map.name} <span class="m-stars">${stars.map(s => s ? '★' : '☆').join('')}</span></div>
      <div class="m-desc">${L(map.desc)}</div>
      <ul class="m-ch">${chs.map((d, k) =>
        `<li class="${stars[k] ? 'done' : ''}">${stars[k] ? '★' : '☆'} ${d}</li>`).join('')}</ul>`);
    wrap.appendChild(card);
  });
}

/* Schematic thumbnail drawn straight from the map data */
function drawMapPreview(cv, map) {
  withDefaultPalette(() => drawMapPreviewInner(cv, map));
}

function drawMapPreviewInner(cv, map) {
  const c = cv.getContext('2d');
  const sx = cv.width / WORLD.w, sy = cv.height / WORLD.h;
  c.clearRect(0, 0, cv.width, cv.height);
  c.fillStyle = { desk: '#eedfcf', moon: '#e9edef', sand: '#f2e7cf', snow: '#f4f7f9', chalk: '#2c3b35', seabed: '#dcebf0', ash: '#e8e2da', sewer: '#e5e9e2' }[map.ground] || '#f0efe9';
  c.fillRect(0, 0, cv.width, cv.height);
  // frozen lakes + current lanes + lava pools
  c.fillStyle = 'rgba(165,210,235,0.55)';
  for (const r of map.ice) c.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
  c.fillStyle = 'rgba(120,185,215,0.5)';
  for (const r of map.currents) c.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
  c.fillStyle = 'rgba(238,116,52,0.8)';
  for (const r of map.lava) c.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
  // warp pipe pairs
  c.fillStyle = 'rgba(87,160,90,0.9)';
  for (const pp of map.pipes) {
    for (const [px, py] of [[pp.ax, pp.ay], [pp.bx, pp.by]]) {
      c.beginPath();
      c.arc(px * sx, py * sy, 3, 0, Math.PI * 2);
      c.fill();
    }
  }
  // craters read as terrain on the moon preview
  c.strokeStyle = 'rgba(90,98,110,0.5)';
  c.lineWidth = 1;
  for (const [kx, ky, kr] of map.craters) {
    c.beginPath();
    c.arc(kx * sx, ky * sy, kr * sx, 0, Math.PI * 2);
    c.stroke();
  }

  // roads
  c.strokeStyle = '#dedcd4';
  for (const r of map.roads) {
    c.lineWidth = r.w * sx;
    c.beginPath();
    c.moveTo(r.x1 * sx, r.y1 * sy);
    c.lineTo(r.x2 * sx, r.y2 * sy);
    c.stroke();
  }
  // water + bridges (sewer water is goo)
  c.fillStyle = map.ground === 'sewer' ? 'rgba(121,185,92,0.7)' : 'rgba(110,150,175,0.45)';
  for (const w of map.water) c.fillRect(w.x * sx, w.y * sy, w.w * sx, w.h * sy);
  c.fillStyle = PAPER;
  for (const b of map.bridges) c.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
  // trees + pines
  c.fillStyle = 'rgba(120,120,116,0.35)';
  for (const [tx, ty] of map.trees) {
    c.beginPath();
    c.arc(tx * sx, ty * sy, 2.4, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = 'rgba(90,110,90,0.4)';
  for (const [px, py] of map.pines) {
    c.beginPath();
    c.moveTo(px * sx - 2.4, py * sy + 2.2);
    c.lineTo(px * sx, py * sy - 3);
    c.lineTo(px * sx + 2.4, py * sy + 2.2);
    c.closePath();
    c.fill();
  }
  // buildings
  const blockTint = map.ground === 'chalk' ? 'rgba(240,242,236,0.5)' : '#c6c4bc';
  for (const b of map.buildings) {
    c.fillStyle = blockTint;
    c.strokeStyle = '#8d8d88';
    c.lineWidth = 1;
    c.fillRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
    c.strokeRect(b.x * sx, b.y * sy, b.w * sx, b.h * sy);
  }
  // plaza ring (red button spot)
  c.strokeStyle = 'rgba(230,57,42,0.8)';
  c.lineWidth = 1.5;
  c.setLineDash([4, 4]);
  c.beginPath();
  c.arc(map.plaza.x * sx, map.plaza.y * sy, map.plaza.r * sx, 0, Math.PI * 2);
  c.stroke();
  c.setLineDash([]);
}

/* ---------------- fighter select ---------------- */

/* card canvases redrawn every frame while the select screen is up,
   so the fighters jog in place (see tickFighterCards) */
const fighterCardAnims = [];

function buildFighterCards() {
  const wrap = $('#fighter-cards');
  wrap.innerHTML = '';
  fighterCardAnims.length = 0;
  for (const team of TEAMS) {
    const card = document.createElement('button');
    card.className = 'fighter-card';
    card.dataset.team = team.id;
    card.style.borderBottomColor = team.color;
    const cv = document.createElement('canvas');
    cv.width = 240; cv.height = 220;          // 2x backing = crisp on retina
    cv.style.width = '120px';
    cv.style.height = '110px';
    const c = cv.getContext('2d');
    c.scale(5.2, 5.2);
    withDefaultPalette(() => drawCharacter(c, team.id, 23, 24, { pose: 'run' }));
    fighterCardAnims.push({ c, id: team.id });
    card.appendChild(cv);
    const w = WEAPONS[team.id];
    card.insertAdjacentHTML('beforeend', `
      <div class="f-name" style="color:${team.color}">${team.name}</div>
      <div class="f-weapon">${w.name}</div>
      <div class="f-desc">${L(team.desc)} ${(b => b[0].toUpperCase() + b.slice(1))(L(w.blurb))}.</div>`);
    wrap.appendChild(card);
  }
}

/* jog-in-place run cycle on the select cards; called from the main
   loop while game.state === 'select'. Phases offset per fighter so
   the four don't run in lockstep. */
function tickFighterCards(now) {
  for (const f of fighterCardAnims) {
    f.c.setTransform(1, 0, 0, 1, 0, 0);
    f.c.clearRect(0, 0, 240, 220);
    f.c.setTransform(5.2, 0, 0, 5.2, 0, 0);
    withDefaultPalette(() =>
      drawCharacter(f.c, f.id, 23, 24, { pose: 'run', walk: now / 1000 + f.id * 0.55 }));
  }
}

/* ---------------- badge wall ---------------- */

const BADGE_ACCENTS = ['#2f66e0', '#e6392a', '#f0b41c', '#3ba24f'];

/* one doodle rosette badge, 60x60 logical */
function drawBadge(c, def, unlocked, i) {
  const rng = makeRng(500 + i * 37);
  const cx = 30, cy = 27;
  const accent = unlocked ? BADGE_ACCENTS[i % 4] : '#c6c4bb';
  const ink = unlocked ? INK : INK_LIGHT;
  c.lineWidth = 1.6;
  c.strokeStyle = ink;
  c.lineJoin = 'round';
  // ribbon tails
  c.fillStyle = accent;
  c.beginPath();
  c.moveTo(cx - 9, cy + 12); c.lineTo(cx - 13, cy + 27); c.lineTo(cx - 6, cy + 22);
  c.closePath(); c.fill(); c.stroke();
  c.beginPath();
  c.moveTo(cx + 9, cy + 12); c.lineTo(cx + 13, cy + 27); c.lineTo(cx + 6, cy + 22);
  c.closePath(); c.fill(); c.stroke();
  // scalloped rosette
  c.beginPath();
  for (let k = 0; k <= 48; k++) {
    const a = (k / 48) * Math.PI * 2;
    const r = 19.5 + Math.cos(a * 12) * 2 + rand(rng, -0.3, 0.3);
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    k === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
  }
  c.closePath();
  c.fillStyle = accent;
  c.fill(); c.stroke();
  // paper core
  c.fillStyle = unlocked ? '#fdfdf8' : '#e7e5dd';
  c.beginPath(); c.arc(cx, cy, 13.5, 0, Math.PI * 2); c.fill(); c.stroke();
  // icon
  c.strokeStyle = ink;
  c.fillStyle = accent;
  c.lineWidth = 1.5;
  drawBadgeIcon(c, def.icon, cx, cy, accent, ink, rng);
}

function drawBadgeIcon(c, icon, x, y, accent, ink, rng) {
  const star = (sx, sy, r) => {
    c.beginPath();
    for (let k = 0; k < 10; k++) {
      const a = -Math.PI / 2 + k * Math.PI / 5;
      const rr = k % 2 ? r * 0.45 : r;
      const px = sx + Math.cos(a) * rr, py = sy + Math.sin(a) * rr;
      k === 0 ? c.moveTo(px, py) : c.lineTo(px, py);
    }
    c.closePath(); c.fill(); c.stroke();
  };
  switch (icon) {
    case 'splat':
      drawSplat(c, rng, x, y, 6.5, accent);
      break;
    case 'bolt':
      c.beginPath();
      c.moveTo(x + 2, y - 8); c.lineTo(x - 4, y + 1); c.lineTo(x - 0.5, y + 1);
      c.lineTo(x - 2, y + 8); c.lineTo(x + 4, y - 1); c.lineTo(x + 0.5, y - 1);
      c.closePath(); c.fill(); c.stroke();
      break;
    case 'crown':
      c.beginPath();
      c.moveTo(x - 7, y + 5); c.lineTo(x - 8, y - 4); c.lineTo(x - 3.5, y);
      c.lineTo(x, y - 7); c.lineTo(x + 3.5, y); c.lineTo(x + 8, y - 4);
      c.lineTo(x + 7, y + 5);
      c.closePath(); c.fill(); c.stroke();
      break;
    case 'flag':
      c.beginPath(); c.moveTo(x - 4, y + 9); c.lineTo(x - 4, y - 8); c.stroke();
      c.beginPath();
      c.moveTo(x - 4, y - 8); c.lineTo(x + 7, y - 5.5); c.lineTo(x - 4, y - 3);
      c.closePath(); c.fill(); c.stroke();
      break;
    case 'shield':
      c.beginPath();
      c.moveTo(x, y - 8); c.quadraticCurveTo(x + 8, y - 6, x + 7, y - 1);
      c.quadraticCurveTo(x + 6, y + 6, x, y + 9);
      c.quadraticCurveTo(x - 6, y + 6, x - 7, y - 1);
      c.quadraticCurveTo(x - 8, y - 6, x, y - 8);
      c.closePath(); c.fill(); c.stroke();
      break;
    case 'button':
      c.beginPath(); c.arc(x, y, 7, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fill(); c.stroke();
      break;
    case 'loop':
      c.beginPath(); c.arc(x, y, 6.5, -0.4, Math.PI * 1.3); c.stroke();
      c.beginPath();
      c.moveTo(x + 8.5, y - 5.5); c.lineTo(x + 5, y - 3); c.lineTo(x + 9, y - 0.5);
      c.closePath(); c.fill(); c.stroke();
      break;
    case 'star':
      star(x, y, 8);
      break;
    case 'stars':
      star(x - 4.5, y + 2.5, 4.5);
      star(x + 4.5, y + 2, 4);
      star(x + 0.5, y - 5, 5);
      break;
    case 'calendar':
      c.beginPath(); c.roundRect(x - 7, y - 6, 14, 13, 2); c.fill(); c.stroke();
      c.fillStyle = '#fdfdf8';
      c.beginPath(); c.roundRect(x - 5, y - 1, 10, 6, 1); c.fill();
      c.beginPath(); c.moveTo(x - 3.5, y - 8.5); c.lineTo(x - 3.5, y - 4.5);
      c.moveTo(x + 3.5, y - 8.5); c.lineTo(x + 3.5, y - 4.5); c.stroke();
      break;
    case 'pencil':
      c.save();
      c.translate(x, y); c.rotate(-0.75);
      c.beginPath(); c.roundRect(-2.5, -8, 5, 12, 1); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-2.5, 4); c.lineTo(0, 9); c.lineTo(2.5, 4);
      c.closePath(); c.fillStyle = '#e8d5a4'; c.fill(); c.stroke();
      c.restore();
      break;
    case 'trophy':
      c.beginPath();
      c.moveTo(x - 6, y - 7); c.lineTo(x + 6, y - 7);
      c.quadraticCurveTo(x + 6, y + 2, x, y + 3);
      c.quadraticCurveTo(x - 6, y + 2, x - 6, y - 7);
      c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.arc(x - 7.5, y - 4, 2.5, Math.PI * 0.5, Math.PI * 1.6); c.stroke();
      c.beginPath(); c.arc(x + 7.5, y - 4, 2.5, Math.PI * 1.4, Math.PI * 0.5); c.stroke();
      c.beginPath(); c.moveTo(x - 3, y + 7.5); c.lineTo(x + 3, y + 7.5);
      c.moveTo(x, y + 3); c.lineTo(x, y + 7.5); c.stroke();
      break;
    case 'door':
      c.beginPath();
      c.moveTo(x - 5.5, y + 9); c.lineTo(x - 5.5, y - 3);
      c.quadraticCurveTo(x, y - 10, x + 5.5, y - 3);
      c.lineTo(x + 5.5, y + 9);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#fdfdf8';
      c.beginPath(); c.arc(x + 2.8, y + 2.5, 1.3, 0, Math.PI * 2); c.fill();
      c.beginPath();
      c.moveTo(x - 9, y + 9); c.lineTo(x + 9, y + 9);
      c.stroke();
      break;
    case 'case':
      c.beginPath(); c.roundRect(x - 9, y - 5, 18, 11, 4); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(x - 9, y - 1.5); c.lineTo(x + 9, y - 1.5); c.stroke();
      c.fillStyle = '#fdfdf8';
      c.beginPath(); c.roundRect(x - 1.8, y - 1.2, 3.6, 5, 1.2); c.fill(); c.stroke();
      c.beginPath(); c.arc(x, y + 6.4, 2, 0, Math.PI * 2); c.stroke();
      break;
    case 'compass':
      c.beginPath(); c.arc(x, y - 6, 2.6, 0, Math.PI * 2); c.fill(); c.stroke();
      c.beginPath();
      c.moveTo(x - 1.8, y - 4); c.lineTo(x - 6, y + 9);
      c.moveTo(x + 1.8, y - 4); c.lineTo(x + 6, y + 9);
      c.stroke();
      c.beginPath(); c.arc(x, y + 3, 7, Math.PI * 0.32, Math.PI * 0.68); c.stroke();
      break;
  }
}

function buildBadgeWall() {
  const grid = $('#badge-grid');
  grid.innerHTML = '';
  Achieve.all().forEach((a, i) => {
    const item = document.createElement('div');
    item.className = 'badge-item' + (a.unlocked ? '' : ' locked');
    const cv = document.createElement('canvas');
    cv.width = 120; cv.height = 120;          // 2x backing = crisp on retina
    cv.style.width = '60px';
    cv.style.height = '60px';
    const c = cv.getContext('2d');
    c.scale(2, 2);
    withDefaultPalette(() => drawBadge(c, a, a.unlocked, i));
    item.appendChild(cv);
    item.insertAdjacentHTML('beforeend',
      `<div class="badge-name">${L(a.name)}</div><div class="badge-desc">${L(a.desc)}</div>`);
    grid.appendChild(item);
  });
  $('#badge-count').textContent = L('{got}/{total} unlocked', Achieve.count());
}

/* ---------------- title art ---------------- */

/* the paint burst the logo sits on */
function initTitleArt() {
  const cv = $('#logo-splat');
  cv.width = 1440; cv.height = 840;           // 2x backing = crisp on retina
  const c = cv.getContext('2d');
  const rng = makeRng(4242);
  c.scale(2, 2);
  const W = 720, H = 420;
  c.globalAlpha = 0.9;
  drawSplat(c, rng, W * 0.36, H * 0.40, 96, '#2f66e0');
  drawSplat(c, rng, W * 0.64, H * 0.62, 88, '#e6392a');
  c.globalAlpha = 0.85;
  drawSplat(c, rng, W * 0.74, H * 0.30, 46, '#f0b41c');
  drawSplat(c, rng, W * 0.24, H * 0.72, 40, '#3ba24f');
  c.globalAlpha = 1;
}

/* ---------------- title career line ---------------- */

function updateDailyButton() {
  const btn = $('#daily-btn');
  const best = Daily.best();
  btn.innerHTML = `${L('DAILY RUN')} &middot; ${MAPS[Daily.mapIdx()].name}` +
    (best !== null ? ` &middot; ${L('best {b}', { b: best.toFixed(1) })}` : '');
}

function updateTitleRecord() {
  const el = $('#title-record');
  const r = Records.get();
  if (!r.plays) { el.textContent = ''; return; }
  el.textContent =
    L('{p} matches · {w} wins · best turf {b}%', { p: r.plays, w: r.wins, b: r.best.toFixed(1) });
}

/* ---------------- results ---------------- */

function showResults(game) {
  const mode = currentMode();
  const scores = mode.scores(game);
  const order = [0, 1, 2, 3].sort((a, b) => scores[b] - scores[a]);
  const winner = TEAMS[order[0]];
  const playerWon = order[0] === game.player.team;

  $('#winner-line').innerHTML =
    `<span style="color:${winner.color}">${winner.name}</span> ${L(mode.winnerLine)}` +
    (playerWon ? L(' 🎉 That’s you!') : '') +
    (game.newBest ? ` <span class="record-badge">${L('NEW BEST TURF!')}</span>` : '') +
    (game.daily ? `<div class="daily-line">${L('DAILY SCORE: {v}', { v: (game.lastCoverage[game.player.team] * 100).toFixed(1) })}${game.dailyBest ? L(' — new daily best!') : ''}</div>` : '');

  const starWrap = $('#star-earned');
  starWrap.innerHTML = game.newStars
    .map(d => `<div class="star-earn">${L('★ NEW STAR — {d}', { d })}</div>`).join('')
    + (game.newBadges || [])
      .map(b => `<div class="star-earn badge-earn">${L('🏅 BADGE UNLOCKED — {n}', { n: L(b.name) })}</div>`).join('');

  const wrap = $('#result-rows');
  wrap.innerHTML = '';
  order.forEach((tid, i) => {
    const t = TEAMS[tid];
    const s = game.stats[tid];
    const you = tid === game.player.team ? ` ${L('(YOU)')}` : ' [bot]';
    const bits = [
      L(s.splats === 1 ? '{v} splat' : '{v} splats', { v: s.splats }),
      L(s.downs === 1 ? '{v} down' : '{v} downs', { v: s.downs }),
    ];
    if (s.buttons) bits.push(L(s.buttons === 1 ? '{v} button' : '{v} buttons', { v: s.buttons }));
    wrap.insertAdjacentHTML('beforeend', `
      <div class="result-row">
        <span class="r-rank">${i + 1}</span>
        <span class="r-dot" style="background:${t.color}"></span>
        <span class="r-main">
          <span class="r-name">${t.name}${you}</span>
          <span class="r-stats">${bits.join(' · ')}</span>
        </span>
        <span class="r-pct" style="color:${t.dark}">${mode.fmt(scores[tid])}</span>
      </div>`);
  });

  showScreen('#screen-results');
  Replay.start($('#replay-canvas'));
}
