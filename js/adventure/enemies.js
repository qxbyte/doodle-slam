'use strict';

/* ============================================================
   Adventure enemies.

   Minions (three breeds, all grey shaving-creatures):
     shooter — circles at range, lobs slow single shots
     charger — no gun; telegraphs, then rams (sidestep it)
     lobber  — squat mortar; arcs slow AoE blobs over cover,
               the landing ring shows where NOT to stand
   Bosses (one per boss level, each with its own look + skill):
     shadow — chalk ghost of the Eraser; BLINKS across the arena
     smudge — smeared beach bully; SUMMONS shaving minions
     prime  — the real Eraser; RADIAL BURST + enrages at low hp
   Everything telegraphs, every shot is dodgeable by movement.
   ============================================================ */

const ADV_MINION_RADIUS = 16;

class AdvMinion {
  constructor(zone, tier, rng, kind = 'shooter') {
    this.zone = zone;
    this.kind = kind;
    this.t = ADV_TIERS[tier];
    const hpMul = kind === 'charger' ? 1.35 : kind === 'lobber' ? 1.2 : 1;
    this.hp = Math.round(this.t.hp * hpMul);
    this.maxHp = this.hp;
    this.a = this.spot(zone, rng);
    this.b = kind === 'lobber' ? this.a : this.spot(zone, rng);   // lobbers hold their ground
    this.x = this.a.x; this.y = this.a.y;
    this.toB = true;
    this.awake = false;
    this.fireT = rand(rng, 0.5, this.t.fireEvery);
    this.strafeDir = rng() < 0.5 ? 1 : -1;
    this.hitT = 0;
    this.wob = rng() * Math.PI * 2;
    // charger state
    this.dashCd = 0;
    this.windup = 0;      // >0 telegraphing, <0 mid-dash
    this.dashA = 0;
  }

  spot(zone, rng) {
    for (let i = 0; i < 24; i++) {
      const a = rand(rng, 0, Math.PI * 2), d = rand(rng, 0, zone.r * 0.72);
      const x = zone.x + Math.cos(a) * d, y = zone.y + Math.sin(a) * d;
      if (!pointBlocked(x, y) && !lavaAt(x, y)) return { x, y };
    }
    return { x: zone.x, y: zone.y };
  }

  update(game, dt) {
    this.hitT = Math.max(0, this.hitT - dt);
    this.wob += dt * 3;
    const p = game.player;

    if (!this.awake) {
      if (p.alive && dist(this.x, this.y, p.x, p.y) < 400) {
        this.awake = true;
        return;
      }
      if (this.kind === 'lobber') return;   // dozing at its post
      const goal = this.toB ? this.b : this.a;
      const d = dist(this.x, this.y, goal.x, goal.y);
      if (d < 14) { this.toB = !this.toB; return; }
      const a = Math.atan2(goal.y - this.y, goal.x - this.x);
      const fixed = collideWorld(this.x + Math.cos(a) * 55 * dt, this.y + Math.sin(a) * 55 * dt, ADV_MINION_RADIUS);
      this.x = fixed.x; this.y = fixed.y;
      return;
    }

    if (!p.alive) return;
    if (this.kind === 'charger') return this.updateCharger(game, dt, p);
    if (this.kind === 'lobber') return this.updateLobber(game, dt, p);
    return this.updateShooter(game, dt, p);
  }

  /* ---- shooter: circle at range, slow single shots ---- */
  updateShooter(game, dt, p) {
    const pd = dist(this.x, this.y, p.x, p.y);
    const toP = Math.atan2(p.y - this.y, p.x - this.x);
    let move = toP;
    if (pd < 190) move = toP + Math.PI;
    else if (pd < 300) move = toP + this.strafeDir * Math.PI / 2;
    if (pointBlocked(this.x + Math.cos(move) * 40, this.y + Math.sin(move) * 40)) {
      this.strafeDir *= -1;
      move = toP + this.strafeDir * Math.PI / 2;
    }
    const fixed = collideWorld(this.x + Math.cos(move) * 95 * dt, this.y + Math.sin(move) * 95 * dt, ADV_MINION_RADIUS);
    this.x = fixed.x; this.y = fixed.y;

    this.fireT -= dt;
    if (this.fireT <= 0 && pd < 560) {
      this.fireT = this.t.fireEvery * rand(Math.random, 0.9, 1.25);
      const a = toP + rand(Math.random, -this.t.aimNoise, this.t.aimNoise);
      game.adv.shots.push({
        x: this.x + Math.cos(a) * 20, y: this.y + Math.sin(a) * 20,
        vx: Math.cos(a) * this.t.shotSpeed, vy: Math.sin(a) * this.t.shotSpeed,
        dmg: this.t.dmg, life: 3.2,
      });
      addFx({ type: 'burst', x: this.x + Math.cos(a) * 22, y: this.y + Math.sin(a) * 22, r1: 12, drops: 0, color: '#b9b6ae' });
      if (pd < 700) SFX.play('scatter');
    }
  }

