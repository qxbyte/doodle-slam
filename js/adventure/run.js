'use strict';

/* ============================================================
   Adventure runtime — starts a level, drives the route
   (area unlock chain), enemy lifecycle, win/lose, and the
   guide arrow. game.adv = {
     level, zoneIdx, minions[], shots[], boss, done
   }. The career engine handles movement/paint/pickups; the
   red button, SLAM TIME and match clock stay out of the story.
   ============================================================ */

function startAdventureLevel(idx) {
  const lvl = ADV_LEVELS[idx];
  const mapIdx = MAPS.findIndex(m => m.name === lvl.map);
  if (mapIdx < 0) return;
  Replay.stop();
  game.demo = false;
  game.daily = false;
  game.mapIdx = mapIdx;
  setMap(mapIdx);
  Ambient.set(Settings.data.ambient ? CURRENT_MAP.ambient : null);
  Music.setMood(lvl.route.some(z => z.boss) ? 'volcano' : CURRENT_MAP.mood);
  initPaint();
  const team = Adventure.team;
  game.fighters = [new Fighter(team, true)];
  game.player = game.fighters[0];
  resetMatchState();
  game.adventure = null;          // (legacy field; adv is the story runtime)
  game.timeLeft = 9999;           // no clock in the story — dodging is the game
  game.button.nextAt = Infinity;  // no red button either
  game.pickups = [];

  const rng = makeRng(CURRENT_MAP.seed + idx * 77);
  const adv = game.adv = { level: idx, zoneIdx: 0, minions: [], shots: [], boss: null, done: false };
  lvl.route.forEach((zone, zi) => {
    for (let k = 0; k < zone.foes; k++) {
      const m = new AdvMinion(zone, lvl.tier, rng);
      m.zoneIdx = zi;
      adv.minions.push(m);
    }
    if (zone.boss) adv.boss = new AdvBoss(zone.boss, zone);
  });

  // the hero starts at the route's doorstep, not a corner
  const z0 = lvl.route[0];
  const start = collideWorld(z0.x - z0.r - 120, z0.y, FIGHTER_RADIUS);
  game.player.x = start.x;
  game.player.y = start.y;
  SPAWNS[team] = { x: start.x, y: start.y };   // deaths return to progress, not a corner

  // the legendary weapon waits somewhere along the way
  const mid = lvl.route[Math.floor(lvl.route.length / 2)];
  const ws = collideWorld(mid.x + rand(rng, -mid.r, mid.r) * 0.5, mid.y + rand(rng, -mid.r, mid.r) * 0.5, 20);
  game.pickups.push({ x: ws.x, y: ws.y, type: 'weapon', bob: 0 });

  Adventure.markStarted(idx);
  game.newBest = false;
  Replay.reset();
  ui.feed.innerHTML = '';
  setWeaponNote(team);
  setBrowse(false);
  game.state = 'match';
  showScreen(null);
  SFX.play('start');
  pushToast(`${L('LEVEL')} ${idx + 1} · ${lvl.name}`);
}

