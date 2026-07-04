'use strict';

/* ============================================================
   Adventure mode — chapter one of the story: the ERASER is
   draining the town grey, and one fighter (SPLASH by default)
   sets out to splat it. A short level line with rising
   difficulty, a mid-run super weapon, and a boss fight.
   Progress (furthest level + last played) lives in localStorage.
   Records / campaign stars / badges are career-only; adventure
   keeps its own save.
   ============================================================ */

/* the mid-run super weapon — strictly better than any loadout */
const ADV_WEAPON = {
  name: 'Rainbow Blaster', blurb: 'the legendary sprayer',
  sound: 'shoot', fireInterval: 0.085, inkCost: 1.1, range: 430,
  projSpeed: 660, damage: 26, pellets: 1, spread: 0.05, splatMin: 20, splatMax: 32,
};

const ADV_LEVELS = [
  {
    name: 'GREY STREETS', map: 'DOWNTOWN', difficulty: 'easy', enemies: 2, time: 150,
    goal: { cov: 30 },
    intro: 'The Eraser has drained the town grey. Two of its minions are on patrol — splash 30% of the streets back to colour before time runs out!',
    outro: 'The streets glow again. But the trail of grey dust leads into the pines…',
  },
  {
    name: 'WHISPERING PINES', map: 'PINE CAMP', difficulty: 'normal', enemies: 3, time: 165,
    goal: { cov: 25, splats: 4 },
    intro: 'The woods are crawling with minions. Paint 25% of the camp AND splat 4 of them to clear the way.',
    outro: 'The pines breathe colour again. One trail left — it leads to the midnight fair. It is THERE.',
  },
  {
    name: 'THE ERASER', map: 'MIDNIGHT FAIR', difficulty: 'normal', enemies: 1, time: 210,
    goal: { boss: true },
    boss: { hp: 480, speed: 92, radius: 46 },
    intro: 'There it is. The ERASER itself, wiping the fair off the board. It erases every inch it crosses — splat it with everything you have!',
    outro: 'SPLAT! The Eraser crumbles into shavings and the fair lights up. The town is safe… for now. THE END — of chapter one.',
  },
];

const Adventure = {
  KEY: 'doodleSlam.adventure',
  team: 0,   // the chosen hero, SPLASH by default

  load() {
    try {
      const p = JSON.parse(localStorage.getItem(this.KEY)) || {};
      return { unlocked: p.unlocked || 0, last: p.last || 0 };
    } catch {
      return { unlocked: 0, last: 0 };
    }
  },
  save(p) {
    try { localStorage.setItem(this.KEY, JSON.stringify(p)); } catch { /* private mode */ }
  },

  lastLevel() {
    return Math.min(this.load().last, ADV_LEVELS.length - 1);
  },
  unlocked(idx) {
    return idx <= this.load().unlocked;
  },
  markStarted(idx) {
    const p = this.load();
    p.last = idx;
    this.save(p);
  },
  markCleared(idx) {
    const p = this.load();
    const next = Math.min(idx + 1, ADV_LEVELS.length - 1);
    p.unlocked = Math.max(p.unlocked, next);
    p.last = next;
    this.save(p);
  },
  reset() {
    this.save({ unlocked: 0, last: 0 });
  },
};

/* did the current level's objective land? */
function advGoalMet(game) {
  const g = ADV_LEVELS[game.adventure.level].goal;
  if (g.boss) return game.adventure.boss && game.adventure.boss.hp <= 0;
  const cov = game.lastCoverage[game.player.team] * 100;
  const sp = game.stats[game.player.team].splats;
  return (g.cov === undefined || cov >= g.cov) &&
         (g.splats === undefined || sp >= g.splats);
}

/* the objective line shown on the HUD */
function advGoalText(game) {
  const g = ADV_LEVELS[game.adventure.level].goal;
  if (g.boss) {
    const b = game.adventure.boss;
    return `${L('BOSS')} ${Math.max(0, Math.ceil(b.hp))} / ${b.maxHp} HP`;
  }
  const cov = (game.lastCoverage[game.player.team] * 100).toFixed(1);
  let t = `${L('GOAL')} ${cov} / ${g.cov}%`;
  if (g.splats !== undefined) {
    t += ` · ${game.stats[game.player.team].splats} / ${g.splats} ${L('splats')}`;
  }
  return t;
}