  /* ---- charger: telegraph, then ram — sidestep it ---- */
  updateCharger(game, dt, p) {
    this.dashCd = Math.max(0, this.dashCd - dt);
    if (this.windup > 0) {
      this.windup -= dt;
      if (this.windup <= 0) {
        this.windup = -0.45;   // dash!
        SFX.play('roller');
      }
      return;   // shivering in place
    }
    if (this.windup < 0) {
      this.windup = Math.min(0, this.windup + dt);
      const fixed = collideWorld(this.x + Math.cos(this.dashA) * 430 * dt, this.y + Math.sin(this.dashA) * 430 * dt, ADV_MINION_RADIUS);
      this.x = fixed.x; this.y = fixed.y;
      if (Math.random() < 0.5) {
        addFx({ type: 'burst', x: this.x - Math.cos(this.dashA) * 16, y: this.y - Math.sin(this.dashA) * 16, r1: 10, drops: 1, color: '#c9c7bf' });
      }
      if (p.alive && dist(this.x, this.y, p.x, p.y) < ADV_MINION_RADIUS + FIGHTER_RADIUS) {
        advDamagePlayer(game, 16);
        const ka = Math.atan2(p.y - this.y, p.x - this.x);
        const shoved = collideWorld(p.x + Math.cos(ka) * 46, p.y + Math.sin(ka) * 46, FIGHTER_RADIUS);
        p.x = shoved.x; p.y = shoved.y;
        this.windup = 0;
        this.dashCd = 2.6;
      }
      if (this.windup === 0) this.dashCd = Math.max(this.dashCd, 2.2);
      return;
    }
    const pd = dist(this.x, this.y, p.x, p.y);
    const toP = Math.atan2(p.y - this.y, p.x - this.x);
    if (pd < 270 && this.dashCd <= 0) {
      this.windup = 0.55;   // telegraph: it crouches and shakes
      this.dashA = toP;
      addFx({ type: 'text', x: this.x, y: this.y - 26, text: '!', color: '#e6392a' });
      return;
    }
    const fixed = collideWorld(this.x + Math.cos(toP) * 125 * dt, this.y + Math.sin(toP) * 125 * dt, ADV_MINION_RADIUS);
    this.x = fixed.x; this.y = fixed.y;
  }

  /* ---- lobber: holds ground, arcs AoE blobs over cover ---- */
  updateLobber(game, dt, p) {
    const pd = dist(this.x, this.y, p.x, p.y);
    this.fireT -= dt;
    if (this.fireT <= 0 && pd < 620) {
      this.fireT = this.t.fireEvery * 1.7;
      const tx = clamp(p.x + p.vx * 0.2, 40, WORLD.w - 40);
      const ty = clamp(p.y + p.vy * 0.2, 40, WORLD.h - 40);
      game.adv.shots.push({
        arc: true, sx: this.x, sy: this.y, tx, ty,
        t: 0, dur: Math.max(0.9, dist(this.x, this.y, tx, ty) / 340),
        dmg: this.t.dmg + 4, radius: 72,
      });
      addFx({ type: 'burst', x: this.x, y: this.y - 14, r1: 14, drops: 2, color: '#b9b6ae' });
      if (pd < 750) SFX.play('bombThrow');
    }
  }

  hurt(game, dmg) {
    this.hp -= dmg;
    this.hitT = 0.14;
    if (this.hp <= 0) {
      splat(this.x, this.y, 46, game.player.team);
      addFx({ type: 'burst', x: this.x, y: this.y, r1: 40, drops: 8, dur: 0.4, color: '#c9c7bf' });
      addFx({ type: 'text', x: this.x, y: this.y - 20, text: 'POOF!', color: '#8a8a86' });
      SFX.play('splatted');
      return true;
    }
    SFX.play('hit');
    return false;
  }