function updateAdventureRun(dt) {
  const adv = game.adv;
  if (adv.done) return;
  const lvl = ADV_LEVELS[adv.level];
  const route = lvl.route;
  const zone = route[adv.zoneIdx];
  const p = game.player;

  // stepping into the active area wakes its patrol (and the boss)
  if (zone && p.alive && dist(p.x, p.y, zone.x, zone.y) < zone.r) {
    let woke = false;
    for (const m of adv.minions) {
      if (m.zoneIdx === adv.zoneIdx && !m.awake) { m.awake = true; woke = true; }
    }
    if (zone.boss && adv.boss && !adv.boss.awake) {
      adv.boss.awake = true;
      woke = true;
      pushToast(L('THE ERASER wakes up!'), 'danger');
      SFX.play('rocketWarn');
      addShake(8);
    } else if (woke) {
      pushToast(L('Ambush! Splat them all!'), 'warn');
      SFX.play('rocketWarn');
    }
  }

  // enemies
  for (const m of adv.minions) m.update(game, dt);
  if (adv.boss) adv.boss.update(game, dt);
  updateAdvShots(game, dt);

  // area cleared?
  if (zone) {
    const left = adv.minions.filter(m => m.zoneIdx === adv.zoneIdx).length;
    const bossHere = zone.boss && adv.boss;
    if (left === 0 && (!bossHere || adv.boss.hp <= 0)) {
      // light it up: a celebratory ring of the hero's colour
      for (let k = 0; k < 5; k++) {
        const a = k / 5 * Math.PI * 2;
        splat(zone.x + Math.cos(a) * zone.r * 0.5, zone.y + Math.sin(a) * zone.r * 0.5,
              rand(Math.random, 50, 80), p.team);
      }
      addFx({ type: 'burst', x: zone.x, y: zone.y, r1: zone.r * 0.8, drops: 12, dur: 0.6, color: TEAMS[p.team].color });
      SFX.play('button');
      SPAWNS[p.team] = { x: zone.x, y: zone.y };   // progress checkpoint
      adv.zoneIdx++;
      if (adv.zoneIdx >= route.length) {
        adv.done = true;
        endAdventureLevel(true);
        return;
      }
      pushToast(L('Area clear! Follow the arrow.'));
    }
  }
}

/* projectile / bomb damage against story enemies */
function advHitEnemies(game, x, y, r, dmg) {
  const adv = game.adv;
  if (!adv) return false;
  let hit = false;
  for (let i = adv.minions.length - 1; i >= 0; i--) {
    const m = adv.minions[i];
    if (dist(x, y, m.x, m.y) < r + ADV_MINION_RADIUS) {
      m.awake = true;
      if (m.hurt(game, dmg)) adv.minions.splice(i, 1);
      hit = true;
    }
  }
  if (adv.boss && adv.boss.hp > 0 && dist(x, y, adv.boss.x, adv.boss.y) < r + adv.boss.radius) {
    adv.boss.hurt(game, dmg);
    hit = true;
  }
  return hit;
}

function endAdventureLevel(win) {
  if (win) Adventure.markCleared(game.adv.level);
  game.state = 'results';
  setBrowse(false);
  setPauseMenu(false);
  SFX.play(win ? 'slam' : 'end');
  showLevelEnd(win);
}

/* the HUD objective line */
function advGoalText(game) {
  const adv = game.adv;
  const lvl = ADV_LEVELS[adv.level];
  const zone = lvl.route[adv.zoneIdx];
  if (!zone) return '';
  if (zone.boss && adv.boss) {
    return `${L('BOSS')} ${Math.max(0, Math.ceil(adv.boss.hp))} / ${adv.boss.maxHp} HP`;
  }
  const left = adv.minions.filter(m => m.zoneIdx === adv.zoneIdx).length;
  return `${L('AREA')} ${adv.zoneIdx + 1} / ${lvl.route.length} · ${left} ${L('foes left')}`;
}

/* world-space guide: dashed ring on the active area + an arrow
   from the hero pointing at it when it is off ahead */
function drawAdventureGuide(ctx, game) {
  const adv = game.adv;
  const lvl = ADV_LEVELS[adv.level];
  const zone = lvl.route[adv.zoneIdx];
  if (!zone) return;
  ctx.strokeStyle = zone.boss ? 'rgba(230,57,42,0.75)' : 'rgba(47,102,224,0.65)';
  ctx.lineWidth = 4;
  ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.arc(zone.x, zone.y, zone.r, game.elapsed * 0.4, game.elapsed * 0.4 + Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  const p = game.player;
  const d = dist(p.x, p.y, zone.x, zone.y);
  if (d > zone.r + 60) {
    const a = Math.atan2(zone.y - p.y, zone.x - p.x);
    const bob = Math.sin(game.elapsed * 5) * 6;
    const ax = p.x + Math.cos(a) * (52 + bob), ay = p.y + Math.sin(a) * (52 + bob);
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(a);
    ctx.fillStyle = zone.boss ? '#e6392a' : '#2f66e0';
    ctx.strokeStyle = '#1c1c1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(14, 0); ctx.lineTo(-8, -9); ctx.lineTo(-3, 0); ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}
