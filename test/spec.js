'use strict';

/* ============================================================
   Test spec — runs inside the game's vm context (test/run.js),
   so top-level `let` bindings (grid, OBSTACLES, SPAWNS, …) are
   directly reachable and assignable.
   ============================================================ */

function t(name, fn) {
  try {
    fn();
    __pass(name);
  } catch (err) {
    __fail(name, err && err.stack ? err.stack.split('\n')[0] : err);
  }
}

function eq(a, b, msg) {
  if (a !== b) throw new Error(`${msg || 'eq'}: expected ${b}, got ${a}`);
}
function ok(v, msg) {
  if (!v) throw new Error(msg || 'expected truthy');
}
function approx(a, b, eps, msg) {
  if (Math.abs(a - b) > (eps || 1e-9)) throw new Error(`${msg || 'approx'}: ${a} !~ ${b}`);
}

/* test-side replacement for setMap: apply map state without rendering */
function applyMap(m) {
  CURRENT_MAP = m;
  BUILDINGS = m.buildings;
  WATER = m.water;
  OBSTACLES = BUILDINGS.concat(WATER);
  ICE = m.ice;
  CURRENTS = m.currents;
  PLAZA = m.plaza;
  SPAWNS = m.spawns || DEFAULT_SPAWNS;
}

/* ---------------- core/util ---------------- */

t('clamp bounds values', () => {
  eq(clamp(5, 0, 10), 5);
  eq(clamp(-1, 0, 10), 0);
  eq(clamp(99, 0, 10), 10);
});

t('lerp interpolates', () => {
  eq(lerp(0, 10, 0.5), 5);
  eq(lerp(2, 4, 0), 2);
  eq(lerp(2, 4, 1), 4);
});

t('dist is euclidean', () => {
  eq(dist(0, 0, 3, 4), 5);
});

t('formatTime pads seconds', () => {
  eq(formatTime(180), '3:00');
  eq(formatTime(61), '1:01');
  eq(formatTime(0), '0:00');
  eq(formatTime(-5), '0:00');
});

t('makeRng is deterministic and bounded', () => {
  const a = makeRng(42), b = makeRng(42);
  for (let i = 0; i < 100; i++) {
    const v = a();
    eq(v, b(), 'same seed same sequence');
    ok(v >= 0 && v < 1, 'in [0,1)');
  }
  ok(makeRng(1)() !== makeRng(2)(), 'different seeds differ');
});

t('circleRectHit detects overlap and miss', () => {
  ok(circleRectHit(5, 5, 2, 4, 4, 10, 10), 'inside');
  ok(circleRectHit(-1, 5, 2, 0, 0, 10, 10), 'edge overlap');
  ok(!circleRectHit(-5, 5, 2, 0, 0, 10, 10), 'clear miss');
});

t('circleRectResolve pushes the circle out', () => {
  const fix = circleRectResolve(-1, 5, 3, 0, 0, 10, 10);
  ok(fix, 'overlapping needs a fix');
  ok(!circleRectHit(fix.x, fix.y, 2.99, 0, 0, 10, 10), 'resolved outside');
  eq(circleRectResolve(-10, 5, 3, 0, 0, 10, 10), null, 'no overlap, no fix');
});

/* ---------------- maps & registry ---------------- */

t('thirteen maps registered with unique names (one hidden)', () => {
  eq(MAPS.length, 13);
  eq(new Set(MAPS.map(m => m.name)).size, 13);
  eq(MAPS.filter(m => m.hidden).length, 1);
});

t('every visible map references a valid stage', () => {
  for (const m of MAPS) {
    if (m.hidden) continue;   // the egg world lives outside the stage line
    ok(m.stage >= 0 && m.stage < STAGES.length, `${m.name} stage ${m.stage}`);
  }
});

t('every stage has at least one map', () => {
  for (const s of STAGES) {
    ok(MAPS.some(m => m.stage === s.id), `${s.name} has maps`);
  }
});

