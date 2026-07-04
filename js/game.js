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

const SLAM_AT = 30;          // last N seconds: SLAM TIME, splats scale up
const SLAM_SCALE = 1.6;

const game = {
  state: 'title',        // title | stages | maps | select | match | results
  demo: false,           // attract mode: bots play behind the menus
  browse: false,         // sightseeing: free camera, fighter stands idle
  daily: false,          // this match is today's Daily Run
  mode: 'turf',          // turf | splat | zones (see systems/modes.js)
  stageIdx: 0,           // chosen on the stage-select screen
  mapIdx: 0,             // chosen on the map-select screen
  difficulty: 'normal',  // bot tuning, chosen on the fighter-select screen
  fighters: [],
  player: null,
  projectiles: [],
  bombs: [],
  pickups: [],
  rockets: [],
  fx: [],                // transient juice: impact bursts, SPLAT! text
  skillFx: [],           // ongoing skill effects (paint drones)
  zones: [],             // zone-control capture circles
  zoneScores: [0, 0, 0, 0],
  newStars: [],          // campaign stars earned this match
  shake: 0,              // screen shake magnitude, decays fast
  slam: false,           // SLAM TIME reached
  lastTickAt: -1,
  stats: [],             // per-team match stats: splats, downs, buttons
  newBest: false,        // player set a personal coverage record this match
  button: { active: false, x: 0, y: 0, nextAt: 0 },   // positioned from PLAZA at match start
  timeLeft: MATCH_SECONDS,
  elapsed: 0,
  lastCoverage: [0, 0, 0, 0],
  covTimer: 0,
  pickupTimer: 0,
  toast: pushToast,
};

function slamMul() { return game.slam ? SLAM_SCALE : 1; }

function addShake(m) {
  if (!Settings.data.shake) return;
  game.shake = Math.min(12, game.shake + m);
}

function addFx(o) {
  game.fx.push(Object.assign({
    t: 0,
    dur: o.type === 'text' ? 0.9 : 0.28,
    r0: 4, r1: 26, drops: 5,
    seed: Math.random() * Math.PI * 2,
  }, o));
}

const input = {
  keys: new Set(),
  mouseX: innerWidth / 2, mouseY: innerHeight / 2,
  mouseInside: false,   // edge panning must stop when the cursor leaves the window
  firing: false,
};

const cam = { x: 0, y: 0, zoom: 1 };
const EDGE_MARGIN = 36;   // px from the window edge that moves the browse camera

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
    if (game.browse) setBrowse(false);   // Space exits sightseeing
  }
  if (e.code === 'KeyB' && game.state === 'match') setBrowse(!game.browse);
  if (e.code === 'KeyQ' && game.state === 'match' && !game.browse && !game.demo) {
    Skills.cast(game, game.player);
  }
  if (e.code === 'KeyM') {
    // master mute: if anything is audible, silence both; else restore both
    const anyOn = Settings.data.sfx || Settings.data.music;
    Settings.set('sfx', !anyOn);
    Settings.set('music', !anyOn);
    renderSettingsPanel();
    pushToast(L(anyOn ? 'Sound off' : 'Sound on'));
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
  if (game.state !== 'match' || game.browse) return;
  // clicks on HUD buttons (leave match, browse…) must not fire the weapon
  if (e.target.closest && e.target.closest('button')) return;
  if (e.button === 0) input.firing = true;
  if (e.button === 2) {
    const p = game.player;
    if (p.alive && p.throwBomb(game, worldMouseX(), worldMouseY())) {
      pushToast(L('{n} threw a Paint Bomb!', { n: p.name }));
    }
  }
});
addEventListener('mouseup', e => { if (e.button === 0) input.firing = false; });
addEventListener('contextmenu', e => e.preventDefault());

/* ---------------- match lifecycle ---------------- */

/* shared between real matches and the menu attract mode */
function resetMatchState() {
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
  game.fx = [];
  game.shake = 0;
  game.slam = false;
  game.lastTickAt = -1;
  game.stats = TEAMS.map(() => ({ splats: 0, downs: 0, buttons: 0 }));
  game.skillFx = [];
  game.zoneScores = [0, 0, 0, 0];
  game.newStars = [];
  for (let i = 0; i < 4; i++) spawnPickup();
}

