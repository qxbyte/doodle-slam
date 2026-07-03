'use strict';

/* ============================================================
   Match orchestration + render loop.
   ============================================================ */

const MATCH_SECONDS = 180;
const MAX_PICKUPS = 6;
const BUTTON_FIRST_AT = 35;   // seconds into the match
const BUTTON_INTERVAL = 45;
const ROCKET_COUNT = 8;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const game = {
  state: 'title',        // title | stages | maps | select | match | results
  stageIdx: 0,           // chosen on the stage-select screen
  mapIdx: 0,             // chosen on the map-select screen
  fighters: [],
  player: null,
  projectiles: [],
  bombs: [],
  pickups: [],
  rockets: [],
  button: { active: false, x: 0, y: 0, nextAt: 0 },   // positioned from PLAZA at match start
  timeLeft: MATCH_SECONDS,
  elapsed: 0,
  lastCoverage: [0, 0, 0, 0],
  covTimer: 0,
  pickupTimer: 0,
  toast: pushToast,
};

const input = {
  keys: new Set(),
  mouseX: innerWidth / 2, mouseY: innerHeight / 2,
  mouseInside: false,   // edge panning must stop when the cursor leaves the window
  firing: false,
};

const cam = { x: 0, y: 0, zoom: 1 };
const camPan = { x: 0, y: 0 };      // extra offset from edge-of-screen scouting
const EDGE_MARGIN = 36;             // px from the window edge that triggers panning
const EDGE_PAN_SPEED = 520;         // world px/s

/* Big windows zoom in so the visible slice of the town stays ~1400x900
   world px — otherwise the camera has no room to move on large screens */
function camZoom() {
  return Math.max(1, innerWidth / 1400, innerHeight / 900);
}
/* Screen -> world */
function worldMouseX() { return cam.x + input.mouseX / cam.zoom; }
function worldMouseY() { return cam.y + input.mouseY / cam.zoom; }

/* ---------------- setup ---------------- */

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

addEventListener('keydown', e => {
  input.keys.add(e.code);
  if (e.code === 'Escape' && game.state === 'match') leaveMatch();
  if (e.code === 'Space' && game.state === 'match') {
    e.preventDefault();
    camPan.x = camPan.y = 0;   // snap the camera back onto the player
  }
});
addEventListener('keyup', e => input.keys.delete(e.code));
addEventListener('mousemove', e => {
  input.mouseX = e.clientX;
  input.mouseY = e.clientY;
  input.mouseInside = true;
});
document.addEventListener('mouseleave', () => { input.mouseInside = false; });
document.addEventListener('mouseenter', () => { input.mouseInside = true; });
addEventListener('blur', () => { input.mouseInside = false; });
addEventListener('mousedown', e => {
  if (game.state !== 'match') return;
  if (e.button === 0) input.firing = true;
  if (e.button === 2) {
    const p = game.player;
    if (p.alive && p.throwBomb(game, worldMouseX(), worldMouseY())) {
      pushToast(`${p.name} threw a Paint Bomb!`);
    }
  }
});
addEventListener('mouseup', e => { if (e.button === 0) input.firing = false; });
addEventListener('contextmenu', e => e.preventDefault());

/* ---------------- match lifecycle ---------------- */

function startMatch(playerTeam) {
  setMap(game.mapIdx);   // builds the sketch layers, sets OBSTACLES/PLAZA
  initPaint();
  game.fighters = TEAMS.map(t => new Fighter(t.id, t.id === playerTeam));
  game.player = game.fighters[playerTeam];
  game.projectiles = [];
  game.bombs = [];
  game.rockets = [];
  game.pickups = [];
  game.button.active = false;
  game.button.x = PLAZA.x;
  game.button.y = PLAZA.y;
  game.button.nextAt = BUTTON_FIRST_AT;
  game.timeLeft = MATCH_SECONDS;
  game.elapsed = 0;
  game.covTimer = 0;
  game.pickupTimer = 0;
  game.lastCoverage = [0, 0, 0, 0];
  camPan.x = camPan.y = 0;
  for (let i = 0; i < 4; i++) spawnPickup();
  ui.feed.innerHTML = '';
  game.state = 'match';
  showScreen(null);
  pushToast('Cover the most turf before time runs out!');
}

function leaveMatch() {
  game.state = 'title';
  showScreen('#screen-title');
}

function endMatch() {
  game.lastCoverage = coverage();
  game.state = 'results';
  showResults(game);
}

function spawnPickup() {
  if (game.pickups.length >= MAX_PICKUPS) return;
  const s = randomOpenSpot(80);
  game.pickups.push({ x: s.x, y: s.y, bob: Math.random() * Math.PI * 2 });
}

/* ---------------- update ---------------- */

