'use strict';

/* CINDER BASIN — stage 9. An ash plain split by a lava river with
   two basalt causeways; pools of magma dot the flanks. Standing in
   lava melts you (see the game loop) and lava never holds paint.
   The red button sits on a glowing fissure vent. */
registerMap({
  name: 'CINDER BASIN',
  mood: 'volcano',
  desc: 'Cross the lava river — or melt trying.',
  stage: 8,
  seed: 20260901,
  ground: 'ash',
  ambient: 'dust',
  plaza: { x: 680, y: 1150, r: 120 },
  plazaStyle: 'vent',
  buildings: [
    { x: 1450, y: 180,  w: 400, h: 300, kind: 'cone' },
    { x: 300,  y: 300,  w: 200, h: 150, kind: 'crag' },
    { x: 900,  y: 380,  w: 170, h: 130, kind: 'crag' },
    { x: 2050, y: 480,  w: 180, h: 140, kind: 'crag' },
    { x: 1250, y: 1000, w: 200, h: 150, kind: 'crag' },
    { x: 1850, y: 1250, w: 170, h: 130, kind: 'crag' },
    { x: 550,  y: 620,  w: 110, h: 85,  kind: 'rock' },
    { x: 1600, y: 900,  w: 100, h: 80,  kind: 'rock' },
    { x: 350,  y: 1400, w: 110, h: 80,  kind: 'rock' },
    { x: 2200, y: 1050, w: 100, h: 85,  kind: 'rock' },
  ],
  // the lava river (gaps at x 900–1040 and 1860–2000 are causeways) + pools
  lava: [
    { x: 0,    y: 690,  w: 900, h: 130 },
    { x: 1040, y: 690,  w: 820, h: 130 },
    { x: 2000, y: 690,  w: 400, h: 130 },
    { x: 260,  y: 1180, w: 230, h: 150 },
    { x: 1950, y: 150,  w: 240, h: 160 },
    { x: 1080, y: 1330, w: 260, h: 140 },
  ],
  vents: [
    [700, 300], [1250, 550], [2250, 350], [500, 950],
    [1550, 1200], [2100, 1450], [900, 1500],
  ],
});
