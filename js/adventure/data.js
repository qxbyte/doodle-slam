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

/* mid-run super weapons — every one outguns any starting loadout.
   Levels cycle through them so runs feel different. */
const ADV_WEAPONS = [
  { name: 'Rainbow Blaster', blurb: 'the legendary sprayer',
    sound: 'shoot', fireInterval: 0.085, inkCost: 1.1, range: 430,
    projSpeed: 660, damage: 26, pellets: 1, spread: 0.05, splatMin: 20, splatMax: 32 },
  { name: 'Triple Splasher', blurb: 'three streams, one trigger',
    sound: 'scatter', fireInterval: 0.16, inkCost: 2.6, range: 390,
    projSpeed: 600, damage: 16, pellets: 3, spread: 0.18, splatMin: 16, splatMax: 26 },
  { name: 'Boom Brush', blurb: 'slow strokes that explode',
    sound: 'roller', fireInterval: 0.5, inkCost: 5.5, range: 470,
    projSpeed: 520, damage: 55, pellets: 1, spread: 0.03, splatMin: 34, splatMax: 46,
    boomSplash: 35, boomRadius: 95 },
];
const ADV_WEAPON = ADV_WEAPONS[0];   // legacy alias

/* which minion breed spawns, by tier — variety ramps up with the
   chapter: shooters everywhere, chargers from tier 1, lobbers
   from tier 2 */
function advMinionKind(tier, rng) {
  const roll = rng();
  if (tier === 0) return 'shooter';
  if (tier === 1) return roll < 0.28 ? 'charger' : 'shooter';
  if (tier === 2) return roll < 0.3 ? 'charger' : roll < 0.52 ? 'lobber' : 'shooter';
  return roll < 0.34 ? 'charger' : roll < 0.62 ? 'lobber' : 'shooter';
}

/* Enemy tuning per level tier. Shots stay slow and sparse on
   purpose: the player outruns them (175-235 px/s) with room to
   dodge; later tiers add pressure without becoming a bullet hell. */
const ADV_TIERS = [
  { hp: 34, shotSpeed: 200, fireEvery: 1.9,  dmg: 12, aimNoise: 0.16 },
  { hp: 46, shotSpeed: 215, fireEvery: 1.7,  dmg: 14, aimNoise: 0.12 },
  { hp: 58, shotSpeed: 228, fireEvery: 1.55, dmg: 16, aimNoise: 0.09 },
  { hp: 72, shotSpeed: 240, fireEvery: 1.4,  dmg: 18, aimNoise: 0.06 },
];

/* Levels. route[] areas are visited in order: enter the circle to
   wake its minions, splat them all to light the area up. `foes` =
   how many minions patrol it. The final area may carry the boss. */
