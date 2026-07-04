'use strict';

/* ============================================================
   Adventure enemies — grey shaving-blob minions and the Eraser
   boss. Minions patrol their area until the hero steps in, then
   circle and lob slow, dodgeable shots. Everything grey dies to
   paint. Enemy shots live in game.adv.shots.
   ============================================================ */

const ADV_MINION_RADIUS = 16;

class AdvMinion {
  constructor(zone, tier, rng) {
    this.zone = zone;
    this.t = ADV_TIERS[tier];
    this.hp = this.t.hp;
    this.maxHp = this.t.hp;
    // patrol between two open points inside the area
    this.a = this.spot(zone, rng);
    this.b = this.spot(zone, rng);
    this.x = this.a.x; this.y = this.a.y;
    this.toB = true;
    this.awake = false;
    this.fireT = rand(rng, 0.5, this.t.fireEvery);   // desync volleys
    this.strafeDir = rng() < 0.5 ? 1 : -1;
    this.hitT = 0;
    this.wob = rng() * Math.PI * 2;
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
      // creeping close wakes them — no free point-blank ambush
      if (p.alive && dist(this.x, this.y, p.x, p.y) < 400) {
        this.awake = true;
        return;
      }
      // patrol a-b, oblivious
      const goal = this.toB ? this.b : this.a;
      const d = dist(this.x, this.y, goal.x, goal.y);
      if (d < 14) { this.toB = !this.toB; return; }
      const a = Math.atan2(goal.y - this.y, goal.x - this.x);
      const fixed = collideWorld(this.x + Math.cos(a) * 55 * dt, this.y + Math.sin(a) * 55 * dt, ADV_MINION_RADIUS);
      this.x = fixed.x; this.y = fixed.y;
      return;
    }

    // awake: keep a shooting distance, strafing sideways
    if (!p.alive) return;
    const pd = dist(this.x, this.y, p.x, p.y);
    const toP = Math.atan2(p.y - this.y, p.x - this.x);
    let move = toP;
    if (pd < 190) move = toP + Math.PI;                        // too close: back off
    else if (pd < 300) move = toP + this.strafeDir * Math.PI / 2;   // circle
    if (pointBlocked(this.x + Math.cos(move) * 40, this.y + Math.sin(move) * 40)) {
      this.strafeDir *= -1;
      move = toP + this.strafeDir * Math.PI / 2;
    }
    const sp = 95;
    const fixed = collideWorld(this.x + Math.cos(move) * sp * dt, this.y + Math.sin(move) * sp * dt, ADV_MINION_RADIUS);
    this.x = fixed.x; this.y = fixed.y;

    // slow telegraphed shots — dodgeable by design
    this.fireT -= dt;
    if (this.fireT <= 0 && pd < 560) {
      this.fireT = this.t.fireEvery * rand(Math.random, 0.9, 1.25);
      const a = toP + rand(Math.random, -this.t.aimNoise, this.t.aimNoise);
      game.adv.shots.push({
        x: this.x + Math.cos(a) * 20, y: this.y + Math.sin(a) * 20,
        vx: Math.cos(a) * this.t.shotSpeed, vy: Math.sin(a) * this.t.shotSpeed,
        dmg: this.t.dmg, life: 3.2,
      });
      if (dist(this.x, this.y, game.player.x, game.player.y) < 700) SFX.play('scatter');
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
      return true;   // dead
    }
    SFX.play('hit');
    return false;
  }

  draw(ctx) {
    const r = ADV_MINION_RADIUS;
    ctx.save();
    ctx.translate(this.x, this.y + Math.sin(this.wob) * 2);
    ctx.strokeStyle = '#1c1c1a';
    ctx.lineWidth = 2.2;
    ctx.fillStyle = this.hitT > 0 ? '#ffffff' : '#b9b6ae';
    // lumpy shaving-blob body
    ctx.beginPath();
    for (let k = 0; k <= 9; k++) {
      const a = k / 9 * Math.PI * 2;
      const rr = r * (1 + Math.sin(a * 3 + this.wob) * 0.12);
      const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
      k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill(); ctx.stroke();
    // cross eyes + frown when awake, sleepy lids on patrol
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
    // hp sliver when wounded
    if (this.hp < this.maxHp) {
      ctx.fillStyle = 'rgba(28,28,26,0.3)';
      ctx.fillRect(this.x - 14, this.y - r - 10, 28, 4);
      ctx.fillStyle = '#e6392a';
      ctx.fillRect(this.x - 14, this.y - r - 10, 28 * Math.max(0, this.hp / this.maxHp), 4);
    }
  }
}

