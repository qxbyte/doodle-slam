'use strict';

/* FERN HOLLOW — stage 2 wilds. A shaded hollow: a creek with two
   log crossings, one ancient tree, giant mushroom clusters and a
   standing-stone circle where the red button appears. */
registerMap({
  name: 'FERN HOLLOW',
  desc: 'A creek, giant mushrooms and a stone circle deep in the woods.',
  stage: 1,
  seed: 20260706,
  plaza: { x: 620, y: 1230, r: 130 },
  plazaStyle: 'stones',
  ambient: 'leaves',
  roadStyle: 'dirt',
  buildings: [
    { x: 460,  y: 380,  w: 240, h: 210, kind: 'bigtree' },
    { x: 1450, y: 280,  w: 130, h: 105, kind: 'mushroom' },
    { x: 1660, y: 880,  w: 140, h: 110, kind: 'mushroom' },
    { x: 380,  y: 960,  w: 130, h: 100, kind: 'mushroom' },
    { x: 1980, y: 480,  w: 120, h: 95,  kind: 'mushroom' },
    { x: 1880, y: 1230, w: 190, h: 150, kind: 'cabin' },
    { x: 150,  y: 200,  w: 100, h: 80,  kind: 'rock' },
    { x: 950,  y: 200,  w: 110, h: 80,  kind: 'rock' },
    { x: 1350, y: 1420, w: 100, h: 75,  kind: 'rock' },
    { x: 2240, y: 900,  w: 90,  h: 70,  kind: 'rock' },
    { x: 750,  y: 800,  w: 120, h: 95,  kind: 'tent' },
  ],
  water: [
    { x: 1080, y: 0,    w: 130, h: 580 },
    { x: 1080, y: 740,  w: 130, h: 420 },
    { x: 1080, y: 1320, w: 130, h: 280 },
  ],
  bridges: [
    { x: 1060, y: 580,  w: 170, h: 160 },
    { x: 1060, y: 1160, w: 170, h: 160 },
  ],
  roads: [
    { x1: 0, y1: 650, x2: WORLD.w, y2: 650, w: 84 },
    { x1: 1900, y1: 0, x2: 1900, y2: WORLD.h, w: 84 },
  ],
  trees: [
    [300, 700], [850, 1050], [1550, 1200], [2200, 700], [1300, 900],
  ],
  pines: [
    [130, 90], [420, 130], [700, 100], [1300, 150], [1700, 90], [2100, 130], [2330, 260],
    [120, 560], [140, 900], [110, 1250], [300, 1470],
    [900, 1400], [1150, 1470], [1600, 1440], [2050, 1470], [2330, 1300],
    [820, 350], [1350, 450], [1600, 600], [2200, 350], [1450, 1050],
    [500, 850], [900, 600],
  ],
  logs: [
    [750, 500, -0.4], [1750, 700, 0.9], [400, 1420, 0.1], [2150, 1150, -1.1],
  ],
  flowers: [
    [600, 700], [950, 950], [1500, 780], [1850, 550], [500, 1100],
    [1250, 1250], [2250, 1050], [850, 250],
  ],
  grass: 190,
  kiosks: [],
  cars: [],
});