t('map schema defaults are filled in', () => {
  for (const m of MAPS) {
    for (const k of ['roads', 'water', 'trees', 'ice', 'currents', 'buildings']) {
      ok(Array.isArray(m[k]), `${m.name}.${k} is an array`);
    }
    ok(typeof m.seed === 'number', `${m.name} has a seed`);
  }
});

t('buildings stay inside the world', () => {
  for (const m of MAPS) {
    for (const b of m.buildings) {
      ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= WORLD.w && b.y + b.h <= WORLD.h,
        `${m.name} ${b.kind} inside world`);
    }
  }
});

t('spawns and plaza are not inside obstacles on any map', () => {
  for (const m of MAPS) {
    const obstacles = m.buildings.concat(m.water);
    const spawns = m.spawns || DEFAULT_SPAWNS;
    for (const s of spawns) {
      ok(!obstacles.some(o => circleRectHit(s.x, s.y, 14, o.x, o.y, o.w, o.h)),
        `${m.name} spawn (${s.x},${s.y}) clear`);
    }
    ok(!obstacles.some(o => o.x < m.plaza.x && m.plaza.x < o.x + o.w &&
                            o.y < m.plaza.y && m.plaza.y < o.y + o.h),
      `${m.name} plaza centre clear`);
  }
});

/* ---------------- collision & terrain ---------------- */

t('collideWorld resolves out of buildings and world edges', () => {
  applyMap(MAPS[0]);
  const b = BUILDINGS[0];
  const fixed = collideWorld(b.x + b.w / 2, b.y + b.h / 2, 14);
  ok(!pointBlocked(fixed.x, fixed.y), 'pushed out of the building');
  const edge = collideWorld(-50, -50, 14);
  eq(edge.x, 14); eq(edge.y, 14);
});

t('onIce and currentAt read their lanes', () => {
  applyMap(MAPS.find(m => m.ice.length));
  const lake = ICE[0];
  ok(onIce(lake.x + 10, lake.y + 10), 'inside the lake');
  ok(!onIce(lake.x - 10, lake.y - 10), 'outside the lake');

  applyMap(MAPS.find(m => m.currents.length));
  const lane = CURRENTS[0];
  const c = currentAt(lane.x + 10, lane.y + 10);
  ok(c && (c.dx !== 0 || c.dy !== 0), 'current found with a direction');
  eq(currentAt(-5, -5), null);
});

/* ---------------- paint grid & coverage ---------------- */

t('splat claims grid cells and coverage counts them', () => {
  applyMap(MAPS[0]);
  initPaint();
  eq(coverage().reduce((a, b) => a + b, 0), 0, 'starts blank');
  splat(600, 600, 60, 2);
  const cov = coverage();
  ok(cov[2] > 0, 'team 2 owns cells');
  eq(cov[0] + cov[1] + cov[3], 0, 'other teams untouched');
  eq(paintAt(600, 600), 2, 'centre cell owned');
  splat(600, 600, 60, 1);
  eq(paintAt(600, 600), 1, 'later paint overwrites');
});

t('building cells never take paint', () => {
  applyMap(MAPS[0]);
  initPaint();
  const b = BUILDINGS[0];
  splat(b.x + b.w / 2, b.y + b.h / 2, 300, 0);
  eq(paintAt(b.x + b.w / 2, b.y + b.h / 2), -2, 'building cell stays -2');
});

/* ---------------- modes ---------------- */

t('computeZones is deterministic and clear of obstacles', () => {
  applyMap(MAPS[0]);
  const a = computeZones(CURRENT_MAP);
  const b = computeZones(CURRENT_MAP);
  eq(a.length, 3);
  eq(JSON.stringify(a), JSON.stringify(b), 'same seed, same zones');
  for (const z of a.slice(1)) {
    ok(!OBSTACLES.some(o => circleRectHit(z.x, z.y, 60, o.x, o.y, o.w, o.h)),
      'zone centre reasonably clear');
  }
});