function update(dt) {
  if (game.state !== 'match') return;

  game.elapsed += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) { endMatch(); return; }

  const p = game.player;

  // player input
  if (p.alive) {
    let dx = 0, dy = 0;
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) dy -= 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) dy += 1;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) dx -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) dx += 1;
    p.move(dx, dy, dt);
    p.aim = Math.atan2(worldMouseY() - p.y, worldMouseX() - p.x);
    if (input.firing) p.tryFire(game, dt);
  }

  // fighters shared upkeep + bots
  for (const f of game.fighters) {
    if (!f.alive) {
      f.respawnTimer -= dt;
      if (f.respawnTimer <= 0) f.respawn();
      continue;
    }
    f.updateRegen(dt);
    if (!f.isPlayer) f.botUpdate(game, dt);

    // pickups
    for (let i = game.pickups.length - 1; i >= 0; i--) {
      const pk = game.pickups[i];
      if (dist(f.x, f.y, pk.x, pk.y) < FIGHTER_RADIUS + 14) {
        game.pickups.splice(i, 1);
        f.bombs = Math.min(f.bombs + 1, 3);
        pushToast(`${f.name} picked up a Paint Bomb!`);
      }
    }

    // red button
    if (game.button.active && dist(f.x, f.y, game.button.x, game.button.y) < FIGHTER_RADIUS + 18) {
      game.button.active = false;
      game.button.nextAt = game.elapsed + BUTTON_INTERVAL;
      pushToast(`${f.name} hit the RED BUTTON!`, 'warn');
      pushToast('ROCKET STRIKE incoming!', 'danger');
      for (let i = 0; i < ROCKET_COUNT; i++) {
        const s = randomOpenSpot(100);
        game.rockets.push({
          x: s.x, y: s.y,
          delay: 0.6 + i * 0.35,
          fall: 0.9,
          team: f.team,
        });
      }
    }
  }

  // red button appearance
  if (!game.button.active && game.elapsed >= game.button.nextAt) {
    game.button.active = true;
    pushToast('RED BUTTON appeared at the plaza!', 'warn');
  }

  // projectiles
  for (let i = game.projectiles.length - 1; i >= 0; i--) {
    const pr = game.projectiles[i];
    pr.x += pr.vx * dt;
    pr.y += pr.vy * dt;
    pr.life -= dt;
    let dead = false;

    if (pointBlocked(pr.x, pr.y)) {
      dead = true; // buildings eat shots, no splat on walls
    } else {
      for (const f of game.fighters) {
        if (f.team === pr.team || !f.alive) continue;
        if (dist(pr.x, pr.y, f.x, f.y) < FIGHTER_RADIUS + 4) {
          f.hurt(game, SHOT_DAMAGE, pr.owner);
          splat(pr.x, pr.y, rand(Math.random, 12, 18), pr.team);
          dead = true;
          break;
        }
      }
      if (!dead && pr.life <= 0) {
        splat(pr.x, pr.y, rand(Math.random, 14, 24), pr.team);
        dead = true;
      }
    }
    if (dead) game.projectiles.splice(i, 1);
  }

  // thrown bombs (arc to target, then burst)
  for (let i = game.bombs.length - 1; i >= 0; i--) {
    const b = game.bombs[i];
    b.t += dt;
    if (b.t >= b.dur) {
      const bx = b.tx, by = b.ty;
      if (!pointBlocked(bx, by)) {
        splat(bx, by, 95, b.team);
        for (let k = 0; k < 4; k++) {
          const a = Math.random() * Math.PI * 2, d = rand(Math.random, 50, 110);
          const sx = bx + Math.cos(a) * d, sy = by + Math.sin(a) * d;
          if (!pointBlocked(sx, sy)) splat(sx, sy, rand(Math.random, 20, 40), b.team);
        }
        for (const f of game.fighters) {
          if (f.team !== b.team && f.alive && dist(f.x, f.y, bx, by) < 110) {
            f.hurt(game, 55, b.owner);
          }
        }
      }
      game.bombs.splice(i, 1);
    }
  }

  // rockets
  for (let i = game.rockets.length - 1; i >= 0; i--) {
    const r = game.rockets[i];
    if (r.delay > 0) { r.delay -= dt; continue; }
    r.fall -= dt;
    if (r.fall <= 0) {
      splat(r.x, r.y, rand(Math.random, 120, 160), r.team);
      for (const f of game.fighters) {
        if (f.team !== r.team && f.alive && dist(f.x, f.y, r.x, r.y) < 130) {
          f.hurt(game, 70, game.fighters[r.team]);
        }
      }
      game.rockets.splice(i, 1);
    }
  }

  // pickup respawns
  game.pickupTimer += dt;
  if (game.pickupTimer > 7) {
    game.pickupTimer = 0;
    spawnPickup();
  }

  // coverage refresh (cheap, but no need to run every frame)
  game.covTimer += dt;
  if (game.covTimer > 0.5) {
    game.covTimer = 0;
    game.lastCoverage = coverage();
  }

  // camera follows player; mouse at the window edge pans it to scout,
  // and it eases back once the mouse leaves the edge (Space snaps back)
  cam.zoom = camZoom();
  const vw = innerWidth / cam.zoom, vh = innerHeight / cam.zoom;   // world px in view
  let ex = 0, ey = 0;
  if (input.mouseInside) {
    if (input.mouseX < EDGE_MARGIN) ex = -1;
    else if (input.mouseX > innerWidth - EDGE_MARGIN) ex = 1;
    if (input.mouseY < EDGE_MARGIN) ey = -1;
    else if (input.mouseY > innerHeight - EDGE_MARGIN) ey = 1;
  }
  if (ex || ey) {
    camPan.x += ex * EDGE_PAN_SPEED * dt;
    camPan.y += ey * EDGE_PAN_SPEED * dt;
  } else {
    const ease = Math.min(1, dt * 6);
    camPan.x = lerp(camPan.x, 0, ease);
    camPan.y = lerp(camPan.y, 0, ease);
  }

  // scouting range is capped so the player can never leave the screen
  camPan.x = clamp(camPan.x, -vw * 0.42, vw * 0.42);
  camPan.y = clamp(camPan.y, -vh * 0.42, vh * 0.42);

  // the camera may look past the paper edge (desk shows), so the player
  // stays centred even in map corners; only the screen centre is bounded
  const camMinX = -vw / 2, camMaxX = WORLD.w - vw / 2;
  const camMinY = -vh / 2, camMaxY = WORLD.h - vh / 2;
  // keep the pan offset within what the camera can actually show
  camPan.x = clamp(camPan.x, camMinX - (game.player.x - vw / 2), camMaxX - (game.player.x - vw / 2));
  camPan.y = clamp(camPan.y, camMinY - (game.player.y - vh / 2), camMaxY - (game.player.y - vh / 2));
  cam.x = clamp(game.player.x - vw / 2 + camPan.x, camMinX, camMaxX);
  cam.y = clamp(game.player.y - vh / 2 + camPan.y, camMinY, camMaxY);

  updateHUD(game);
  renderMinimap(game);
}

