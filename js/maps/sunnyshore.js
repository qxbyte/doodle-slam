'use strict';

/* SUNNY SHORE — stage 3. A beach town waterfront: the sea takes
   the whole south edge, two piers reach out over it, and the
   red button waits beside a tidepool. */
registerMap({
  name: 'SUNNY SHORE',
  desc: 'Sun, sand, two piers and a lighthouse.',
  stage: 2,
  seed: 20260709,
  ground: 'sand',
  roadStyle: 'dirt',
  plaza: { x: 1450, y: 780, r: 130 },
  plazaStyle: 'tidepool',
  // the sea owns the south edge, so the two south spawns move up
  spawns: [
    { x: 90, y: 90 }, { x: WORLD.w - 90, y: 90 },
    { x: 90, y: 1040 }, { x: WORLD.w - 90, y: 1040 },
  ],
  buildings: [
    { x: 2080, y: 820,  w: 180, h: 300, kind: 'lighthouse' },
    { x: 1250, y: 280,  w: 280, h: 190, kind: 'shack' },
    { x: 880,  y: 990,  w: 240, h: 110, kind: 'boat' },
    { x: 420,  y: 840,  w: 170, h: 140, kind: 'sandcastle' },
    { x: 700,  y: 560,  w: 160, h: 150, kind: 'umbrella' },
    { x: 1600, y: 940,  w: 150, h: 140, kind: 'umbrella' },
    { x: 1800, y: 480,  w: 140, h: 110, kind: 'crates' },
    { x: 150,  y: 450,  w: 110, h: 85,  kind: 'rock' },
    { x: 2250, y: 300,  w: 90,  h: 70,  kind: 'rock' },
    { x: 950,  y: 150,  w: 120, h: 90,  kind: 'rock' },
  ],
  // the sea, with two pier-sized gaps; small caps close the gaps
  // below the pier decks so they read as dead ends over water
  water: [
    { x: 0,    y: 1180, w: 480,  h: 420 },
    { x: 590,  y: 1180, w: 1130, h: 420 },
    { x: 1830, y: 1180, w: 570,  h: 420 },
    { x: 480,  y: 1460, w: 110,  h: 140 },
    { x: 1720, y: 1490, w: 110,  h: 110 },
  ],
  // piers are just bridges reaching into the sea
  bridges: [
    { x: 480,  y: 1160, w: 110, h: 300 },
    { x: 1720, y: 1160, w: 110, h: 330 },
  ],
  roads: [
    { x1: 0, y1: 1080, x2: WORLD.w, y2: 1080, w: 80 },
    { x1: 1150, y1: 0, x2: 1150, y2: 1080, w: 80 },
  ],
  shells: [
    [300, 1120], [650, 1050], [1000, 1130], [1350, 1080], [1900, 1120],
    [2200, 1050], [520, 700], [1700, 650],
  ],
  starfish: [[380, 1100], [1550, 1120], [850, 880], [2100, 620], [1250, 950]],
  gulls: [[550, 300], [1650, 180], [2050, 950], [300, 750], [1050, 500]],
  trees: [[180, 200], [2150, 150], [400, 320]],
  grass: 70,
  flowers: [[250, 600], [1950, 250], [600, 180]],
});