/* browse mode: the match freezes completely (a pause) and only
   the camera flies, so you can sightsee the whole map */
const browseCam = { x: 0, y: 0, vx: 0, vy: 0 };
const BROWSE_SPEED = 760;   // world px/s with WASD/arrows or screen edges

function setBrowse(on) {
  if (game.state !== 'match' && on) return;
  const was = game.browse;
  game.browse = on;
  const btn = $('#browse-btn');
  btn.textContent = on ? L('BACK TO BATTLE') : L('BROWSE MAP');
  btn.classList.toggle('active', on);
  if (on) {
    browseCam.x = game.player.x;
    browseCam.y = game.player.y;
    browseCam.vx = browseCam.vy = 0;
    if (!was) pushToast(L('Match paused — fly around with WASD or the screen edges. B returns.'));
  }
}

function updateBrowseCamera(dt) {
  cam.zoom = camZoom();
  const vw = innerWidth / cam.zoom, vh = innerHeight / cam.zoom;
  let bx = 0, by = 0;
  if (input.mouseInside) {
    if (input.mouseX < EDGE_MARGIN) bx -= 1;
    else if (input.mouseX > innerWidth - EDGE_MARGIN) bx += 1;
    if (input.mouseY < EDGE_MARGIN) by -= 1;
    else if (input.mouseY > innerHeight - EDGE_MARGIN) by += 1;
  }
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) by -= 1;
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) by += 1;
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) bx -= 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) bx += 1;
  // ease toward the target velocity so starts and stops feel fluid
  const ease = Math.min(1, dt * 9);
  browseCam.vx = lerp(browseCam.vx, clamp(bx, -1, 1) * BROWSE_SPEED, ease);
  browseCam.vy = lerp(browseCam.vy, clamp(by, -1, 1) * BROWSE_SPEED, ease);
  browseCam.x = clamp(browseCam.x + browseCam.vx * dt, 0, WORLD.w);
  browseCam.y = clamp(browseCam.y + browseCam.vy * dt, 0, WORLD.h);
  cam.x = clamp(browseCam.x - vw / 2, -vw / 2, WORLD.w - vw / 2);
  cam.y = clamp(browseCam.y - vh / 2, -vh / 2, WORLD.h - vh / 2);
}

/* attract mode: an all-bot match on a random map, rendered behind
   the translucent menu screens with a slow cinematic camera */
const demoCam = { x: WORLD.w / 2, y: WORLD.h / 2, tx: WORLD.w / 2, ty: WORLD.h / 2, retarget: 0 };

function startDemoMatch() {
  game.demo = true;
  game.zones = [];
  // dark (chalkboard) worlds grey out the translucent menus — skip them
  const pool = MAPS.map((m, i) => i)
    .filter(i => (MAPS[i].palette || 'default') !== 'chalk');
  game.mapIdx = pool[Math.floor(Math.random() * pool.length)];
  setMap(game.mapIdx);
  Ambient.set(Settings.data.ambient ? CURRENT_MAP.ambient : null);
  initPaint();
  game.fighters = TEAMS.map(t => new Fighter(t.id, false));
  game.player = game.fighters[0];
  resetMatchState();
  const s = randomOpenSpot(300);
  demoCam.x = demoCam.tx = s.x;
  demoCam.y = demoCam.ty = s.y;
  demoCam.retarget = 0;
}

function startMatch(playerTeam) {
  Replay.stop();
  game.demo = false;
  game.daily = false;
  setMap(game.mapIdx);   // builds the sketch layers, sets OBSTACLES/PLAZA
  Ambient.set(Settings.data.ambient ? CURRENT_MAP.ambient : null);
  initPaint();
  game.zones = game.mode === 'zones' ? computeZones(CURRENT_MAP) : [];
  game.fighters = TEAMS.map(t => new Fighter(t.id, t.id === playerTeam));
  game.player = game.fighters[playerTeam];
  resetMatchState();
  game.newBest = false;
  Replay.reset();
  ui.feed.innerHTML = '';
  setWeaponNote(playerTeam);
  setBrowse(false);
  game.state = 'match';
  showScreen(null);
  SFX.play('start');
  pushToast(L('{m} — {b}!', { m: L(currentMode().name), b: L(currentMode().blurb) }));
}