/* ---------------- render ---------------- */

function render() {
  const vw = innerWidth, vh = innerHeight;

  // desk under the paper
  ctx.fillStyle = '#f4d9d5';
  ctx.fillRect(0, 0, vw, vh);

  if (game.state !== 'match' && game.state !== 'results') return;

  ctx.save();
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-cam.x, -cam.y);

  // paper shadow + layers
  ctx.fillStyle = 'rgba(120,80,80,0.25)';
  ctx.fillRect(10, 12, WORLD.w, WORLD.h);
  ctx.drawImage(groundLayer, 0, 0);
  ctx.drawImage(paintCanvas, 0, 0);
  ctx.drawImage(topLayer, 0, 0);

  // pickups: bomb in a dashed circle
  for (const pk of game.pickups) {
    pk.bob += 0.03;
    const oy = Math.sin(pk.bob) * 3;
    ctx.strokeStyle = 'rgba(74,74,72,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawBombIcon(ctx, pk.x, pk.y + oy);
  }

  // red button
  if (game.button.active) {
    ctx.strokeStyle = 'rgba(230,57,42,0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(game.button.x, game.button.y, 30 + Math.sin(game.elapsed * 3) * 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    drawRedButton(ctx, game.button.x, game.button.y, game.elapsed);
  }

  // rocket warnings + falling rockets
  for (const r of game.rockets) {
    if (r.delay > 0 || r.fall <= 0) {
      // warning target
      ctx.strokeStyle = 'rgba(230,57,42,0.8)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.arc(r.x, r.y, 40, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(r.x - 12, r.y); ctx.lineTo(r.x + 12, r.y);
      ctx.moveTo(r.x, r.y - 12); ctx.lineTo(r.x, r.y + 12);
      ctx.stroke();
    } else {
      const t = r.fall / 0.9;
      drawRocket(ctx, r.x + t * 220, r.y - t * 420, TEAMS[r.team].color);
    }
  }

  // projectiles: flying paint drops
  for (const pr of game.projectiles) {
    ctx.fillStyle = TEAMS[pr.team].color;
    ctx.beginPath();
    ctx.ellipse(pr.x, pr.y, 5, 3, Math.atan2(pr.vy, pr.vx), 0, Math.PI * 2);
    ctx.fill();
  }

  // bombs in flight
  for (const b of game.bombs) {
    const t = b.t / b.dur;
    const bx = lerp(b.x, b.tx, t), by = lerp(b.y, b.ty, t) - Math.sin(t * Math.PI) * 80;
    drawBombIcon(ctx, bx, by, 0.9 + t * 0.3);
  }

  // fighters (draw dead ones as ghosts at spawn? just skip)
  for (const f of game.fighters) {
    if (!f.alive) continue;
    drawCharacter(ctx, f.team, f.x, f.y, {
      walk: f.walkPhase,
      aim: f.aim,
      firing: f.firingVisual > 0,
      scale: 1.15,
    });
    // name tag
    const label = f.isPlayer ? 'YOU' : `${f.name} [bot]`;
    ctx.font = `800 10px 'Nunito', sans-serif`;
    const tw = ctx.measureText(label).width + 10;
    ctx.fillStyle = f.isPlayer ? TEAMS[f.team].color : 'rgba(255,255,255,0.9)';
    ctx.strokeStyle = '#1c1c1a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(f.x - tw / 2, f.y - 42, tw, 14, 7);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = f.isPlayer ? '#fff' : TEAMS[f.team].dark;
    ctx.textAlign = 'center';
    ctx.fillText(label, f.x, f.y - 31.5);
  }

  ctx.restore();

  // crosshair (drawn last, in screen space)
  if (game.state === 'match') {
    const mx = input.mouseX, my = input.mouseY;
    ctx.strokeStyle = '#1c1c1a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(mx - 13, my); ctx.lineTo(mx + 13, my);
    ctx.moveTo(mx, my - 13); ctx.lineTo(mx, my + 13);
    ctx.stroke();
  }
}