  draw(ctx) {
    const r = this.kind === 'charger' ? 18 : ADV_MINION_RADIUS;
    const shake = this.windup > 0 ? Math.sin(this.wob * 14) * 2.5 : 0;
    ctx.save();
    ctx.translate(this.x + shake, this.y + Math.sin(this.wob) * 2);
    ctx.strokeStyle = '#1c1c1a';
    ctx.lineWidth = 2.2;
    ctx.fillStyle = this.hitT > 0 ? '#ffffff'
      : this.kind === 'lobber' ? '#a8aa9e'
      : this.kind === 'charger' ? '#aaa49c' : '#b9b6ae';
    ctx.beginPath();
    for (let k = 0; k <= 9; k++) {
      const a = k / 9 * Math.PI * 2;
      const rr = r * (1 + Math.sin(a * 3 + this.wob) * 0.12);
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    if (this.kind === 'charger') {
      // ram horns
      ctx.fillStyle = '#6e6a64';
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * 8, -r + 4);
        ctx.lineTo(dir * 15, -r - 8);
        ctx.lineTo(dir * 3, -r + 1);
        ctx.closePath();
        ctx.fill(); ctx.stroke();
      }
    }
    if (this.kind === 'lobber') {
      // mortar spout on top
      ctx.fillStyle = '#7e7a74';
      ctx.beginPath(); ctx.roundRect(-6, -r - 12, 12, 14, 4); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, -r - 12, 8, 3.4, 0, 0, Math.PI * 2); ctx.stroke();
    }

    ctx.fillStyle = '#1c1c1a';
    if (this.awake) {
      ctx.beginPath(); ctx.arc(-5, -3, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(5, -3, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-9, -9); ctx.lineTo(-2, -6);
      ctx.moveTo(9, -9); ctx.lineTo(2, -6);
      ctx.moveTo(-4, 6); ctx.lineTo(4, 5);
      ctx.stroke();
    } else {
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-7, -3); ctx.lineTo(-2, -3);
      ctx.moveTo(2, -3); ctx.lineTo(7, -3);
      ctx.stroke();
    }
    ctx.restore();
    if (this.hp < this.maxHp) {
      ctx.fillStyle = 'rgba(28,28,26,0.3)';
      ctx.fillRect(this.x - 14, this.y - r - 12, 28, 4);
      ctx.fillStyle = '#e6392a';
      ctx.fillRect(this.x - 14, this.y - r - 12, 28 * Math.max(0, this.hp / this.maxHp), 4);
    }
  }
}

/* ---------------- the bosses ---------------- */

class AdvBoss {
  constructor(def, zone) {
    this.kind = def.kind || 'prime';
    this.x = zone.x;
    this.y = zone.y;
    this.zone = zone;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.baseSpeed = def.speed;
    this.radius = def.radius;
    this.volley = def.volley || 3;
    this.volleyEvery = def.volleyEvery || 2.6;
    this.chargeEvery = def.chargeEvery || 8;
    this.telegraph = def.telegraph || 1.0;
    this.skillEvery = def.skillEvery || 10;
    this.awake = false;
    this.hitT = 0;
    this.eraseT = 0;
    this.volleyT = this.volleyEvery;
    this.chargeT = this.chargeEvery;
    this.skillT = this.skillEvery * 0.7;
    this.charging = 0;
    this.chargeA = 0;
    this.blinkT = 0;       // shadow: fade back in after a blink
    this.enraged = false;  // prime below 35%
  }