/* today's fixed setup: same map and fighter for everyone */
function startDailyMatch() {
  game.mode = 'turf';
  game.mapIdx = Daily.mapIdx();
  startMatch(Daily.team());
  game.daily = true;
}

function leaveMatch() {
  Replay.stop();
  game.state = 'title';
  updateTitleRecord();
  updateDailyButton();
  buildStageCards();       // star counts / unlocks may have changed
  buildMapCards(game.stageIdx);
  showScreen('#screen-title');
  if (!prefersReducedMotion()) startDemoMatch();
}

function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function endMatch() {
  if (game.demo) { startDemoMatch(); return; }   // attract mode just loops
  game.lastCoverage = coverage();
  Replay.snap();   // capture the true final frame
  const scores = currentMode().scores(game);
  const order = [0, 1, 2, 3].sort((a, b) => scores[b] - scores[a]);
  game.newBest = Records.addMatch({
    won: order[0] === game.player.team,
    coverage: game.lastCoverage[game.player.team] * 100,
  });
  game.newStars = Campaign.evaluate(game);
  if (game.daily) {
    game.dailyBest = Daily.submit(Number((game.lastCoverage[game.player.team] * 100).toFixed(1)));
  }
  game.state = 'results';
  SFX.play('end');
  showResults(game);
}

function spawnPickup() {
  if (game.pickups.length >= MAX_PICKUPS) return;
  const s = randomOpenSpot(80);
  const roll = Math.random();
  const type = roll < 0.5 ? 'bomb' : roll < 0.75 ? 'boots' : 'shield';
  game.pickups.push({ x: s.x, y: s.y, type, bob: Math.random() * Math.PI * 2 });
}

/* ---------------- update ---------------- */