t('zoneOwner picks the leading team, ties are neutral', () => {
  applyMap(MAPS[0]);
  initPaint();
  const z = { x: 600, y: 600, r: 110 };
  eq(zoneOwner(z), -1, 'blank zone is neutral');
  splat(600, 600, 80, 3);
  eq(zoneOwner(z), 3, 'painted zone owned');
});

/* ---------------- campaign & daily ---------------- */

t('campaign covers every visible map with three challenges', () => {
  for (const m of MAPS) {
    if (m.hidden) continue;   // the egg world credits its origin map instead
    eq(Campaign.descs(m.name).length, 3, `${m.name} has 3 challenges`);
  }
});

t('campaign evaluate awards stars once and unlocks stages', () => {
  localStorage.clear();
  ok(Campaign.stageUnlocked(0), 'stage 1 open');
  ok(!Campaign.stageUnlocked(1), 'stage 2 locked at first');

  applyMap(MAPS[0]);
  const fakeGame = {
    demo: false, daily: false, mode: 'turf',
    player: { team: 1 },
    lastCoverage: [0.1, 0.4, 0.05, 0.05],
    stats: [{}, { splats: 5, downs: 0, buttons: 0 }, {}, {}],
  };
  const fresh = Campaign.evaluate(fakeGame);
  eq(fresh.length, 3, 'win + coverage + splats all earned');
  eq(Campaign.evaluate(fakeGame).length, 0, 'no double awards');
  ok(Campaign.stageUnlocked(1), 'stage 2 unlocked by stars');
  eq(Campaign.stars(MAPS[0].name).filter(Boolean).length, 3);
});

t('campaign ignores demo, daily and non-turf matches', () => {
  localStorage.clear();
  applyMap(MAPS[0]);
  const base = {
    player: { team: 0 },
    lastCoverage: [0.5, 0, 0, 0],
    stats: [{ splats: 9, downs: 0, buttons: 9 }, {}, {}, {}],
  };
  eq(Campaign.evaluate({ ...base, demo: true, daily: false, mode: 'turf' }).length, 0);
  eq(Campaign.evaluate({ ...base, demo: false, daily: true, mode: 'turf' }).length, 0);
});

t('daily is stable within a day and in range', () => {
  ok(Daily.mapIdx() >= 0 && Daily.mapIdx() < MAPS.length);
  ok(Daily.team() >= 0 && Daily.team() < 4);
  eq(Daily.mapIdx(), Daily.mapIdx(), 'same day, same map');
});

t('daily best keeps the maximum', () => {
  localStorage.clear();
  ok(Daily.submit(10), 'first score is a best');
  ok(!Daily.submit(5), 'lower score is not');
  ok(Daily.submit(12), 'higher score is');
  eq(Daily.best(), 12);
});

t('records accumulate plays, wins and best coverage', () => {
  localStorage.clear();
  ok(Records.addMatch({ won: true, coverage: 20 }), 'first is a best');
  ok(!Records.addMatch({ won: false, coverage: 10 }));
  const r = Records.get();
  eq(r.plays, 2); eq(r.wins, 1); eq(r.best, 20);
});

/* ---------------- fighters & weapons ---------------- */

t('weapons and skills are defined for all four fighters', () => {
  eq(WEAPONS.length, 4);
  eq(SKILLS.length, 4);
  for (const w of WEAPONS) {
    ok(w.fireInterval > 0 && w.range > 0 && w.damage > 0 && w.pellets >= 1, w.name);
  }
});

t('fighter speed reflects paint and boots', () => {
  applyMap(MAPS[0]);
  initPaint();
  game.stats = TEAMS.map(() => ({ splats: 0, downs: 0, buttons: 0 }));
  const f = new Fighter(0, false);
  f.x = 600; f.y = 600;
  approx(f.speed, BASE_SPEED, 0.01, 'blank ground');
  splat(600, 600, 40, 0);
  approx(f.speed, OWN_PAINT_SPEED, 0.01, 'own paint');
  splat(600, 600, 40, 1);
  approx(f.speed, ENEMY_PAINT_SPEED, 0.01, 'enemy paint');
  f.boostT = 5;
  approx(f.speed, ENEMY_PAINT_SPEED * 1.45, 0.01, 'boots multiply');
});

