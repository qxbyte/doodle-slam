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
    card.insertAdjacentHTML('beforeend', `
      <div class="s-label">${stage.label}</div>
      <div class="s-name">${stage.name}</div>
      <div class="s-desc">${stage.desc}</div>`);
    wrap.appendChild(card);
  });
}

/* Each stage gets one signature doodle, drawn with the sketch kit */
function drawStageVignette(cv, kind) {
  const c = cv.getContext('2d');
  const rng = makeRng(kind === 'city' ? 11 : 22);
  c.fillStyle = PAPER;
  c.fillRect(0, 0, cv.width, cv.height);
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = INK;

  if (kind === 'city') {
    // skyline: three blocks + rooftop billboard + a cloud
    const blocks = [[24, 62, 44, 72], [82, 40, 56, 94], [152, 74, 40, 60]];
    for (const [x, y, w, h] of blocks) {
      c.fillStyle = PAPER;
      c.fillRect(x, y, w, h);
      c.lineWidth = 2;
      wobblyRect(c, rng, x, y, w, h, 1.4);
      c.stroke();
      hatchRect(c, rng, x, y, w, 8, 4);
      c.lineWidth = 1.1;
      for (let wy = y + 16; wy < y + h - 10; wy += 18) {
        for (let wx = x + 8; wx < x + w - 10; wx += 16) {
          wobblyRect(c, rng, wx, wy, 8, 10, 0.6);
          c.stroke();
        }
      }
    }
    // billboard on the middle block
    c.fillStyle = '#fff';
    c.lineWidth = 1.8;
    wobblyRect(c, rng, 88, 22, 46, 14, 1);
    c.fill(); c.stroke();
    c.font = `9px 'Patrick Hand', cursive`;
    c.fillStyle = INK;
    c.textAlign = 'center';
    c.fillText('SLAM!', 111, 32);
    // cloud
    c.lineWidth = 1.3;
    scribbleBlob(c, rng, 190, 30, 13);
    c.stroke();
    // street
    c.strokeStyle = INK_LIGHT;
    wobblyPath(c, rng, [[8, 138], [224, 138]], 1.5);
    c.stroke();
    c.setLineDash([8, 8]);
    wobblyPath(c, rng, [[8, 144], [224, 144]], 1);
    c.stroke();
    c.setLineDash([]);
  } else {
    // forest camp: pines + tent + campfire smoke + birds
    const pine = (px, py, s) => {
      c.strokeStyle = INK;
      c.lineWidth = 1.6;
      c.fillStyle = PAPER;
      for (let tier = 0; tier < 3; tier++) {
        const ty = py - tier * 11 * s, tw = (22 - tier * 5) * s;
        c.beginPath();
        c.moveTo(px - tw, ty);
        c.lineTo(px, ty - 14 * s);
        c.lineTo(px + tw, ty);
        c.closePath();
        c.fill(); c.stroke();
      }
      c.beginPath(); c.moveTo(px, py + 2); c.lineTo(px, py + 10 * s); c.stroke();
    };
    pine(38, 96, 1.1);
    pine(74, 108, 0.8);
    pine(196, 100, 1.0);
    // tent
    c.lineWidth = 1.8;
    c.fillStyle = PAPER;
    c.beginPath();
    c.moveTo(104, 122);
    c.quadraticCurveTo(118, 78, 132, 70);
    c.quadraticCurveTo(146, 78, 160, 122);
    c.closePath();
    c.fill(); c.stroke();
    c.beginPath();
    c.moveTo(132, 74); c.lineTo(122, 122); c.lineTo(142, 122);
    c.closePath();
    c.fillStyle = '#dddbd3';
    c.fill(); c.stroke();
    // campfire with the warm accent
    c.fillStyle = '#e88a2a';
    c.beginPath();
    c.moveTo(182, 118);
    c.quadraticCurveTo(189, 128, 182, 134);
    c.quadraticCurveTo(175, 128, 182, 118);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.3;
    c.stroke();
    c.beginPath();
    c.moveTo(172, 136); c.lineTo(192, 132);
    c.moveTo(172, 132); c.lineTo(192, 136);
    c.stroke();
    // smoke curl
    c.strokeStyle = INK_LIGHT;
    c.beginPath();
    c.moveTo(182, 114);
    c.quadraticCurveTo(190, 104, 184, 96);
    c.quadraticCurveTo(178, 88, 186, 80);
    c.stroke();
    // birds
    c.strokeStyle = INK;
    for (const [bx, by] of [[120, 34], [138, 28], [156, 38]]) {
      c.beginPath();
      c.moveTo(bx - 5, by);
      c.quadraticCurveTo(bx - 2, by - 4, bx, by);
      c.quadraticCurveTo(bx + 2, by - 4, bx + 5, by);
      c.stroke();
    }
    // ground line
    c.strokeStyle = INK_LIGHT;
    wobblyPath(c, rng, [[8, 128], [224, 128]], 2);
    c.stroke();
  }
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
    card.insertAdjacentHTML('beforeend', `
      <div class="m-name">${map.name}</div>
      <div class="m-desc">${map.desc}</div>`);
    wrap.appendChild(card);
  });
}

/* Schematic thumbnail drawn straight from the map data */
function drawMapPreview(cv, map) {
  const c = cv.getContext('2d');
  const sx = cv.width / WORLD.w, sy = cv.height / WORLD.h;
  c.fillStyle = PAPER;
  c.fillRect(0, 0, cv.width, cv.height);

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
  for (const b of map.buildings) {
    c.fillStyle = '#c6c4bc';
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

/* ---------------- results ---------------- */

function showResults(game) {
  const cov = game.lastCoverage;
  const order = [0, 1, 2, 3].sort((a, b) => cov[b] - cov[a]);
  const winner = TEAMS[order[0]];
  const playerWon = order[0] === game.player.team;

  $('#winner-line').innerHTML =
    `<span style="color:${winner.color}">${winner.name}</span> takes the town!` +
    (playerWon ? ' 🎉 That’s you!' : '');

  const wrap = $('#result-rows');
  wrap.innerHTML = '';
  order.forEach((tid, i) => {
    const t = TEAMS[tid];
    const you = tid === game.player.team ? ' (YOU)' : ' [bot]';
    wrap.insertAdjacentHTML('beforeend', `
      <div class="result-row">
        <span class="r-rank">${i + 1}</span>
        <span class="r-dot" style="background:${t.color}"></span>
        <span class="r-name">${t.name}${you}</span>
        <span class="r-pct" style="color:${t.dark}">${(cov[tid] * 100).toFixed(1)}%</span>
      </div>`);
  });

  showScreen('#screen-results');
}
