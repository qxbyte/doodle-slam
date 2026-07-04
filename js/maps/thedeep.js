'use strict';

/* THE DEEP — stage 4. The seabed below SUNNY SHORE: a shipwreck,
   coral heads, a diving bell, treasure — and ocean currents that
   sweep anyone who wades into them. The red button rests on the
   pearl of a giant clam. */
registerMap({
  name: 'THE DEEP',
  desc: 'A wreck, corals and currents that carry you away.',
  stage: 3,
  seed: 20260712,
  palette: 'deep',
  ground: 'seabed',
  plaza: { x: 800, y: 950, r: 130 },
  plazaStyle: 'clam',
  buildings: [
    { x: 900,  y: 300,  w: 460, h: 260, kind: 'wreck' },
    { x: 350,  y: 700,  w: 180, h: 140, kind: 'coral' },
    { x: 1700, y: 500,  w: 190, h: 150, kind: 'coral' },
    { x: 500,  y: 1250, w: 170, h: 130, kind: 'coral' },
    { x: 1450, y: 1100, w: 140, h: 170, kind: 'anchor' },
    { x: 2050, y: 900,  w: 150, h: 120, kind: 'chest' },
    { x: 250,  y: 250,  w: 180, h: 200, kind: 'divebell' },
    { x: 2200, y: 300,  w: 110, h: 85,  kind: 'rock' },
    { x: 1150, y: 880,  w: 100, h: 80,  kind: 'rock' },
    { x: 1900, y: 1350, w: 110, h: 80,  kind: 'rock' },
  ],
  // ocean currents: {rect, unit flow direction}
  currents: [
    { x: 0,    y: 600,  w: 780, h: 130, dx: 1,  dy: 0 },
    { x: 1620, y: 1020, w: 780, h: 130, dx: -1, dy: 0 },
    { x: 1230, y: 120,  w: 130, h: 700, dx: 0,  dy: 1 },
  ],
  kelp: [
    [150, 600], [700, 250], [1550, 300], [2300, 600], [400, 1500],
    [1000, 1450], [1700, 1500], [2250, 1250], [900, 700], [1350, 1250],
  ],
  fishes: [[550, 450], [1500, 750], [2100, 550], [750, 1150], [1750, 1300], [1150, 100]],
  jellies: [[300, 1000], [1050, 550], [1900, 250], [2280, 1050], [650, 100]],
});