  update(game, dt) {
    if (!this.awake) return;
    const p = game.player;
    this.hitT = Math.max(0, this.hitT - dt);
    this.blinkT = Math.max(0, this.blinkT - dt);

    if (this.kind === 'prime' && !this.enraged && this.hp < this.maxHp * 0.35) {
      this.enraged = true;
      this.speed = this.baseSpeed + 22;
      this.volleyEvery *= 0.8;
      pushToast(L('THE ERASER is furious!'), 'danger');
      addShake(10);
      SFX.play('rocketWarn');
    }

    this.eraseT -= dt;
    if (this.eraseT <= 0) {
      this.eraseT = 0.12;
      erasePaint(this.x, this.y, this.radius * 1.15);
    }

    // signature skill
    this.skillT -= dt;
    if (this.skillT <= 0 && p.alive && this.charging === 0) {
      this.skillT = this.skillEvery;
      this.castSkill(game, p);
    }

    // charge attack: telegraph, then a straight rush
    this.chargeT -= dt;
    if (this.charging > 0) {
      this.charging -= dt;
      if (this.charging <= 0) {
        this.charging = -0.8;
        SFX.play('rocketWarn');
      }
      return;
    }
    if (this.charging < 0) {
      this.charging = Math.min(0, this.charging + dt);
      this.x = clamp(this.x + Math.cos(this.chargeA) * 470 * dt, 60, WORLD.w - 60);
      this.y = clamp(this.y + Math.sin(this.chargeA) * 470 * dt, 60, WORLD.h - 60);
      addFx({ type: 'burst', x: this.x - Math.cos(this.chargeA) * 40, y: this.y - Math.sin(this.chargeA) * 40, r1: 16, drops: 2, color: '#e3d3d0' });
    } else if (this.chargeT <= 0 && p.alive) {
      this.chargeT = this.chargeEvery;
      this.charging = this.telegraph;
      this.chargeA = Math.atan2(p.y - this.y, p.x - this.x);
      addFx({ type: 'text', x: this.x, y: this.y - 90, text: '!!', color: '#e6392a' });
    } else if (p.alive) {
      const a = Math.atan2(p.y - this.y, p.x - this.x);
      this.x = clamp(this.x + Math.cos(a) * this.speed * dt, 60, WORLD.w - 60);
      this.y = clamp(this.y + Math.sin(a) * this.speed * dt, 60, WORLD.h - 60);
    }

    // fan volley — 0.38rad gaps, walk out of the arc
    this.volleyT -= dt;
    if (this.volleyT <= 0 && p.alive) {
      this.volleyT = this.volleyEvery;
      const base = Math.atan2(p.y - this.y, p.x - this.x);
      for (let k = 0; k < this.volley; k++) {
        const a = base + (k - (this.volley - 1) / 2) * 0.38;
        game.adv.shots.push({
          x: this.x + Math.cos(a) * 50, y: this.y + Math.sin(a) * 50,
          vx: Math.cos(a) * 230, vy: Math.sin(a) * 230,
          dmg: 18, life: 4, big: true,
        });
      }
      addFx({ type: 'burst', x: this.x + Math.cos(base) * 55, y: this.y + Math.sin(base) * 55, r1: 30, drops: 3, color: '#8a8a86' });
      SFX.play('roller');
    }

    // contact grinds the hero down
    for (const f of game.fighters) {
      if (!f.alive) continue;
      const d = dist(f.x, f.y, this.x, this.y);
      if (d < this.radius + FIGHTER_RADIUS) {
        const push = (this.radius + FIGHTER_RADIUS - d) + 50 * dt;
        const na = Math.atan2(f.y - this.y, f.x - this.x);
        const fixed = collideWorld(f.x + Math.cos(na) * push, f.y + Math.sin(na) * push, FIGHTER_RADIUS);
        f.x = fixed.x; f.y = fixed.y;
        f.lavaTick -= dt;
        const loud = f.lavaTick <= 0;
        if (loud) f.lavaTick = 0.4;
        advDamagePlayer(game, 42 * dt, !loud);
      }
    }
  }