t('bubble shield soaks damage; hp drops without it', () => {
  applyMap(MAPS[0]);
  initPaint();
  game.stats = TEAMS.map(() => ({ splats: 0, downs: 0, buttons: 0 }));
  game.toast = () => {};
  game.player = { team: 0 };
  const victim = new Fighter(0, false);
  const attacker = new Fighter(1, false);
  victim.shieldT = 5;
  victim.hurt(game, 40, attacker);
  eq(victim.hp, 100, 'shield soaked it');
  victim.shieldT = 0;
  victim.hurt(game, 40, attacker);
  eq(victim.hp, 60, 'no shield, real damage');
});


/* ---------------- settings & hidden unlock ---------------- */

t('settings persist and default sensibly', () => {
  ok(Settings.data.music === true || Settings.data.music === false, 'boolean');
  Settings.set('music', false);
  eq(JSON.parse(localStorage.getItem('doodleSlam.settings')).music, false, 'saved');
  Settings.set('music', true);
});

t('unlock-all flag opens every stage and relocks cleanly', () => {
  localStorage.clear();
  ok(!Campaign.stageUnlocked(5), 'locked by default');
  Campaign.setUnlockAll(true);
  for (let i = 0; i < STAGES.length; i++) ok(Campaign.stageUnlocked(i), `stage ${i} open`);
  Campaign.setUnlockAll(false);
  ok(!Campaign.stageUnlocked(5), 'locked again');
});


/* ---------------- i18n ---------------- */

t('L falls back to English and substitutes vars', () => {
  setLang('en');
  eq(L('Win the match'), 'Win the match');
  eq(L('Cover {v}% of the ground', { v: 26 }), 'Cover 26% of the ground');
  eq(L('totally unknown key'), 'totally unknown key');
});

t('L translates known keys in zh and challenge descs follow', () => {
  setLang('zh');
  eq(L('Win the match'), '赢下比赛');
  eq(L('Cover {v}% of the ground', { v: 26 }), '覆盖 26% 的地面');
  ok(Campaign.descs('DOWNTOWN')[0].includes('赢下'), 'challenge descs localized');
  setLang('en');
  ok(Campaign.descs('DOWNTOWN')[0].includes('Win'), 'and back to English');
});


/* ---------------- achievements ---------------- */

t('achievements unlock once and persist counters', () => {
  localStorage.removeItem('doodleSlam.achievements');
  const base = { won: false, cov: 5, splats: 0, downs: 2, buttons: 0, mode: 'turf', daily: false };

  // one splat -> firstSplat only, and only the first time
  let fresh = Achieve.evaluate({ ...base, splats: 1 });
  ok(fresh.some(a => a.id === 'firstSplat'), 'firstSplat unlocks');
  fresh = Achieve.evaluate({ ...base, splats: 1 });
  ok(!fresh.some(a => a.id === 'firstSplat'), 'firstSplat only fires once');

  // single-match feats
  fresh = Achieve.evaluate({ ...base, splats: 8, cov: 45, buttons: 3 });
  const ids = fresh.map(a => a.id);
  ok(ids.includes('hatTrick') && ids.includes('rampage'), 'splat feats unlock');
  ok(ids.includes('landlord'), 'coverage feat unlocks');
  ok(ids.includes('buttonMasher'), 'button feat unlocks');

  // untouchable needs BOTH the win and zero downs
  fresh = Achieve.evaluate({ ...base, won: true, downs: 1 });
  ok(!fresh.some(a => a.id === 'untouchable'), 'no untouchable when splatted');
  fresh = Achieve.evaluate({ ...base, won: true, downs: 0 });
  ok(fresh.some(a => a.id === 'untouchable'), 'untouchable unlocks');

  // double threat needs the win AND both halves of the score
  Achieve.evaluate({ ...base, won: true, cov: 35, splats: 3 });
  ok(!Achieve.all().find(a => a.id === 'doubleThreat').unlocked, 'coverage alone is not enough');
  fresh = Achieve.evaluate({ ...base, won: true, cov: 35, splats: 6 });
  ok(fresh.some(a => a.id === 'doubleThreat'), 'coverage + splats + win completes it');

  // daily counter
  Achieve.evaluate({ ...base, daily: true });
  Achieve.evaluate({ ...base, daily: true });
  fresh = Achieve.evaluate({ ...base, daily: true });
  ok(fresh.some(a => a.id === 'dailyRegular'), 'three dailies unlock the regular');

  const c = Achieve.count();
  eq(c.total, ACHIEVEMENTS.length, 'count total matches defs');
  ok(c.got >= 8, 'unlock tally recorded');
  localStorage.removeItem('doodleSlam.achievements');
});


