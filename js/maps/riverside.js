'use strict';

/* RIVERSIDE — a river splits the town in two; the bridges are
   chokepoints. Train station in the north, stadium and a park
   pond (where the red button appears) in the south. */
registerMap({
  name: 'RIVERSIDE',
  desc: 'A river cuts the town in two — fight for the bridges.',
  stage: 0,
  seed: 20260704,
  plaza: { x: 360, y: 1130, r: 130 },
  plazaStyle: 'pond',
  buildings: [
    { x: 150,  y: 120,  w: 240, h: 200, kind: 'office' },
    { x: 660,  y: 140,  w: 190, h: 170, kind: 'house' },
    { x: 940,  y: 130,  w: 420, h: 170, kind: 'station' },
    { x: 1500, y: 130,  w: 170, h: 160, kind: 'house' },
    { x: 1980, y: 150,  w: 250, h: 210, kind: 'office' },
    { x: 200,  y: 460,  w: 200, h: 180, kind: 'house' },
    { x: 900,  y: 430,  w: 260, h: 200, kind: 'billboard' },
    { x: 1420, y: 440,  w: 200, h: 170, kind: 'house' },
    { x: 2020, y: 470,  w: 220, h: 180, kind: 'office' },
    { x: 900,  y: 1030, w: 560, h: 380, kind: 'stadium' },
    { x: 620,  y: 1200, w: 170, h: 150, kind: 'house' },
    { x: 1720, y: 1010, w: 180, h: 150, kind: 'house' },
    { x: 2080, y: 1180, w: 200, h: 220, kind: 'office' },
  ],
  water: [
    { x: 0,    y: 740, w: 520,  h: 150 },
    { x: 640,  y: 740, w: 1060, h: 150 },
    { x: 1820, y: 740, w: 580,  h: 150 },
  ],
  bridges: [
    { x: 520,  y: 730, w: 120, h: 170 },
    { x: 1700, y: 730, w: 120, h: 170 },
  ],
  rails: [{ y: 70 }],
  courts: [{ x: 1950, y: 1030, w: 230, h: 140 }],
  roads: [
    { x1: 580, y1: 0, x2: 580, y2: WORLD.h, w: 100 },
    { x1: 1760, y1: 0, x2: 1760, y2: WORLD.h, w: 100 },
    { x1: 0, y1: 370, x2: WORLD.w, y2: 370, w: 100 },
    { x1: 0, y1: 950, x2: WORLD.w, y2: 950, w: 100 },
  ],
  crosswalks: [{ x: 640, y: 920 }, { x: 1620, y: 920 }],
  trees: [
    // park around the pond plaza
    [200, 1000], [300, 950], [480, 980], [560, 1080], [520, 1260],
    [230, 1300], [150, 1120], [420, 1400],
    // riverbanks + scattered
    [760, 680], [1220, 690], [1560, 660], [2000, 680], [880, 940],
    [1350, 960], [2280, 1000], [740, 350], [1800, 420], [2300, 240],
    [120, 700], [1160, 1470], [1600, 1480],
  ],
  cars: [
    [545, 320, 1], [617, 1250, 1], [1727, 500, 1], [1795, 1120, 1],
    [1000, 1000, 0], [2050, 918, 0], [400, 335, 0], [1560, 405, 0],
  ],
  kiosks: [[2250, 650], [820, 1470]],
});
