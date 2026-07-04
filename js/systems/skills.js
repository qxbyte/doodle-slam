'use strict';

/* ============================================================
   Active skills — one per fighter, 2 uses per match, key Q.
   Effects reuse the paint/fx systems; ongoing effects (drone,
   dash) live in game.skillFx / fighter fields and are advanced
   by Skills.update().
   ============================================================ */

const SKILLS = [
  {
    name: 'Paint Drone', blurb: 'a drone flies ahead painting a stripe',
    cast(game, f) {
      game.skillFx.push({ kind: 'drone', x: f.x, y: f.y, a: f.aim, t: 0, team: f.team, step: 0 });
    },
  },
  {
    name: 'Ram Dash', blurb: 'burst forward, bowling rivals over',
    cast(game, f) {
      f.dashT = 0.28;
      f.dashA = f.aim;
      f.dashHit = new Set();
    },
  },
  {
    name: 'Pierce Shot', blurb: 'one bolt across the whole map',
    cast(game, f) {
      const a = f.aim;
      let endX = f.x, endY = f.y;
      for (let d = 30; d < 2200; d += 30) {
        const x = f.x + Math.cos(a) * d, y = f.y + Math.sin(a) * d;
        if (x < 0 || y < 0 || x > WORLD.w || y > WORLD.h || pointBlocked(x, y)) break;
        endX = x; endY = y;
        if (d % 60 < 30) splat(x, y, 14 * slamMul(), f.team);
      }
      const len = dist(f.x, f.y, endX, endY);
      for (const e of game.fighters) {
        if (e.team === f.team || !e.alive) continue;
        // perpendicular distance to the beam segment
        const t = clamp(((e.x - f.x) * Math.cos(a) + (e.y - f.y) * Math.sin(a)), 0, len);
        const px = f.x + Math.cos(a) * t, py = f.y + Math.sin(a) * t;
        if (dist(e.x, e.y, px, py) < FIGHTER_RADIUS + 8) e.hurt(game, 40, f);
      }
      addFx({ type: 'line', x1: f.x, y1: f.y, x2: endX, y2: endY, color: TEAMS[f.team].color, dur: 0.3 });
      addShake(3);
    },
  },
  {
    name: 'Paint Wall', blurb: 'slam a wall of paint down ahead',
    cast(game, f) {
      const a = f.aim;
      const cx = f.x + Math.cos(a) * 130, cy = f.y + Math.sin(a) * 130;
      const pa = a + Math.PI / 2;
      for (let k = -3; k <= 3; k++) {
        const x = cx + Math.cos(pa) * k * 45, y = cy + Math.sin(pa) * k * 45;
        if (!pointBlocked(x, y)) splat(x, y, 32 * slamMul(), f.team);
      }
      addFx({ type: 'burst', x: cx, y: cy, r1: 90, drops: 8, dur: 0.35, color: TEAMS[f.team].color });
      addShake(4);
    },
  },
];

const Skills = {
  cast(game, f) {
    if (!f || !f.alive || f.skillUses <= 0) return false;
    f.skillUses--;
    SKILLS[f.team].cast(game, f);
    SFX.play('skill');
    game.toast(`${f.name} used ${SKILLS[f.team].name}!`);
    return true;
  },

  update(game, dt) {
    // drones fly, painting as they go
    for (let i = game.skillFx.length - 1; i >= 0; i--) {
      const d = game.skillFx[i];
      d.t += dt;
      const sp = 480;
      d.x += Math.cos(d.a) * sp * dt;
      d.y += Math.sin(d.a) * sp * dt;
      d.step += sp * dt;
      if (d.step > 44) {
        d.step = 0;
        if (!pointBlocked(d.x, d.y)) splat(d.x, d.y, 34 * slamMul(), d.team);
      }
      if (d.t > 1.4 || d.x < 0 || d.x > WORLD.w || d.y < 0 || d.y > WORLD.h || pointBlocked(d.x, d.y)) {
        game.skillFx.splice(i, 1);
      }
    }
    // dashes carry the fighter and bowl over anyone touched
    for (const f of game.fighters) {
      if (f.dashT > 0 && f.alive) {
        f.dashT -= dt;
        const fixed = collideWorld(f.x + Math.cos(f.dashA) * 920 * dt, f.y + Math.sin(f.dashA) * 920 * dt, FIGHTER_RADIUS);
        f.x = fixed.x; f.y = fixed.y;
        splat(f.x, f.y, 14 * slamMul(), f.team);
        for (const e of game.fighters) {
          if (e.team === f.team || !e.alive || f.dashHit.has(e)) continue;
          if (dist(f.x, f.y, e.x, e.y) < FIGHTER_RADIUS * 2.2) {
            f.dashHit.add(e);
            e.hurt(game, 30, f);
            addShake(3);
          }
        }
      }
    }
  },

  /* little doodle drone: body + rotor bar + team light */
  draw(ctx, game) {
    for (const d of game.skillFx) {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.6;
      ctx.fillStyle = '#dfe3ea';
      ctx.beginPath(); ctx.ellipse(0, 0, 8, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      const spin = Math.sin(d.t * 40) * 10;
      ctx.beginPath();
      ctx.moveTo(-10 - spin * 0.3, -7); ctx.lineTo(10 + spin * 0.3, -7);
      ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(0, -4); ctx.stroke();
      ctx.fillStyle = TEAMS[d.team].color;
      ctx.beginPath(); ctx.arc(0, 1, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  },
};