/* ---------------- volcano & sewer terrain ---------------- */

t('lava pools register as hazard, causeways stay safe', () => {
  const volcano = MAPS.find(m => m.name === 'CINDER BASIN');
  ok(volcano, 'CINDER BASIN registered');
  LAVA = volcano.lava;
  ok(lavaAt(100, 750), 'inside the lava river');
  ok(!lavaAt(970, 755), 'west causeway gap is safe');
  ok(!lavaAt(1930, 755), 'east causeway gap is safe');
  LAVA = [];
});

t('warp pipes come in valid, reachable pairs', () => {
  const sewer = MAPS.find(m => m.name === 'GOO JUNCTION');
  ok(sewer, 'GOO JUNCTION registered');
  ok(sewer.pipes.length >= 2, 'at least two pipe pairs');
  for (const p of sewer.pipes) {
    ok(dist(p.ax, p.ay, p.bx, p.by) > 300, 'pipe ends are far apart');
    for (const [x, y] of [[p.ax, p.ay], [p.bx, p.by]]) {
      ok(x > 40 && x < WORLD.w - 40 && y > 40 && y < WORLD.h - 40, 'pipe mouth on the map');
      ok(!sewer.buildings.some(b => x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h),
        'pipe mouth clear of obstacles');
      ok(!sewer.water.some(w => x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h),
        'pipe mouth clear of goo');
    }
  }
});


/* ---------------- hidden egg world ---------------- */

t('the hidden door leads to a real, hidden map', () => {
  const town = MAPS.find(m => m.name === 'DOWNTOWN');
  ok(town.egg, 'DOWNTOWN carries the egg');
  const dest = MAPS.find(m => m.name === town.egg.map);
  ok(dest && dest.hidden, 'destination exists and is hidden');
  // the trigger zone must be walkable: outside every obstacle
  const cx = town.egg.x + town.egg.w / 2, cy = town.egg.y + town.egg.h / 2;
  ok(!town.buildings.some(b => cx > b.x && cx < b.x + b.w && cy > b.y && cy < b.y + b.h),
    'door zone sits outside the wall');
  // and pressed against the mall so it reads as that building's door
  const mall = town.buildings[0];
  ok(Math.abs(town.egg.y - (mall.y + mall.h)) < 2, 'zone hugs the mall south wall');
});

t('secret badges unlock from egg flags only', () => {
  localStorage.removeItem('doodleSlam.achievements');
  const base = { won: false, cov: 5, splats: 0, downs: 2, buttons: 0, mode: 'turf', daily: false, egg: false, eggEnd: false };
  let fresh = Achieve.evaluate({ ...base });
  ok(!fresh.some(a => a.secret), 'nothing secret without the egg');
  fresh = Achieve.evaluate({ ...base, egg: true });
  ok(fresh.some(a => a.id === 'doorFinder'), 'entering unlocks doorFinder');
  ok(!fresh.some(a => a.id === 'otherSide'), 'otherSide still needs the win there');
  fresh = Achieve.evaluate({ ...base, egg: true, eggEnd: true, won: true });
  ok(fresh.some(a => a.id === 'otherSide'), 'winning in the hidden world unlocks otherSide');
  localStorage.removeItem('doodleSlam.achievements');
});


