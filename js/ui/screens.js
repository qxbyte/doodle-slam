'use strict';

/* ============================================================
   Full-screen menus: title, map select, fighter select, results.
   ============================================================ */

const SCREEN_IDS = ['#screen-title', '#screen-stages', '#screen-maps', '#screen-select', '#screen-results'];

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
    cv.width = 232; cv.height = 150;
    drawStageVignette(cv, stage.vignette);
    card.appendChild(cv);
    const prog = Campaign.stageStars(i);
    const locked = !Campaign.stageUnlocked(i);
    if (locked) card.classList.add('locked');
    card.insertAdjacentHTML('beforeend', `
      <div class="s-label">${stage.label}<span class="s-stars">★ ${prog.got}/${prog.total}</span></div>
      <div class="s-name">${stage.name}</div>
      <div class="s-desc">${locked ? 'Locked — earn a star in the previous stage.' : stage.desc}</div>
      ${locked ? '<div class="s-lock">🔒</div>' : ''}`);
    wrap.appendChild(card);
  });
}

/* Each stage gets one signature doodle, drawn with the sketch kit */
function drawStageVignette(cv, kind) {
  const c = cv.getContext('2d');
  const rng = makeRng(VIGNETTE_SEEDS[kind] || 99);
  c.fillStyle = VIGNETTE_BG[kind] || PAPER;
  c.fillRect(0, 0, cv.width, cv.height);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = INK;
  (VIGNETTES[kind] || VIGNETTES.city)(c, rng, cv);
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
    cv.width = 264; cv.height = 176;
    drawMapPreview(cv, map);
    card.appendChild(cv);
    const stars = Campaign.stars(map.name);
    const chs = Campaign.descs(map.name);
    card.insertAdjacentHTML('beforeend', `
      <div class="m-name">${map.name} <span class="m-stars">${stars.map(s => s ? '★' : '☆').join('')}</span></div>
      <div class="m-desc">${map.desc}</div>
      <ul class="m-ch">${chs.map((d, k) =>
        `<li class="${stars[k] ? 'done' : ''}">${stars[k] ? '★' : '☆'} ${d}</li>`).join('')}</ul>`);
    wrap.appendChild(card);
  });
}

/* Schematic thumbnail drawn straight from the map data */
function drawMapPreview(cv, map) {
  const c = cv.getContext('2d');
  const sx = cv.width / WORLD.w, sy = cv.height / WORLD.h;
  c.fillStyle = { desk: '#eedfcf', moon: '#e9edef', sand: '#f2e7cf', snow: '#f4f7f9', chalk: '#2c3b35', seabed: '#dcebf0' }[map.ground] || '#f0efe9';
  c.fillRect(0, 0, cv.width, cv.height);
  // frozen lakes + current lanes
  c.fillStyle = 'rgba(165,210,235,0.55)';
  for (const r of map.ice) c.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
  c.fillStyle = 'rgba(120,185,215,0.5)';
  for (const r of map.currents) c.fillRect(r.x * sx, r.y * sy, r.w * sx, r.h * sy);
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
  // water + bridges
  c.fillStyle = 'rgba(110,150,175,0.45)';
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

function buildFighterCards() {
  const wrap = $('#fighter-cards');
  wrap.innerHTML = '';
  for (const team of TEAMS) {
    const card = document.createElement('button');
    card.className = 'fighter-card';
    card.dataset.team = team.id;
    card.style.borderBottomColor = team.color;
    const cv = document.createElement('canvas');
    cv.width = 120; cv.height = 110;
    const c = cv.getContext('2d');
    c.scale(2.6, 2.6);
    drawCharacter(c, team.id, 23, 24, { aim: -0.35 });
    card.appendChild(cv);
    const w = WEAPONS[team.id];
    card.insertAdjacentHTML('beforeend', `
      <div class="f-name" style="color:${team.color}">${team.name}</div>
      <div class="f-weapon">${w.name}</div>
      <div class="f-desc">${team.desc} ${w.blurb[0].toUpperCase() + w.blurb.slice(1)}.</div>`);
    wrap.appendChild(card);
  }
}

/* ---------------- title art ---------------- */

/* the paint burst the logo sits on */
function initTitleArt() {
  const cv = $('#logo-splat');
  const c = cv.getContext('2d');
  const rng = makeRng(4242);
  c.clearRect(0, 0, cv.width, cv.height);
  c.globalAlpha = 0.9;
  drawSplat(c, rng, cv.width * 0.36, cv.height * 0.40, 96, '#2f66e0');
  drawSplat(c, rng, cv.width * 0.64, cv.height * 0.62, 88, '#e6392a');
  c.globalAlpha = 0.85;
  drawSplat(c, rng, cv.width * 0.74, cv.height * 0.30, 46, '#f0b41c');
  drawSplat(c, rng, cv.width * 0.24, cv.height * 0.72, 40, '#3ba24f');
  c.globalAlpha = 1;
}

/* ---------------- title career line ---------------- */

function updateDailyButton() {
  const btn = $('#daily-btn');
  const best = Daily.best();
  btn.innerHTML = `DAILY RUN &middot; ${MAPS[Daily.mapIdx()].name}` +
    (best !== null ? ` &middot; best ${best.toFixed(1)}` : '');
}

function updateTitleRecord() {
  const el = $('#title-record');
  const r = Records.get();
  if (!r.plays) { el.textContent = ''; return; }
  el.textContent =
    `${r.plays} match${r.plays > 1 ? 'es' : ''} · ${r.wins} win${r.wins === 1 ? '' : 's'} · best turf ${r.best.toFixed(1)}%`;
}

/* ---------------- results ---------------- */

function showResults(game) {
  const mode = currentMode();
  const scores = mode.scores(game);
  const order = [0, 1, 2, 3].sort((a, b) => scores[b] - scores[a]);
  const winner = TEAMS[order[0]];
  const playerWon = order[0] === game.player.team;

  $('#winner-line').innerHTML =
    `<span style="color:${winner.color}">${winner.name}</span> ${mode.winnerLine}` +
    (playerWon ? ' 🎉 That’s you!' : '') +
    (game.newBest ? ' <span class="record-badge">NEW BEST TURF!</span>' : '') +
    (game.daily ? `<div class="daily-line">DAILY SCORE: ${(game.lastCoverage[game.player.team] * 100).toFixed(1)}${game.dailyBest ? ' — new daily best!' : ''}</div>` : '');

  const starWrap = $('#star-earned');
  starWrap.innerHTML = game.newStars
    .map(d => `<div class="star-earn">★ NEW STAR — ${d}</div>`).join('');

  const wrap = $('#result-rows');
  wrap.innerHTML = '';
  order.forEach((tid, i) => {
    const t = TEAMS[tid];
    const s = game.stats[tid];
    const you = tid === game.player.team ? ' (YOU)' : ' [bot]';
    const bits = [`${s.splats} splat${s.splats === 1 ? '' : 's'}`, `${s.downs} down${s.downs === 1 ? '' : 's'}`];
    if (s.buttons) bits.push(`${s.buttons} button${s.buttons === 1 ? '' : 's'}`);
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
