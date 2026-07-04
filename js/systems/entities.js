'use strict';

/* ============================================================
   Fighters, projectiles, bombs, pickups, rockets, red button.
   Each fighter carries their team's weapon (see core/teams.js).
   ============================================================ */

const FIGHTER_RADIUS = 14;
const BASE_SPEED = 175;
const OWN_PAINT_SPEED = 235;
const ENEMY_PAINT_SPEED = 115;
const INK_REGEN = 14;
const INK_REGEN_OWN = 38;

/* Bot tuning per difficulty, chosen on the fighter-select screen */
const DIFFICULTY = {
  easy:   { aimNoise: 0.26, detect: 220, burstWindow: 0.7, bombProb: 0.004 },
  normal: { aimNoise: 0.12, detect: 300, burstWindow: 1.0, bombProb: 0.010 },
  hard:   { aimNoise: 0.05, detect: 400, burstWindow: 1.4, bombProb: 0.022 },
};

/* Bot personalities — one is rolled per bot per match, so every
   lobby plays out differently. Multipliers stack on DIFFICULTY.
     rusher:  hunts the nearest fighter and trades paint eagerly
     farmer:  quietly rolls turf, backs away from fights
     presser: sprints for the red button from anywhere on the map
     avenger: remembers who splatted them and goes after them */
const PERSONAS = {
  rusher:  { detect: 1.5, hunts: true,  grudge: false, shy: false, buttonPull: 0.5,  burst: 1.5, bomb: 1.6 },
  farmer:  { detect: 0.6, hunts: false, grudge: false, shy: true,  buttonPull: 0.25, burst: 0.6, bomb: 0.5 },
  presser: { detect: 0.9, hunts: false, grudge: false, shy: false, buttonPull: 3.0,  burst: 1.0, bomb: 1.0 },
  avenger: { detect: 1.2, hunts: true,  grudge: true,  shy: false, buttonPull: 0.6,  burst: 1.1, bomb: 1.3 },
};

class Fighter {
  constructor(teamId, isPlayer) {
    this.team = teamId;
    this.isPlayer = isPlayer;
    this.name = TEAMS[teamId].name;
    this.weapon = WEAPONS[teamId];
    this.hp = 100;
    this.ink = 100;
    this.bombs = 1;
    this.alive = true;
    this.respawnTimer = 0;
    this.fireCooldown = 0;
    this.aim = 0;
    this.walkPhase = 0;
    this.firingVisual = 0;
    this.vx = 0;           // carried momentum, only matters on ice
    this.vy = 0;
    this.skillUses = 2;    // active skill charges (Q)
    this.dashT = 0;        // Ram Dash time remaining
    this.boostT = 0;       // speed boots buff
    this.shieldT = 0;      // bubble shield buff
    const s = SPAWNS[teamId];
    this.x = s.x; this.y = s.y;
    // bot brain
    this.botTarget = randomOpenSpot();
    this.botRetargetIn = 0;
    this.botBurst = 0;
    this.persona = PERSONAS[pick(Math.random, Object.keys(PERSONAS))];
    this.grudge = null;    // who splatted me last (avenger fuel)
    this.warpT = 0;        // warp-pipe cooldown
    this.lavaTick = 0;     // lava sizzle fx throttle
  }

  get speed() {
    const p = paintAt(this.x, this.y);
    const base = p === this.team ? OWN_PAINT_SPEED : p >= 0 ? ENEMY_PAINT_SPEED : BASE_SPEED;
    return this.boostT > 0 ? base * 1.45 : base;
  }

  /* ocean currents sweep anyone standing in them */
  applyCurrent(dt) {
    const c = currentAt(this.x, this.y);
    if (!c) return;
    const fixed = collideWorld(this.x + c.dx * 130 * dt, this.y + c.dy * 130 * dt, FIGHTER_RADIUS);
    this.x = fixed.x; this.y = fixed.y;
  }