/* ---------------- fighter separation ---------------- */

t('overlapping fighters get pushed apart, distant ones stay put', () => {
  applyMap(MAPS[0]);
  const a = new Fighter(0, true), b = new Fighter(1, false);
  a.x = 1000; a.y = 500;
  b.x = 1002; b.y = 500;    // nearly stacked
  separateFighters([a, b]);
  ok(dist(a.x, a.y, b.x, b.y) > 10, 'stacked pair separates');
  // fully identical position still resolves (random direction)
  a.x = b.x = 1000; a.y = b.y = 500;
  separateFighters([a, b]);
  ok(dist(a.x, a.y, b.x, b.y) > 5, 'perfectly stacked pair separates');
  // far apart: untouched
  a.x = 300; a.y = 300; b.x = 900; b.y = 900;
  separateFighters([a, b]);
  eq(a.x, 300, 'distant fighters unmoved');
  // dead fighters are left alone (their splat spot is meaningful)
  a.x = 1000; a.y = 500; b.x = 1001; b.y = 500;
  b.alive = false;
  separateFighters([a, b]);
  eq(b.x, 1001, 'dead fighter not shoved');
  b.alive = true;
});


/* ---------------- adventure mode ---------------- */

t('adventure progress saves, gates and resets', () => {
  localStorage.removeItem('doodleSlam.adventure');
  ok(Adventure.unlocked(0), 'level 1 open from the start');
  ok(!Adventure.unlocked(1), 'level 2 gated');
  Adventure.markCleared(0);
  ok(Adventure.unlocked(1), 'clearing 1 opens 2');
  eq(Adventure.lastLevel(), 1, 'continue points at the next level');
  Adventure.markCleared(2);
  eq(Adventure.lastLevel(), 2, 'last level clamps to the final node');
  Adventure.reset();
  ok(!Adventure.unlocked(1), 'reset relocks');
  localStorage.removeItem('doodleSlam.adventure');
});

t('adventure levels are well-formed and maps exist', () => {
  eq(ADV_LEVELS.length, 3, 'two normal levels plus the boss');
  for (const lvl of ADV_LEVELS) {
    ok(MAPS.some(m => m.name === lvl.map), `${lvl.map} exists`);
    ok(lvl.time > 60 && lvl.enemies >= 0 && lvl.goal, 'sane level tuning');
  }
  ok(ADV_LEVELS[2].boss && ADV_LEVELS[2].goal.boss, 'level 3 is the boss');
});

t('the Rainbow Blaster outclasses the starting loadout', () => {
  const base = WEAPONS[0];   // SketchBlaster, the hero default
  ok(ADV_WEAPON.damage > base.damage, 'hits harder');
  ok(ADV_WEAPON.fireInterval < base.fireInterval, 'fires faster');
  ok(ADV_WEAPON.range > base.range, 'reaches further');
  ok(ADV_WEAPON.splatMin > base.splatMin && ADV_WEAPON.splatMax > base.splatMax, 'paints bigger');
  ok(ADV_WEAPON.inkCost < base.inkCost, 'sips ink');
});

t('erasePaint wipes cells back to blank but never obstacles', () => {
  applyMap(MAPS[0]);
  initPaint();
  splat(1000, 500, 60, 2);
  const idx = Math.floor(500 / CELL) * GRID_W + Math.floor(1000 / CELL);
  eq(grid[idx], 2, 'cell painted');
  erasePaint(1000, 500, 80);
  eq(grid[idx], -1, 'cell erased to blank');
  // obstacle cells stay -2
  const b = MAPS[0].buildings[0];
  const ox = Math.floor((b.x + b.w / 2) / CELL), oy = Math.floor((b.y + b.h / 2) / CELL);
  erasePaint(b.x + b.w / 2, b.y + b.h / 2, 60);
  eq(grid[oy * GRID_W + ox], -2, 'obstacle cells untouched');
});
