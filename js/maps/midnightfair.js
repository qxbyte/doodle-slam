'use strict';

/* MIDNIGHT FAIR — stage 6. The whole map is a chalk drawing on
   a blackboard: a night funfair with a ferris wheel, carousel,
   big top and game stalls. The red button stands on the chalk
   show stage. */
registerMap({
  name: 'MIDNIGHT FAIR',
  desc: 'A funfair chalked onto the blackboard after dark.',
  stage: 5,
  seed: 20260711,
  palette: 'chalk',
  ground: 'chalk',
  roadStyle: 'chalk',
  plaza: { x: 600, y: 1300, r: 130 },
  plazaStyle: 'stage',
  buildings: [
    { x: 1700, y: 250,  w: 420, h: 440, kind: 'ferriswheel' },
    { x: 450,  y: 350,  w: 300, h: 240, kind: 'carousel' },
    { x: 950,  y: 1080, w: 380, h: 300, kind: 'circustent' },
    { x: 1250, y: 300,  w: 150, h: 160, kind: 'balloonstand' },
    { x: 300,  y: 880,  w: 260, h: 170, kind: 'gamestall' },
    { x: 1680, y: 950,  w: 260, h: 170, kind: 'gamestall' },
    { x: 1080, y: 640,  w: 150, h: 140, kind: 'popcorncart' },
    { x: 2100, y: 1250, w: 150, h: 140, kind: 'balloonstand' },
  ],
  roads: [
    { x1: 0, y1: 780, x2: WORLD.w, y2: 780, w: 80 },
    { x1: 1480, y1: 0, x2: 1480, y2: WORLD.h, w: 80 },
  ],
  bunting: [
    [450, 320, 950, 220], [950, 220, 1500, 300], [300, 850, 720, 800],
    [1400, 920, 1720, 900], [1250, 1400, 1700, 1450],
  ],
  chalkstars: [
    [180, 200], [850, 150], [1600, 120], [2280, 450], [150, 620],
    [2300, 850], [750, 700], [1550, 700], [200, 1450], [2280, 1500],
    [1450, 1250], [850, 1500],
  ],
  trees: [[180, 950], [2260, 620], [2320, 100], [650, 1500]],
});