  move(dx, dy, dt) {
    const len = Math.hypot(dx, dy);
    const sp = this.speed;
    this.applyCurrent(dt);

    if (onIce(this.x, this.y)) {
      // skating: momentum carries, steering is slow, feet can't brake
      const max = sp * 1.25;
      if (len > 0) {
        this.vx += (dx / len) * max * 2.0 * dt;
        this.vy += (dy / len) * max * 2.0 * dt;
      }
      const cur = Math.hypot(this.vx, this.vy);
      if (cur > max) { this.vx *= max / cur; this.vy *= max / cur; }
      const drag = Math.max(0, 1 - 0.45 * dt);
      this.vx *= drag; this.vy *= drag;
      const fixed = collideWorld(this.x + this.vx * dt, this.y + this.vy * dt, FIGHTER_RADIUS);
      this.x = fixed.x; this.y = fixed.y;
      this.walkPhase += dt * (Math.hypot(this.vx, this.vy) / BASE_SPEED);
      return;
    }

    if (len > 0) {
      const nx = this.x + (dx / len) * sp * dt;
      const ny = this.y + (dy / len) * sp * dt;
      const fixed = collideWorld(nx, ny, FIGHTER_RADIUS);
      this.x = fixed.x; this.y = fixed.y;
      this.walkPhase += dt * (sp / BASE_SPEED);
      // remember momentum so stepping onto ice keeps the glide
      this.vx = (dx / len) * sp;
      this.vy = (dy / len) * sp;
    } else {
      this.vx = this.vy = 0;
    }
  }

  tryFire(game, dt) {
    this.fireCooldown -= dt;
    const w = this.weapon;
    if (this.fireCooldown > 0 || this.ink < w.inkCost) return;
    this.fireCooldown = w.fireInterval;
    this.ink -= w.inkCost;
    this.firingVisual = 0.1;
    for (let i = 0; i < w.pellets; i++) {
      const a = this.aim + rand(Math.random, -w.spread, w.spread);
      game.projectiles.push({
        x: this.x + Math.cos(a) * 18,
        y: this.y + Math.sin(a) * 18,
        vx: Math.cos(a) * w.projSpeed,
        vy: Math.sin(a) * w.projSpeed,
        team: this.team,
        owner: this,
        dmg: w.damage,
        sMin: w.splatMin,
        sMax: w.splatMax,
        life: w.range / w.projSpeed * rand(Math.random, 0.75, 1.1),
      });
    }
    if (this.isPlayer) SFX.play(w.sound);
  }

  throwBomb(game, tx, ty) {
    if (this.bombs <= 0 || !this.alive) return false;
    this.bombs--;
    const d = Math.min(dist(this.x, this.y, tx, ty), 420);
    const a = Math.atan2(ty - this.y, tx - this.x);
    game.bombs.push({
      x: this.x, y: this.y,
      tx: this.x + Math.cos(a) * d, ty: this.y + Math.sin(a) * d,
      t: 0, dur: 0.7,
      team: this.team, owner: this,
    });
    SFX.play('bombThrow');
    return true;
  }

  hurt(game, amount, attacker) {
    if (!this.alive) return;
    if (this.shieldT > 0) {
      addFx({ type: 'burst', x: this.x, y: this.y, r1: 26, drops: 0, color: '#7ab4e6' });
      return;   // the bubble soaks it
    }
    this.hp -= amount;
    this.grudge = attacker;
    if (this.isPlayer && !game.demo) {
      SFX.play('hurt');
      flashHurt();
    }
    if (this.hp <= 0) {
      this.alive = false;
      this.respawnTimer = 2.5;
      game.stats[attacker.team].splats++;
      game.stats[this.team].downs++;
      splat(this.x, this.y, 70 * slamMul(), attacker.team);
      addFx({ type: 'text', x: this.x, y: this.y - 24, text: 'SPLAT!', color: TEAMS[attacker.team].color });
      addShake(this.isPlayer ? 9 : 4);
      SFX.play('splatted');
      game.toast(L('{a} splatted {b}!', { a: attacker.name, b: this.name }), attacker.team === game.player.team ? '' : 'warn');
    }
  }

  respawn() {
    const s = SPAWNS[this.team];
    this.x = s.x; this.y = s.y;
    this.hp = 100;
    this.ink = 100;
    this.alive = true;
  }

