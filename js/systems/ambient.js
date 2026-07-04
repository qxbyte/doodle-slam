'use strict';

/* ============================================================
   Ambient particle layer — light per-map atmosphere drawn in
   screen space above the world. Hard-capped particle count and
   simple shapes keep it far below a millisecond per frame.
   Set per map via `map.ambient`.
   ============================================================ */

const Ambient = (() => {
  const MAX = 46;
  let kind = null;
  let parts = [];

  function fresh(atTop) {
    const W = innerWidth, H = innerHeight;
    const y = atTop ? -10 : Math.random() * H;
    switch (kind) {
      case 'snow':
        return { x: Math.random() * W, y, vy: 35 + Math.random() * 45, sway: Math.random() * Math.PI * 2, r: 1.5 + Math.random() * 1.8 };
      case 'bubbles':
        return { x: Math.random() * W, y: atTop ? H + 10 : Math.random() * H, vy: -(20 + Math.random() * 45), sway: Math.random() * Math.PI * 2, r: 1.6 + Math.random() * 3 };
      case 'fireflies':
        return { x: Math.random() * W, y: Math.random() * H, a: Math.random() * Math.PI * 2, blink: Math.random() * Math.PI * 2, r: 1.6 + Math.random() * 1.2 };
      case 'leaves':
        return { x: Math.random() * W, y, vy: 22 + Math.random() * 30, vx: 8 + Math.random() * 18, rot: Math.random() * Math.PI * 2, vr: (Math.random() - 0.5) * 3, r: 2.4 + Math.random() * 2 };
      case 'dust':
        return { x: Math.random() * W, y: Math.random() * H, a: Math.random() * Math.PI * 2, r: 1 + Math.random() * 1.6 };
      case 'stars':
        return { x: Math.random() * W, y: Math.random() * H, blink: Math.random() * Math.PI * 2, r: 1 + Math.random() * 1.4, streak: Math.random() < 0.04 ? { vx: 260, vy: 130, life: 0.9 } : null };
      default:
        return null;
    }
  }

  function set(k) {
    kind = k || null;
    parts = [];
    if (!kind) return;
    for (let i = 0; i < MAX; i++) parts.push(fresh(false));
  }

  function update(dt) {
    if (!kind) return;
    const W = innerWidth, H = innerHeight;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      switch (kind) {
        case 'snow':
          p.sway += dt * 1.6;
          p.x += Math.sin(p.sway) * 18 * dt;
          p.y += p.vy * dt;
          if (p.y > H + 10) parts[i] = fresh(true);
          break;
        case 'bubbles':
          p.sway += dt * 2.2;
          p.x += Math.sin(p.sway) * 14 * dt;
          p.y += p.vy * dt;
          if (p.y < -10) parts[i] = fresh(true);
          break;
        case 'fireflies':
          p.a += (Math.random() - 0.5) * dt * 4;
          p.x += Math.cos(p.a) * 24 * dt;
          p.y += Math.sin(p.a) * 24 * dt;
          p.blink += dt * 3;
          if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
          if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
          break;
        case 'leaves':
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rot += p.vr * dt;
          if (p.y > H + 10 || p.x > W + 12) parts[i] = fresh(true);
          break;
        case 'dust':
          p.a += (Math.random() - 0.5) * dt * 2;
          p.x += Math.cos(p.a) * 9 * dt;
          p.y += Math.sin(p.a) * 9 * dt + 3 * dt;
          if (p.y > H + 8) parts[i] = fresh(true);
          break;
        case 'stars':
          if (p.streak) {
            p.x += p.streak.vx * dt;
            p.y += p.streak.vy * dt;
            p.streak.life -= dt;
            if (p.streak.life <= 0 || p.x > W + 20) parts[i] = fresh(false);
          } else {
            p.blink += dt * 2;
          }
          break;
      }
    }
  }

  function draw(ctx) {
    if (!kind) return;
    ctx.save();
    switch (kind) {
      case 'snow':
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const p of parts) {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'bubbles':
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1.2;
        for (const p of parts) {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
        }
        break;
      case 'fireflies':
        for (const p of parts) {
          const glow = 0.35 + 0.65 * (0.5 + Math.sin(p.blink) / 2);
          ctx.fillStyle = `rgba(240,220,110,${glow.toFixed(2)})`;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'leaves':
        ctx.fillStyle = 'rgba(150,180,110,0.7)';
        for (const p of parts) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.beginPath(); ctx.ellipse(0, 0, p.r * 1.8, p.r, 0, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
        break;
      case 'dust':
        ctx.fillStyle = 'rgba(150,120,80,0.28)';
        for (const p of parts) {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
        break;
      case 'stars':
        for (const p of parts) {
          if (p.streak) {
            ctx.strokeStyle = 'rgba(255,255,255,0.85)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 22, p.y - 11);
            ctx.stroke();
          } else {
            const glow = 0.25 + 0.6 * (0.5 + Math.sin(p.blink) / 2);
            ctx.fillStyle = `rgba(255,255,255,${glow.toFixed(2)})`;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
          }
        }
        break;
    }
    ctx.restore();
  }

  return { set, update, draw };
})();
