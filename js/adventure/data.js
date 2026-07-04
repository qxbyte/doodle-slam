'use strict';

/* ============================================================
   Adventure mode — data & saves. Standalone module tree
   (js/adventure/): the story mode shares the engine's map
   rendering, paint system, fighter and audio, but keeps its own
   level definitions, enemies, world-map select and runtime.

   Chapter one: the ERASER drains the world grey. Each level is
   a ROUTE across a map — a chain of areas with grey minions on
   patrol. Step into an area and its minions wake up and attack
   (slow, dodgeable shots — movement is the defence). Clear every
   area to light that part of the world map back up. Normal
   levels have no boss; the last one is the ERASER itself.
   ============================================================ */

/* the mid-run super weapon — strictly better than any loadout */
const ADV_WEAPON = {
  name: 'Rainbow Blaster', blurb: 'the legendary sprayer',
  sound: 'shoot', fireInterval: 0.085, inkCost: 1.1, range: 430,
  projSpeed: 660, damage: 26, pellets: 1, spread: 0.05, splatMin: 20, splatMax: 32,
};

/* Enemy tuning per level tier. Shots stay slow and sparse on
   purpose: the player outruns them (175-235 px/s) with room to
   dodge; later tiers add pressure without becoming a bullet hell. */
const ADV_TIERS = [
  { hp: 34, shotSpeed: 200, fireEvery: 1.9, dmg: 12, aimNoise: 0.16 },
  { hp: 46, shotSpeed: 220, fireEvery: 1.6, dmg: 14, aimNoise: 0.11 },
  { hp: 60, shotSpeed: 235, fireEvery: 1.45, dmg: 16, aimNoise: 0.08 },
];

/* Levels. route[] areas are visited in order: enter the circle to
   wake its minions, splat them all to light the area up. `foes` =
   how many minions patrol it. The final area may carry the boss. */
const ADV_LEVELS = [
  {
    name: 'GREY STREETS', map: 'DOWNTOWN', tier: 0,
    region: 'city',
    intro: 'The Eraser has drained the world grey, block by block. Its minions patrol the old streets — follow the route, wake them, splat every last one!',
    outro: 'The streets glow again and a corner of the world map lights up. The grey trail leads into the pines…',
    route: [
      { x: 420,  y: 380,  r: 230, foes: 2 },
      { x: 1250, y: 900,  r: 250, foes: 3 },
      { x: 2050, y: 480,  r: 230, foes: 3 },
      { x: 1850, y: 1330, r: 250, foes: 4 },
    ],
  },
  {
    name: 'WHISPERING PINES', map: 'PINE CAMP', tier: 1,
    region: 'pines',
    intro: 'The woods crawl with grey. The minions here shoot straighter — keep moving, weave between the pines, and clear every camp on the trail.',
    outro: 'The forest breathes colour again. One trail left on the map — it ends at the midnight fair. Something big is waiting.',
    route: [
      { x: 400,  y: 1250, r: 240, foes: 3 },
      { x: 700,  y: 480,  r: 230, foes: 3 },
      { x: 1500, y: 800,  r: 250, foes: 4 },
      { x: 2050, y: 350,  r: 230, foes: 3 },
      { x: 2000, y: 1300, r: 250, foes: 5 },
    ],
  },
  {
    name: 'THE ERASER', map: 'MIDNIGHT FAIR', tier: 2,
    region: 'fair',
    intro: 'The fair at the end of the world map — and THERE it is. Fight through its guard, then face the ERASER. Watch its volleys and the charge: keep moving and it cannot touch you.',
    outro: 'SPLAT! The Eraser crumbles into shavings, the fair lights up, and the whole world map shines again. The town is saved… until chapter two. THE END.',
    route: [
      { x: 600,  y: 500,  r: 260, foes: 4 },
      { x: 1750, y: 1150, r: 260, foes: 5 },
      { x: 1200, y: 800,  r: 320, foes: 0, boss: { hp: 620, speed: 100, radius: 46 } },
    ],
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
  /* a region is LIT once its level has been cleared */
  lit(idx) {
    return idx < this.load().unlocked || this.load().unlocked > ADV_LEVELS.length - 1;
  },
  clearedAll() {
    const p = this.load();
    return p.unlocked >= ADV_LEVELS.length - 1 && p.clearedFinal === true;
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
    if (idx === ADV_LEVELS.length - 1) p.clearedFinal = true;
    this.save(p);
  },
  clearedLevel(idx) {
    const p = this.load();
    return idx < p.unlocked || (idx === ADV_LEVELS.length - 1 && p.clearedFinal === true);
  },
  reset() {
    this.save({ unlocked: 0, last: 0 });
  },
};