  updateRegen(dt) {
    this.boostT = Math.max(0, this.boostT - dt);
    this.shieldT = Math.max(0, this.shieldT - dt);
    const onOwn = paintAt(this.x, this.y) === this.team;
    this.ink = clamp(this.ink + (onOwn ? INK_REGEN_OWN : INK_REGEN) * dt, 0, 100);
    this.hp = clamp(this.hp + 2.5 * dt, 0, 100);
    this.firingVisual = Math.max(0, this.firingVisual - dt);
  }

  /* ------------- bot brain ------------- */
  botUpdate(game, dt) {
    if (!this.alive) return;
    const diff = DIFFICULTY[game.difficulty] || DIFFICULTY.normal;
    const per = this.persona;

    this.botRetargetIn -= dt;

    // priorities: red button (persona-weighted pull) > bomb pickup > agenda
    let goal = this.botTarget;
    const wantsButton = game.button.active &&
      dist(this.x, this.y, game.button.x, game.button.y) < 650 * per.buttonPull;
    if (wantsButton) {
      goal = game.button;
    } else {
      let best = null, bestD = 500;
      for (const p of game.pickups) {
        const d = dist(this.x, this.y, p.x, p.y);
        if (d < bestD) { best = p; bestD = d; }
      }
      if (best && this.bombs < 2) goal = best;
    }

    if (this.botRetargetIn <= 0 || dist(this.x, this.y, this.botTarget.x, this.botTarget.y) < 60) {
      // roam toward a spot that is not ours yet (farmers look harder)
      let spot = randomOpenSpot();
      for (let i = 0; i < (per.shy ? 12 : 6); i++) {
        const s = randomOpenSpot();
        if (paintAt(s.x, s.y) !== this.team) { spot = s; break; }
      }
      this.botTarget = spot;
      this.botRetargetIn = rand(Math.random, 3, 6);
    }

    // spot the nearest live enemy (awareness scales with persona)
    let foe = null, foeD = diff.detect * per.detect;
    for (const f of game.fighters) {
      if (f === this || !f.alive) continue;
      const d = dist(this.x, this.y, f.x, f.y);
      if (d < foeD) { foe = f; foeD = d; }
    }

    // hunters chase a live target instead of roaming
    if (per.hunts && !wantsButton) {
      const prey = per.grudge && this.grudge && this.grudge.alive ? this.grudge : foe;
      if (prey) goal = prey;
    }

    // steer, with simple wall probing
    let a = Math.atan2(goal.y - this.y, goal.x - this.x);
    // farmers back away from trouble instead of trading paint
    if (per.shy && foe && foeD < 160) {
      a = Math.atan2(this.y - foe.y, this.x - foe.x);
    }
    const probe = 46;
    const hazard = (px, py) => pointBlocked(px, py) || lavaAt(px, py);
    if (hazard(this.x + Math.cos(a) * probe, this.y + Math.sin(a) * probe)) {
      for (const off of [0.5, -0.5, 1.1, -1.1, 1.8, -1.8]) {
        if (!hazard(this.x + Math.cos(a + off) * probe, this.y + Math.sin(a + off) * probe)) {
          a += off;
          break;
        }
      }
    }
    this.move(Math.cos(a), Math.sin(a), dt);

    // aim at the foe when one is inside weapon range, else spray ahead
    if (foe && foeD < this.weapon.range) {
      this.aim = Math.atan2(foe.y - this.y, foe.x - this.x) + rand(Math.random, -diff.aimNoise, diff.aimNoise);
    } else {
      this.aim = a;
      foe = null;
    }

    // fire in loose bursts so bots do not hose constantly
    this.botBurst -= dt;
    if (this.botBurst <= 0) this.botBurst = rand(Math.random, 0.8, 2.0);
    if (this.botBurst < diff.burstWindow * per.burst || foe) this.tryFire(game, dt);

    // lob a bomb at clumps of enemies or big enemy turf
    if (this.bombs > 0 && foe && foeD > 120 && Math.random() < diff.bombProb * per.bomb) {
      this.throwBomb(game, foe.x, foe.y);
      game.toast(L('{n} threw a Paint Bomb!', { n: this.name }));
    }

    // sometimes burn a skill charge when engaged
    if (this.skillUses > 0 && foe && Math.random() < 0.002) {
      Skills.cast(game, this);
    }
  }
}