/* ---------------- loop ---------------- */

let lastT = performance.now();
function frame(now) {
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

/* ---------------- boot ---------------- */

function boot() {
  initHUD();
  buildStageCards();
  buildMapCards(game.stageIdx);
  buildFighterCards();
  attachSplatFX($('#screen-stages'));

  // flow: title -> stage select -> map select -> fighter select -> match
  $('#play-btn').addEventListener('click', () => {
    game.state = 'stages';
    showScreen('#screen-stages');
  });
  $('#stage-cards').addEventListener('click', e => {
    const card = e.target.closest('.stage-card');
    if (!card) return;
    game.stageIdx = Number(card.dataset.stage);
    buildMapCards(game.stageIdx);
    game.state = 'maps';
    showScreen('#screen-maps');
  });
  $('#stages-back-btn').addEventListener('click', () => {
    game.state = 'title';
    showScreen('#screen-title');
  });
  $('#map-cards').addEventListener('click', e => {
    const card = e.target.closest('.map-card');
    if (!card) return;
    game.mapIdx = Number(card.dataset.map);
    game.state = 'select';
    showScreen('#screen-select');
  });
  $('#maps-back-btn').addEventListener('click', () => {
    game.state = 'stages';
    showScreen('#screen-stages');
  });
  $('#back-btn').addEventListener('click', () => {
    game.state = 'maps';
    showScreen('#screen-maps');
  });
  $('#fighter-cards').addEventListener('click', e => {
    const card = e.target.closest('.fighter-card');
    if (card) startMatch(Number(card.dataset.team));
  });
  $('#leave-btn').addEventListener('click', leaveMatch);
  $('#again-btn').addEventListener('click', () => startMatch(game.player.team));
  $('#menu-btn').addEventListener('click', leaveMatch);

  // once webfonts land, rebuild anything that draws canvas text
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      buildFighterCards();
      buildStageCards();
      buildMapCards(game.stageIdx);
      if (game.state === 'match' || game.state === 'results') buildWorldLayers(CURRENT_MAP);
    });
  }

  // debug hooks: ?auto=N jumps into a match as team N (?map=M picks the map),
  // ?ff=S fast-forwards S seconds, ?mx/?my pin the mouse, ?screen=X opens a menu
  const params = new URLSearchParams(location.search);
  if (params.has('map')) {
    game.mapIdx = clamp(Number(params.get('map')) || 0, 0, MAPS.length - 1);
    game.stageIdx = MAPS[game.mapIdx].stage;
  }
  const auto = params.get('auto');
  if (auto !== null) {
    startMatch(clamp(Number(auto) || 0, 0, 3));
    if (params.has('mx')) { input.mouseX = Number(params.get('mx')); input.mouseInside = true; }
    if (params.has('my')) { input.mouseY = Number(params.get('my')); input.mouseInside = true; }
    const ff = Number(params.get('ff')) || 0;
    for (let i = 0; i < ff * 30; i++) update(1 / 30);
  }
  if (params.get('screen') === 'select') showScreen('#screen-select');
  if (params.get('screen') === 'maps') { buildMapCards(game.stageIdx); showScreen('#screen-maps'); }
  if (params.get('screen') === 'stages') showScreen('#screen-stages');

  requestAnimationFrame(frame);
}

boot();