const ADV_LEVELS = [
  {
    name: 'GREY STREETS', map: 'DOWNTOWN', tier: 0, region: 'city',
    intro: 'The Eraser has drained the world grey, block by block. Its minions patrol the old streets — follow the route, wake them, splat every last one!',
    outro: 'The streets glow again and a corner of the world map lights up. The grey trail crosses the river…',
    route: [
      { x: 420,  y: 380,  r: 230, foes: 2 },
      { x: 1250, y: 900,  r: 250, foes: 3 },
      { x: 2050, y: 480,  r: 230, foes: 3 },
      { x: 1850, y: 1330, r: 250, foes: 4 },
    ],
  },
  {
    name: 'RIVERSIDE RUN', map: 'RIVERSIDE', tier: 0, region: 'river',
    intro: 'Grey patrols hold both banks and the bridges between them. Sweep the riverside clean — mind the crossings, they love an ambush.',
    outro: 'Both banks shine again. The trail slips away toward the midnight fair — something is performing there.',
    route: [
      { x: 450,  y: 320,  r: 230, foes: 2 },
      { x: 1800, y: 400,  r: 240, foes: 3 },
      { x: 1150, y: 850,  r: 260, foes: 3 },
      { x: 1750, y: 1300, r: 240, foes: 4 },
    ],
  },
  {
    name: 'FAIR SHADOW', map: 'MIDNIGHT FAIR', tier: 1, region: 'fair',
    intro: 'The chalk fair has a new act: a SHADOW of the Eraser. Clear its guard, then pop the copy — watch the volleys, keep your feet moving.',
    outro: 'The shadow bursts like a soap bubble… a decoy! The real trail runs into the pines. The map lights up anyway — take the win.',
    route: [
      { x: 600,  y: 500,  r: 250, foes: 3 },
      { x: 1750, y: 1150, r: 250, foes: 4 },
      { x: 1200, y: 800,  r: 300, foes: 0, boss: { kind: 'shadow', hp: 560, speed: 95, radius: 44, volley: 3, volleyEvery: 2.4, chargeEvery: 8, telegraph: 0.9, skillEvery: 9 } },
    ],
  },
  {
    name: 'PINE TRAIL', map: 'PINE CAMP', tier: 1, region: 'pines',
    intro: 'The woods crawl with grey. The minions here shoot straighter — weave between the pines and clear every camp on the trail.',
    outro: 'The forest breathes colour again. Deeper in, the ferns are still grey…',
    route: [
      { x: 400,  y: 1250, r: 240, foes: 3 },
      { x: 700,  y: 480,  r: 230, foes: 3 },
      { x: 1500, y: 800,  r: 250, foes: 4 },
      { x: 2050, y: 350,  r: 230, foes: 3 },
      { x: 2000, y: 1300, r: 250, foes: 4 },
    ],
  },
  {
    name: 'FERN HOLLOW', map: 'FERN HOLLOW', tier: 1, region: 'ferns',
    intro: 'Down in the hollow the grey hides behind giant mushrooms. Flush every patrol out of the ferns — the creek crossings are choke points.',
    outro: 'The hollow hums with colour. The trail climbs — up into the frozen pass.',
    route: [
      { x: 400,  y: 350,  r: 240, foes: 3 },
      { x: 1250, y: 300,  r: 240, foes: 4 },
      { x: 2000, y: 500,  r: 240, foes: 3 },
      { x: 1500, y: 1100, r: 250, foes: 4 },
      { x: 700,  y: 1250, r: 250, foes: 4 },
    ],
  },
  {
    name: 'FROZEN PASS', map: 'POWDER PEAKS', tier: 2, region: 'peaks',
    intro: 'Grey squads camp across the snowfields — and the ice lakes will carry you straight through their fire lanes if you are not careful. Skate smart.',
    outro: 'The pass is painted. Far below, the shore is under siege…',
    route: [
      { x: 450,  y: 400,  r: 240, foes: 3 },
      { x: 1300, y: 350,  r: 240, foes: 4 },
      { x: 2050, y: 600,  r: 240, foes: 4 },
      { x: 1600, y: 1250, r: 250, foes: 5 },
      { x: 800,  y: 1150, r: 240, foes: 4 },
    ],
  },
  {
    name: 'SHORE SIEGE', map: 'SUNNY SHORE', tier: 2, region: 'shore',
    intro: 'A SMUDGE — a bigger, meaner copy — leads the siege on the shore. Break its beach patrols first, then knock it into the tide. Its fan is wider: dodge sideways, not backwards.',
    outro: 'The smudge dissolves into the surf. Two trails left on the map — and they both point at the volcano rim. Almost there.',
    route: [
      { x: 500,  y: 350,  r: 240, foes: 3 },
      { x: 1350, y: 300,  r: 240, foes: 4 },
      { x: 2050, y: 450,  r: 240, foes: 4 },
      { x: 1200, y: 750,  r: 300, foes: 0, boss: { kind: 'smudge', hp: 900, speed: 104, radius: 48, volley: 4, volleyEvery: 2.1, chargeEvery: 6.5, telegraph: 0.8, skillEvery: 11 } },
    ],
  },
  {
    name: 'DESK DIVE', map: 'MESSY DESK', tier: 3, region: 'desk',
    intro: 'The grey has reached the desk itself — the paper the whole world is drawn on. Clear the stationery line by line before it erases the source.',
    outro: 'The desk is safe, the doodles keep breathing. Next stop: the crater fields.',
    route: [
      { x: 450,  y: 300,  r: 240, foes: 4 },
      { x: 1600, y: 320,  r: 240, foes: 4 },
      { x: 2050, y: 900,  r: 240, foes: 4 },
      { x: 1150, y: 1300, r: 250, foes: 5 },
      { x: 500,  y: 1050, r: 240, foes: 4 },
    ],
  },
  {
    name: 'CRATER MARCH', map: 'CRATER FIELD', tier: 3, region: 'moon',
    intro: 'Even the moon is turning grey. March crater to crater and wipe out the lunar patrols — the final trail starts here.',
    outro: 'The moon glows in four colours. One region left on the map, and it is glowing red: the volcano. The REAL Eraser is waiting.',
    route: [
      { x: 500,  y: 400,  r: 240, foes: 4 },
      { x: 1400, y: 300,  r: 240, foes: 4 },
      { x: 2050, y: 700,  r: 240, foes: 5 },
      { x: 1500, y: 1250, r: 250, foes: 5 },
      { x: 700,  y: 1250, r: 240, foes: 5 },
    ],
  },
  {
    name: 'THE ERASER', map: 'CINDER BASIN', tier: 3, region: 'volcano',
    intro: 'The volcano rim — and the REAL Eraser, huge and furious. Five-shot fans, quicker charges, and lava underfoot. Keep moving, keep painting, and end the grey for good.',
    outro: 'SPLAT! The Eraser crumbles into a mountain of shavings and every region on the map blazes with colour. The world is saved… until chapter two. THE END.',
    route: [
      { x: 500,  y: 350,  r: 240, foes: 4 },
      { x: 1700, y: 400,  r: 240, foes: 5 },
      { x: 600,  y: 1150, r: 240, foes: 5 },
      { x: 1900, y: 1250, r: 240, foes: 5 },
      { x: 1300, y: 1050, r: 320, foes: 0, boss: { kind: 'prime', hp: 1300, speed: 112, radius: 52, volley: 5, volleyEvery: 1.9, chargeEvery: 5.5, telegraph: 0.7, skillEvery: 9 } },
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