  castSkill(game, p) {
    if (this.kind === 'shadow') {
      // BLINK: vanish, reappear beside the hero, strike fast
      addFx({ type: 'burst', x: this.x, y: this.y, r1: this.radius * 1.4, drops: 6, dur: 0.4, color: '#4a4a55' });
      for (let i = 0; i < 10; i++) {
        const a = Math.random() * Math.PI * 2;
        const nx = clamp(p.x + Math.cos(a) * 300, 80, WORLD.w - 80);
        const ny = clamp(p.y + Math.sin(a) * 300, 80, WORLD.h - 80);
        if (!pointBlocked(nx, ny)) { this.x = nx; this.y = ny; break; }
      }
      this.blinkT = 0.35;
      this.volleyT = Math.min(this.volleyT, 0.7);
      addFx({ type: 'burst', x: this.x, y: this.y, r1: this.radius * 1.4, drops: 6, dur: 0.4, color: '#4a4a55' });
      SFX.play('warp');
    } else if (this.kind === 'smudge') {
      // SUMMON: smear off two fresh shavings (capped)
      const adv = game.adv;
      const mine = adv.minions.filter(m => m.zoneIdx === adv.zoneIdx).length;
      const lvl = ADV_LEVELS[adv.level];
      for (let k = 0; k < Math.min(2, 6 - mine); k++) {
        const a = Math.random() * Math.PI * 2;
        const m = new AdvMinion(this.zone, lvl.tier, Math.random, 'shooter');
        m.x = clamp(this.x + Math.cos(a) * 90, 60, WORLD.w - 60);
        m.y = clamp(this.y + Math.sin(a) * 90, 60, WORLD.h - 60);
        m.awake = true;
        m.zoneIdx = adv.zoneIdx;
        adv.minions.push(m);
        addFx({ type: 'burst', x: m.x, y: m.y, r1: 34, drops: 5, dur: 0.4, color: '#c9c7bf' });
      }
      pushToast(L('The Smudge smears off fresh minions!'), 'warn');
      SFX.play('bombThrow');
    } else {
      // PRIME — RADIAL BURST: a full ring, slow enough to slip through
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * Math.PI * 2;
        game.adv.shots.push({
          x: this.x + Math.cos(a) * 54, y: this.y + Math.sin(a) * 54,
          vx: Math.cos(a) * 205, vy: Math.sin(a) * 205,
          dmg: 16, life: 4.2, big: true,
        });
      }
      addFx({ type: 'burst', x: this.x, y: this.y, r1: this.radius * 1.6, drops: 8, dur: 0.5, color: '#8a8a86' });
      addShake(6);
      SFX.play('boom');
    }
  }

  hurt(game, dmg) {
    if (!this.awake) {
      this.awake = true;
      pushToast(L('THE ERASER wakes up!'), 'danger');
    }
    this.hp -= dmg;
    this.hitT = 0.15;
    if (this.hp <= 0) {
      for (let k = 0; k < 6; k++) {
        addFx({
          type: 'burst', x: this.x + rand(Math.random, -50, 50),
          y: this.y + rand(Math.random, -50, 50), r1: 70, drops: 9, dur: 0.55, color: '#f2e3e0',
        });
      }
      splat(this.x, this.y, 130, game.player.team);
      addShake(12);
      SFX.play('rocketBoom');
      return true;
    }
    return false;
  }
}

/* ---------------- shared: damage + shots ---------------- */

/* damage the hero without crediting anyone a splat */
function advDamagePlayer(game, dmg, quiet = false) {
  const p = game.player;
  if (!p.alive) return;
  if (p.shieldT > 0) {
    if (!quiet) addFx({ type: 'burst', x: p.x, y: p.y, r1: 26, drops: 0, color: '#7ab4e6' });
    return;
  }
  p.hp -= dmg;
  if (!quiet && !game.demo) { SFX.play('hurt'); flashHurt(); }
  if (p.hp <= 0) {
    p.alive = false;
    p.respawnTimer = 2.2;
    game.stats[p.team].downs++;
    splat(p.x, p.y, 60, p.team);
    addFx({ type: 'text', x: p.x, y: p.y - 24, text: 'SPLAT!', color: '#8a8a86' });
    addShake(9);
    SFX.play('splatted');
    pushToast(L('Back to the last cleared area…'));
  }
}

/* enemy shots: straight blobs are wall-blocked and dodged by feet;
   arc (mortar) blobs sail over cover and burst where the ring was */
function updateAdvShots(game, dt) {
  const shots = game.adv.shots;
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    if (s.arc) {
      s.t += dt;
      if (s.t >= s.dur) {
        addFx({ type: 'burst', x: s.tx, y: s.ty, r1: s.radius, drops: 6, dur: 0.4, color: '#9a978f' });
        SFX.play('hit');
        const p = game.player;
        if (p.alive && dist(s.tx, s.ty, p.x, p.y) < s.radius) advDamagePlayer(game, s.dmg);
        shots.splice(i, 1);
      }
      continue;
    }
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.life <= 0 || pointBlocked(s.x, s.y)) {
      addFx({ type: 'burst', x: s.x, y: s.y, r1: 10, drops: 0, color: '#b9b6ae' });
      shots.splice(i, 1);
      continue;
    }
    const p = game.player;
    if (p.alive && dist(s.x, s.y, p.x, p.y) < FIGHTER_RADIUS + (s.big ? 8 : 5)) {
      advDamagePlayer(game, s.dmg);
      shots.splice(i, 1);
    }
  }
}