function update(dt) {
  if (game.state !== 'match' && !game.demo) return;

  // browse mode is a full pause: nothing simulates, only the camera flies
  if (game.browse && game.state === 'match') {
    updateBrowseCamera(dt);
    updateHUD(game);
    renderMinimap(game);
    return;
  }

  game.elapsed += dt;
  game.timeLeft -= dt;
  if (game.timeLeft <= 0) { endMatch(); return; }

  // SLAM TIME: the endgame comeback window
  if (!game.slam && game.timeLeft <= SLAM_AT) {
    game.slam = true;
    if (!game.demo) {
      SFX.play('slam');
      showSlamBanner();
      pushToast(L('SLAM TIME! Splats hit bigger!'), 'danger');
    }
  }
  // final-10s countdown ticks
  const sec = Math.ceil(game.timeLeft);
  if (game.timeLeft <= 10 && sec !== game.lastTickAt) {
    game.lastTickAt = sec;
    SFX.play('tick');
  }

  const p = game.player;

  // player input (attract mode is all bots; browsing leaves the fighter idle)
  if (p.alive && !game.demo && !game.browse) {
    let dx = 0, dy = 0;
    if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) dy -= 1;
    if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) dy += 1;
    if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) dx -= 1;
    if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) dx += 1;
    if (Touch.active) {
      dx += Touch.state.mx;
      dy += Touch.state.my;
      if (Touch.state.aim !== null) p.aim = Touch.state.aim;
      if (Touch.state.firing) p.tryFire(game, dt);
    } else {
      p.aim = Math.atan2(worldMouseY() - p.y, worldMouseX() - p.x);
    }
    p.move(dx, dy, dt);
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
    if (!f.isPlayer || game.demo) f.botUpdate(game, dt);

    // pickups
    for (let i = game.pickups.length - 1; i >= 0; i--) {
      const pk = game.pickups[i];
      if (dist(f.x, f.y, pk.x, pk.y) < FIGHTER_RADIUS + 14) {
        game.pickups.splice(i, 1);
        if (pk.type === 'boots') {
          f.boostT = 8;
          pushToast(L('{n} grabbed Speed Boots!', { n: f.name }));
        } else if (pk.type === 'shield') {
          f.shieldT = 5;
          pushToast(L('{n} popped a Bubble Shield!', { n: f.name }));
        } else {
          f.bombs = Math.min(f.bombs + 1, 3);
          pushToast(L('{n} picked up a Paint Bomb!', { n: f.name }));
        }
        if (f.isPlayer) SFX.play('pickup');
      }
    }

    // red button
    if (game.button.active && dist(f.x, f.y, game.button.x, game.button.y) < FIGHTER_RADIUS + 18) {
      game.button.active = false;
      game.button.nextAt = game.elapsed + BUTTON_INTERVAL;
      game.stats[f.team].buttons++;
      SFX.play('button');
      SFX.play('rocketWarn');
      pushToast(L('{n} hit the RED BUTTON!', { n: f.name }), 'warn');
      pushToast(L('ROCKET STRIKE incoming!'), 'danger');
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
    pushToast(L('RED BUTTON appeared at the plaza!'), 'warn');
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
          f.hurt(game, pr.dmg, pr.owner);
          splat(pr.x, pr.y, rand(Math.random, pr.sMin * 0.8, pr.sMax * 0.8) * slamMul(), pr.team);
          addFx({ type: 'burst', x: pr.x, y: pr.y, r1: 22, color: TEAMS[pr.team].color });
          if (f.isPlayer || pr.owner.isPlayer) SFX.play('hit');
          dead = true;
          break;
        }
      }
      if (!dead && pr.life <= 0) {
        const r = rand(Math.random, pr.sMin, pr.sMax) * slamMul();
        splat(pr.x, pr.y, r, pr.team);
        addFx({ type: 'burst', x: pr.x, y: pr.y, r1: r * 0.8, drops: 3, color: TEAMS[pr.team].color });
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
        splat(bx, by, 95 * slamMul(), b.team);
        for (let k = 0; k < 4; k++) {
          const a = Math.random() * Math.PI * 2, d = rand(Math.random, 50, 110);
          const sx = bx + Math.cos(a) * d, sy = by + Math.sin(a) * d;
          if (!pointBlocked(sx, sy)) splat(sx, sy, rand(Math.random, 20, 40) * slamMul(), b.team);
        }
        for (const f of game.fighters) {
          if (f.team !== b.team && f.alive && dist(f.x, f.y, bx, by) < 110) {
            f.hurt(game, 55, b.owner);
          }
        }
        addFx({ type: 'burst', x: bx, y: by, r1: 110, drops: 8, dur: 0.4, color: TEAMS[b.team].color });
        addShake(6);
        SFX.play('boom');
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
      splat(r.x, r.y, rand(Math.random, 120, 160) * slamMul(), r.team);
      for (const f of game.fighters) {
        if (f.team !== r.team && f.alive && dist(f.x, f.y, r.x, r.y) < 130) {
          f.hurt(game, 70, game.fighters[r.team]);
        }
      }
      addFx({ type: 'burst', x: r.x, y: r.y, r1: 150, drops: 10, dur: 0.5, color: TEAMS[r.team].color });
      addShake(8);
      SFX.play('rocketBoom');
      game.rockets.splice(i, 1);
    }
  }

  // ongoing skill effects (drones, dashes)
  Skills.update(game, dt);

  // transient fx + screen shake decay
  for (let i = game.fx.length - 1; i >= 0; i--) {
    game.fx[i].t += dt;
    if (game.fx[i].t >= game.fx[i].dur) game.fx.splice(i, 1);
  }
  game.shake = Math.max(0, game.shake - dt * 28);

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
    // zone control: each tick the leading team in a zone scores a point
    for (const z of game.zones) {
      z.owner = zoneOwner(z);
      if (z.owner >= 0) game.zoneScores[z.owner]++;
    }
  }

  // turf replay snapshots
  if (!game.demo) Replay.tick(dt);

  // attract mode: slow cinematic drift between random viewpoints
  if (game.demo) {
    cam.zoom = camZoom();
    const vw = innerWidth / cam.zoom, vh = innerHeight / cam.zoom;
    demoCam.retarget -= dt;
    if (demoCam.retarget <= 0) {
      const s = randomOpenSpot(280);
      demoCam.tx = s.x; demoCam.ty = s.y;
      demoCam.retarget = rand(Math.random, 7, 11);
    }
    const ease = Math.min(1, dt * 0.35);
    demoCam.x = lerp(demoCam.x, demoCam.tx, ease);
    demoCam.y = lerp(demoCam.y, demoCam.ty, ease);
    cam.x = clamp(demoCam.x - vw / 2, -vw / 2, WORLD.w - vw / 2);
    cam.y = clamp(demoCam.y - vh / 2, -vh / 2, WORLD.h - vh / 2);
    return;   // no HUD, no player camera while in the menus
  }

  // the camera simply keeps the player centred — free looking lives in
  // browse mode. It may look past the paper edge (desk shows) so the
  // player stays centred even in map corners.
  cam.zoom = camZoom();
  const vw = innerWidth / cam.zoom, vh = innerHeight / cam.zoom;   // world px in view
  cam.x = clamp(game.player.x - vw / 2, -vw / 2, WORLD.w - vw / 2);
  cam.y = clamp(game.player.y - vh / 2, -vh / 2, WORLD.h - vh / 2);

  updateHUD(game);
  renderMinimap(game);
}

