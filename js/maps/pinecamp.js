'use strict';

/* PINE CAMP — stage 2 wilds. A lakeside campground: dirt paths,
   tents and log cabins under dense pines, a ranger watchtower,
   and a campfire clearing where the red button appears. */
registerMap({
  name: 'PINE CAMP',
  desc: 'Lakeside campground — tents, a watchtower and a campfire clearing.',
  stage: 1,
  seed: 20260705,
  plaza: { x: 1200, y: 1000, r: 140 },
  plazaStyle: 'campfire',
  ambient: 'leaves',
  roadStyle: 'dirt',
  buildings: [
    { x: 300,  y: 250,  w: 150, h: 150, kind: 'tower' },
    { x: 700,  y: 190,  w: 190, h: 150, kind: 'cabin' },
    { x: 1480, y: 170,  w: 210, h: 160, kind: 'cabin' },
    { x: 400,  y: 1090, w: 200, h: 150, kind: 'cabin' },
    { x: 1620, y: 1160, w: 190, h: 150, kind: 'cabin' },
    { x: 890,  y: 590,  w: 180, h: 140, kind: 'cabin' },
    { x: 1030, y: 280,  w: 120, h: 100, kind: 'tent' },
    { x: 1190, y: 420,  w: 120, h: 100, kind: 'tent' },
    { x: 800,  y: 1290, w: 120, h: 100, kind: 'tent' },
    { x: 2000, y: 1240, w: 130, h: 105, kind: 'tent' },
    { x: 500,  y: 620,  w: 100, h: 80,  kind: 'rock' },
    { x: 1690, y: 680,  w: 110, h: 85,  kind: 'rock' },
    { x: 2180, y: 190,  w: 90,  h: 70,  kind: 'rock' },
    { x: 160,  y: 1380, w: 100, h: 75,  kind: 'rock' },
  ],
  water: [
    { x: 1880, y: 520, w: 520, h: 430 },   // the lake
  ],
  roads: [
    { x1: 0, y1: 830, x2: WORLD.w, y2: 830, w: 90 },
    { x1: 1210, y1: 0, x2: 1210, y2: WORLD.h, w: 84 },
  ],
  trees: [
    [640, 480], [1560, 520], [340, 900], [1050, 1470], [2260, 1120],
  ],
  pines: [
    // north edge
    [140, 160], [230, 90], [560, 110], [940, 90], [1330, 120], [1800, 90], [1950, 210],
    // west side
    [120, 500], [190, 700], [110, 980], [230, 1180],
    // around the lake
    [1830, 440], [2320, 470], [2340, 1010], [1800, 1020],
    // south edge + middle clusters
    [400, 1480], [700, 1440], [1300, 1400], [1500, 1470], [1900, 1460], [2200, 1380],
    [760, 420], [620, 780], [1420, 760], [1560, 900], [980, 900],
  ],
  logs: [
    [620, 950, 0.3], [1450, 1290, -0.2], [340, 520, 1.2],
  ],
  flowers: [
    [880, 470], [960, 1180], [1350, 630], [520, 1330], [2080, 1100], [1750, 380],
  ],
  grass: 150,
  kiosks: [],
  cars: [],
});