/* ---------------- the boss ---------------- */

class AdvBoss {
  constructor(def, zone) {
    this.x = zone.x;
    this.y = zone.y;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.speed = def.speed;
    this.radius = def.radius;
    this.volley = def.volley || 3;             // shots per fan
    this.volleyEvery = def.volleyEvery || 2.6;
    this.chargeEvery = def.chargeEvery || 8;
    this.awake = false;
    this.hitT = 0;
    this.eraseT = 0;
    this.volleyT = this.volleyEvery;
    this.chargeT = this.chargeEvery;
    this.charging = 0;      // >0: telegraph countdown, <0: mid-charge
    this.chargeA = 0;
  }

  update(game, dt) {
    if (!this.awake) return;
    const p = game.player;
    this.hitT = Math.max(0, this.hitT - dt);

    // it erases the ground it crosses
    this.eraseT -= dt;
    if (this.eraseT <= 0) {
      this.eraseT = 0.12;
      erasePaint(this.x, this.y, this.radius * 1.15);
    }

    // charge attack: 1s telegraph, then a straight rush
    this.chargeT -= dt;
    if (this.charging > 0) {
      this.charging -= dt;
      if (this.charging <= 0) {
        this.charging = -0.8;   // rush for 0.8s
        SFX.play('rocketWarn');
      }
      return;   // stands still while winding up
    }
    if (this.charging < 0) {
      this.charging = Math.min(0, this.charging + dt);
      this.x = clamp(this.x + Math.cos(this.chargeA) * 460 * dt, 60, WORLD.w - 60);
      this.y = clamp(this.y + Math.sin(this.chargeA) * 460 * dt, 60, WORLD.h - 60);
    } else if (this.chargeT <= 0 && p.alive) {
      this.chargeT = this.chargeEvery;
      this.charging = 1.0;   // telegraph
      this.chargeA = Math.atan2(p.y - this.y, p.x - this.x);
      addFx({ type: 'text', x: this.x, y: this.y - 90, text: '!!', color: '#e6392a' });
    } else if (p.alive) {
      // amble toward the hero
      const a = Math.atan2(p.y - this.y, p.x - this.x);
      this.x = clamp(this.x + Math.cos(a) * this.speed * dt, 60, WORLD.w - 60);
      this.y = clamp(this.y + Math.sin(a) * this.speed * dt, 60, WORLD.h - 60);
    }

    // fan volley: slow shots, 0.38rad gaps — walk out of the arc
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
        advDamagePlayer(game, 40 * dt, !loud);
      }
    }
  }

  hurt(game, dmg) {
    if (!this.awake) {
      this.awake = true;   // sniping it just makes it angry
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

/* enemy shots: slow grey blobs, blocked by walls, dodged by feet */
function updateAdvShots(game, dt) {
  const shots = game.adv.shots;
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.life <= 0 || pointBlocked(s.x, s.y)) { shots.splice(i, 1); continue; }
    const p = game.player;
    if (p.alive && dist(s.x, s.y, p.x, p.y) < FIGHTER_RADIUS + (s.big ? 8 : 5)) {
      advDamagePlayer(game, s.dmg);
      shots.splice(i, 1);
    }
  }
}

function drawAdvShots(ctx, game) {
  for (const s of game.adv.shots) {
    ctx.fillStyle = '#8a8a86';
    ctx.strokeStyle = '#1c1c1a';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.big ? 10 : 6.5, s.big ? 7 : 4.5, Math.atan2(s.vy, s.vx), 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
}