/* ---------------- render ---------------- */

function render() {
  const vw = innerWidth, vh = innerHeight;

  // desk under the paper
  ctx.fillStyle = '#f4d9d5';
  ctx.fillRect(0, 0, vw, vh);

  if (game.state !== 'match' && game.state !== 'results' && !game.demo) return;

  ctx.save();
  ctx.scale(cam.zoom, cam.zoom);
  const shx = game.shake ? (Math.random() * 2 - 1) * game.shake / cam.zoom : 0;
  const shy = game.shake ? (Math.random() * 2 - 1) * game.shake / cam.zoom : 0;
  // snap the camera to whole screen pixels — subpixel compositing of the
  // big world layers causes shimmer and jank while the camera glides
  const camX = Math.round((cam.x - shx) * cam.zoom) / cam.zoom;
  const camY = Math.round((cam.y - shy) * cam.zoom) / cam.zoom;
  ctx.translate(-camX, -camY);

  // paper shadow + layers
  ctx.fillStyle = 'rgba(120,80,80,0.25)';
  ctx.fillRect(10, 12, WORLD.w, WORLD.h);
  ctx.drawImage(groundLayer, 0, 0);
  ctx.drawImage(paintCanvas, 0, 0);
  ctx.drawImage(topLayer, 0, 0);

  // zone-control capture circles, tinted by their current owner
  for (const z of game.zones) {
    const col = z.owner >= 0 ? TEAMS[z.owner].color : INK_LIGHT;
    ctx.fillStyle = z.owner >= 0 ? TEAMS[z.owner].color + '22' : 'rgba(128,128,128,0.06)';
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col;
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.arc(z.x, z.y, z.r, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    // little zone flag
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(z.x, z.y + 6); ctx.lineTo(z.x, z.y - 20); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(z.x, z.y - 20); ctx.lineTo(z.x + 15, z.y - 15); ctx.lineTo(z.x, z.y - 10);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }

  // pickups: bomb in a dashed circle (bobbing freezes while paused)
  for (const pk of game.pickups) {
    if (!game.browse) pk.bob += 0.03;
    const oy = Math.sin(pk.bob) * 3;
    ctx.strokeStyle = 'rgba(74,74,72,0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(pk.x, pk.y, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    if (pk.type === 'boots') drawBootsIcon(ctx, pk.x, pk.y + oy);
    else if (pk.type === 'shield') drawShieldIcon(ctx, pk.x, pk.y + oy);
    else drawBombIcon(ctx, pk.x, pk.y + oy);
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
    // active buffs: bubble shield ring, speed lines
    if (f.shieldT > 0) {
      ctx.strokeStyle = 'rgba(120,170,230,0.85)';
      ctx.fillStyle = 'rgba(150,200,240,0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(f.x, f.y - 2, 24 + Math.sin(game.elapsed * 6) * 1.5, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    if (f.boostT > 0) {
      ctx.strokeStyle = 'rgba(240,180,28,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const off of [-8, 0, 8]) {
        ctx.moveTo(f.x - 18, f.y + 10 + off * 0.4);
        ctx.lineTo(f.x - 28, f.y + 10 + off * 0.4);
      }
      ctx.stroke();
    }
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

  // skill drones
  Skills.draw(ctx, game);

  // transient juice: impact bursts + SPLAT! comic text
  for (const f of game.fx) {
    const k = f.t / f.dur;
    if (f.type === 'line') {
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 6 * (1 - k) + 1;
      ctx.beginPath();
      ctx.moveTo(f.x1, f.y1);
      ctx.lineTo(f.x2, f.y2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    } else if (f.type === 'burst') {
      const ease = 1 - (1 - k) * (1 - k);
      ctx.globalAlpha = 1 - k;
      ctx.strokeStyle = f.color;
      ctx.lineWidth = 2.5 * (1 - k) + 0.5;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r0 + (f.r1 - f.r0) * ease, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = f.color;
      for (let i = 0; i < f.drops; i++) {
        const a = f.seed + i * (Math.PI * 2 / f.drops);
        const d = f.r1 * (0.5 + ease * 0.9);
        ctx.beginPath();
        ctx.arc(f.x + Math.cos(a) * d, f.y + Math.sin(a) * d, 3 * (1 - k) + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (f.type === 'text') {
      const scale = Math.min(1, k * 4) * (1 + 0.3 * Math.sin(Math.min(1, k * 4) * Math.PI));
      ctx.save();
      ctx.translate(f.x, f.y - k * 16);
      ctx.rotate(-0.08);
      ctx.scale(scale, scale);
      ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      ctx.font = `italic 900 26px 'Archivo', 'Arial Black', sans-serif`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#fff';
      ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();

  // ambient weather overlay (screen space)
  Ambient.draw(ctx);

  // crosshair (drawn last, in screen space; hidden while sightseeing/touch)
  if (game.state === 'match' && !game.browse && !Touch.active) {
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
  if (game.state === 'match' || game.state === 'results' || game.demo) Ambient.update(dt);
  if (game.state === 'select') tickFighterCards(now);
  render();
  requestAnimationFrame(frame);
}

/* ---------------- boot ---------------- */

/* ---------------- settings panel ---------------- */

function renderSettingsPanel() {
  for (const el of document.querySelectorAll('#settings-panel .tgl')) {
    if (!el.dataset.key) continue;
    const on = !!Settings.data[el.dataset.key];
    el.classList.toggle('on', on);
    el.textContent = L(on ? 'ON' : 'OFF');
  }
  const lt = $('#lang-tgl');
  lt.textContent = Settings.data.lang === 'zh' ? '中文' : 'EN';
  const ub = $('#unlock-all-btn');
  ub.textContent = L(Campaign.unlockAll() ? 'RE-LOCK STAGES' : 'UNLOCK ALL STAGES');
}

/* re-render every piece of UI text in the active language */
function refreshLanguage() {
  setLang(Settings.data.lang);
  applyStaticI18n();
  buildStageCards();
  buildMapCards(game.stageIdx);
  buildFighterCards();
  updateDailyButton();
  updateTitleRecord();
  renderSettingsPanel();
  $('#browse-btn').textContent = L(game.browse ? 'BACK TO BATTLE' : 'BROWSE MAP');
}

function initSettingsUI() {
  const panel = $('#settings-panel');
  $('#settings-btn').addEventListener('click', () => {
    renderSettingsPanel();
    panel.classList.remove('hidden');
  });
  $('#settings-close').addEventListener('click', () => panel.classList.add('hidden'));
  panel.addEventListener('click', e => {
    if (e.target === panel) panel.classList.add('hidden');
    if (e.target.id === 'lang-tgl') {
      Settings.set('lang', Settings.data.lang === 'zh' ? 'en' : 'zh');
      refreshLanguage();
      return;
    }
    const tgl = e.target.closest('.tgl');
    if (tgl && tgl.dataset.key) {
      Settings.set(tgl.dataset.key, !Settings.data[tgl.dataset.key]);
      renderSettingsPanel();
    }
  });
  // the hidden bit: tap the panel title five times
  let taps = 0, tapTimer = null;
  $('#settings-title').addEventListener('click', () => {
    taps++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 1500);
    if (taps >= 5) {
      taps = 0;
      $('#unlock-all-btn').classList.remove('hidden');
      renderSettingsPanel();
    }
  });
  $('#unlock-all-btn').addEventListener('click', () => {
    Campaign.setUnlockAll(!Campaign.unlockAll());
    buildStageCards();
    renderSettingsPanel();
  });
}

function boot() {
  initHUD();
  Touch.init();
  Settings.apply();
  setLang(Settings.data.lang);
  applyStaticI18n();
  initSettingsUI();

  // background music unlocks on the first gesture (autoplay policy)
  const wakeAudio = () => {
    Music.start();
    removeEventListener('pointerdown', wakeAudio);
    removeEventListener('keydown', wakeAudio);
  };
  addEventListener('pointerdown', wakeAudio);
  addEventListener('keydown', wakeAudio);

  // installable/offline: register the service worker where allowed
  if ('serviceWorker' in navigator &&
      (location.protocol === 'https:' || location.hostname === 'localhost')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
  initTitleArt();
  buildStageCards();
  buildMapCards(game.stageIdx);
  buildFighterCards();
  attachSplatFX($('#screen-stages'));
  attachSplatFX($('#screen-title'));
  updateTitleRecord();
  updateDailyButton();

  // flow: title -> stage select -> map select -> fighter select -> match
  $('#play-btn').addEventListener('click', () => {
    game.state = 'stages';
    showScreen('#screen-stages');
  });
  $('#stage-cards').addEventListener('click', e => {
    const card = e.target.closest('.stage-card');
    if (!card) return;
    const idx = Number(card.dataset.stage);
    if (!Campaign.stageUnlocked(idx)) {
      card.classList.remove('deny');
      void card.offsetWidth;          // restart the shake if re-clicked
      card.classList.add('deny');
      // drop the class after the shake, or re-showing the screen replays it
      card.addEventListener('animationend', () => card.classList.remove('deny'), { once: true });
      return;
    }
    game.stageIdx = idx;
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
  $('#mode-row').addEventListener('click', e => {
    const pill = e.target.closest('.mode-pill');
    if (!pill) return;
    game.mode = pill.dataset.mode;
    for (const m of document.querySelectorAll('.mode-pill')) {
      m.classList.toggle('selected', m === pill);
    }
  });
  $('#difficulty-row').addEventListener('click', e => {
    const pill = e.target.closest('.diff-pill');
    if (!pill) return;
    game.difficulty = pill.dataset.diff;
    for (const p of document.querySelectorAll('.diff-pill')) {
      p.classList.toggle('selected', p === pill);
    }
  });
  $('#leave-btn').addEventListener('click', leaveMatch);
  $('#browse-btn').addEventListener('click', () => setBrowse(!game.browse));
  $('#daily-btn').addEventListener('click', startDailyMatch);
  $('#share-btn').addEventListener('click', () => downloadShareCard(game));
  $('#export-btn').addEventListener('click', () => {
    const btn = $('#export-btn');
    btn.disabled = true;
    btn.textContent = L('RECORDING…');
    Replay.exportWebM(() => {
      btn.disabled = false;
      btn.textContent = L('EXPORT WEBM');
    });
  });
  $('#again-btn').addEventListener('click', () => startMatch(game.player.team));
  $('#menu-btn').addEventListener('click', leaveMatch);
  attachDragScroll($('#stage-path'));

  // every button click gets a little pencil tick
  document.addEventListener('click', e => {
    if (e.target.closest('button')) SFX.play('click');
  }, true);

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
  if (params.has('lang')) { Settings.data.lang = params.get('lang'); refreshLanguage(); }
  if (params.has('mode') && MODES[params.get('mode')]) game.mode = params.get('mode');
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
  if (params.get('screen') === 'select') { game.state = 'select'; showScreen('#screen-select'); }
  if (params.get('screen') === 'maps') { buildMapCards(game.stageIdx); showScreen('#screen-maps'); }
  if (params.get('screen') === 'stages') showScreen('#screen-stages');

  // attract mode behind the menus (skipped for reduced motion / debug runs)
  if (auto === null && !prefersReducedMotion() && !params.has('nodemo')) {
    startDemoMatch();
    const dff = Number(params.get('dff')) || 0;   // debug: fast-forward the demo
    for (let i = 0; i < dff * 30; i++) update(1 / 30);
  }

  requestAnimationFrame(frame);
}

boot();