function drawAdvShots(ctx, game) {
  for (const s of game.adv.shots) {
    if (s.arc) {
      const k = s.t / s.dur;
      // the landing ring IS the dodge telegraph
      ctx.strokeStyle = 'rgba(138,138,134,0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.arc(s.tx, s.ty, s.radius * (0.55 + k * 0.45), 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      const bx = lerp(s.sx, s.tx, k);
      const by = lerp(s.sy, s.ty, k) - Math.sin(k * Math.PI) * 130;
      ctx.fillStyle = '#8a8a86';
      ctx.strokeStyle = '#1c1c1a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(bx, by, 9 - Math.sin(k * Math.PI) * 2, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      continue;
    }
    ctx.fillStyle = '#8a8a86';
    ctx.strokeStyle = '#1c1c1a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.big ? 10 : 6.5, s.big ? 7 : 4.5, Math.atan2(s.vy, s.vx), 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
}

/* ---------------- boss rendering: three distinct looks ---------------- */

function drawAdvBoss(ctx, game, b) {
  // charge telegraph: the dashed rush line
  if (b.charging > 0) {
    ctx.strokeStyle = 'rgba(230,57,42,0.8)';
    ctx.lineWidth = 4;
    ctx.setLineDash([14, 10]);
    ctx.beginPath();
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + Math.cos(b.chargeA) * 620, b.y + Math.sin(b.chargeA) * 620);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  ctx.save();
  ctx.translate(b.x, b.y);
  if (b.blinkT > 0) ctx.globalAlpha = Math.max(0.15, 1 - b.blinkT * 2.4);
  const wob = Math.sin(game.elapsed * 3.2) * 0.06;
  const shiver = b.charging > 0 ? Math.sin(game.elapsed * 40) * 2.5 : 0;
  ctx.translate(shiver, 0);
  ctx.rotate(-0.16 + wob);
  ctx.strokeStyle = '#1c1c1a';
  ctx.lineWidth = 3;
  const stomp = Math.sin(game.elapsed * 6);

  if (b.kind === 'shadow') {
    // a chalk ghost: translucent slab, wispy hem, no feet
    ctx.fillStyle = b.hitT > 0 ? '#8a8aa0' : 'rgba(74,74,90,0.88)';
    ctx.beginPath();
    ctx.moveTo(-36, -54);
    ctx.lineTo(36, -54);
    ctx.lineTo(36, 30);
    for (let k = 3; k >= -3; k--) {
      ctx.quadraticCurveTo(k * 12 + 6, 46 + Math.sin(game.elapsed * 5 + k) * 6, k * 12, 34);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // wispy trailing arms
    ctx.lineWidth = 3.4;
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 34, -16);
      ctx.quadraticCurveTo(dir * 58, -6 + stomp * 4, dir * 50, 16);
      ctx.stroke();
    }
    // hollow chalk eyes + a hungry zigzag grin
    ctx.fillStyle = '#f0f2ec';
    ctx.beginPath(); ctx.ellipse(-13, -22, 6.5, 9, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(13, -22, 6.5, 9, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f0f2ec';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-16, 4);
    ctx.lineTo(-8, 10); ctx.lineTo(0, 4); ctx.lineTo(8, 10); ctx.lineTo(16, 4);
    ctx.stroke();
  } else if (b.kind === 'smudge') {
    // a smeared blue-grey bully with one huge fist
    ctx.fillStyle = b.hitT > 0 ? '#ffffff' : '#9fb0c2';
    ctx.beginPath();
    ctx.moveTo(-40, -50);
    ctx.quadraticCurveTo(30, -66, 42, -40);
    ctx.quadraticCurveTo(52, 10, 34, 52);
    ctx.quadraticCurveTo(-10, 62, -34, 50);
    ctx.quadraticCurveTo(-52, 6, -40, -50);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // smear streaks it never cleans up
    ctx.strokeStyle = 'rgba(90,110,135,0.7)';
    ctx.lineWidth = 4;
    for (const [sy, len] of [[-20, 60], [4, 44], [28, 56]]) {
      ctx.beginPath();
      ctx.moveTo(-38 - len * 0.4, sy + 6);
      ctx.lineTo(-38 + len, sy);
      ctx.stroke();
    }
    ctx.strokeStyle = '#1c1c1a';
    ctx.lineWidth = 3;
    // one huge fist, one stubby arm
    ctx.fillStyle = '#8ba0b5';
    ctx.beginPath(); ctx.arc(50, 8 + stomp * 3, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(-46, 2 - stomp * 3, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // flat feet
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(dir * 18, 58 + (dir * stomp > 0 ? -4 : 0), 12, 5.5, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    // squint + snaggle mouth
    ctx.fillStyle = '#1c1c1a';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(-20, -26); ctx.lineTo(-4, -20);
    ctx.moveTo(22, -28); ctx.lineTo(6, -21);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(-11, -14, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, -15, 3.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-12, 24); ctx.lineTo(-2, 18); ctx.lineTo(8, 25); ctx.lineTo(16, 18);
    ctx.stroke();
  } else {
    // PRIME: the real thing — pink rubber, sleeve, fists, feet, cracks
    ctx.fillStyle = b.hitT > 0 ? '#ffffff' : (b.enraged ? '#f5d0c8' : '#f2e3e0');
    ctx.beginPath(); ctx.roundRect(-40, -60, 80, 118, 10); ctx.fill(); ctx.stroke();
    // battle cracks
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-40, -10); ctx.lineTo(-24, -2); ctx.lineTo(-30, 10);
    ctx.moveTo(40, 20); ctx.lineTo(26, 26);
    ctx.stroke();
    ctx.lineWidth = 3;
    // paper sleeve
    ctx.fillStyle = '#5a78b8';
    ctx.beginPath(); ctx.roundRect(-40, -60, 80, 44, [10, 10, 0, 0]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fdfdf8';
    ctx.font = "italic 900 15px 'Archivo', sans-serif";
    ctx.textAlign = 'center';
    ctx.fillText('ERASE', 0, -32);
    // stubby arms with swinging fists
    ctx.fillStyle = '#e8c8c0';
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(dir * 38, -12);
      ctx.quadraticCurveTo(dir * 58, -4 + dir * stomp * 6, dir * 52, 14 + dir * stomp * 8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(dir * 52, 18 + dir * stomp * 8, 11, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    // stomping feet
    for (const dir of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(dir * 20, 62 + (dir * stomp > 0 ? -5 : 0), 13, 6, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    // furious face
    ctx.fillStyle = '#1c1c1a';
    ctx.beginPath(); ctx.arc(-13, 2, 4.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(13, 2, 4.4, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-24, -8); ctx.lineTo(-6, -1);
    ctx.moveTo(24, -8); ctx.lineTo(6, -1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-14, 22); ctx.lineTo(-5, 16); ctx.lineTo(5, 23); ctx.lineTo(14, 16);
    ctx.stroke();
    if (b.enraged) {
      // steam of fury
      ctx.strokeStyle = '#e6392a';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-30, -70); ctx.lineTo(-24, -78); ctx.moveTo(-20, -68); ctx.lineTo(-16, -78);
      ctx.moveTo(30, -70); ctx.lineTo(24, -78); ctx.moveTo(20, -68); ctx.lineTo(16, -78);
      ctx.stroke();
    }
  }
  ctx.restore();

  // shavings trail
  if (Math.random() < 0.2) {
    addFx({ type: 'burst', x: b.x + rand(Math.random, -30, 30), y: b.y + rand(Math.random, 30, 55), r1: 10, drops: 2, color: '#e3d3d0' });
  }
  // hp bar
  const w = 96, hpw = Math.max(0, b.hp / b.maxHp) * w;
  ctx.fillStyle = 'rgba(28,28,26,0.35)';
  ctx.fillRect(b.x - w / 2, b.y - 84, w, 9);
  ctx.fillStyle = b.enraged ? '#a8231a' : '#e6392a';
  ctx.fillRect(b.x - w / 2, b.y - 84, hpw, 9);
  ctx.strokeStyle = '#1c1c1a';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(b.x - w / 2, b.y - 84, w, 9);
}
