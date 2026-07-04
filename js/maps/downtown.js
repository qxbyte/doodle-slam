'use strict';

/* DOWNTOWN — the original town: mall, plaza fountain, tight streets. */
registerMap({
  name: 'DOWNTOWN',
  desc: 'The classic block party — mall, plaza fountain and tight streets.',
  stage: 0,
  seed: 20260703,
  plaza: { x: 760, y: 900, r: 150 },
  plazaStyle: 'fountain',
  buildings: [
    { x: 150,  y: 210,  w: 300, h: 190, kind: 'mall' },
    { x: 620,  y: 120,  w: 210, h: 260, kind: 'office' },
    { x: 1180, y: 170,  w: 260, h: 210, kind: 'billboard' },
    { x: 1700, y: 120,  w: 230, h: 230, kind: 'office' },
    { x: 2080, y: 260,  w: 220, h: 200, kind: 'heli' },
    { x: 240,  y: 700,  w: 220, h: 260, kind: 'office' },
    { x: 1120, y: 660,  w: 180, h: 150, kind: 'house' },
    { x: 1560, y: 620,  w: 250, h: 240, kind: 'office' },
    { x: 2050, y: 780,  w: 200, h: 170, kind: 'house' },
    { x: 170,  y: 1180, w: 240, h: 200, kind: 'office' },
    { x: 700,  y: 1240, w: 170, h: 140, kind: 'house' },
    { x: 1150, y: 1180, w: 280, h: 220, kind: 'office' },
    { x: 1760, y: 1220, w: 190, h: 150, kind: 'house' },
    { x: 2120, y: 1160, w: 180, h: 220, kind: 'office' },
  ],
  roads: [
    { x1: 0, y1: 820, x2: WORLD.w, y2: 820, w: 110 },
    { x1: 560, y1: 0, x2: 560, y2: WORLD.h, w: 100 },
    { x1: 1620, y1: 0, x2: 1620, y2: WORLD.h, w: 100 },
  ],
  crosswalks: [{ x: 500, y: 770 }],
  trees: [
    [520, 520], [980, 300], [1520, 430], [1980, 560], [420, 1060],
    [980, 1000], [1480, 1050], [2000, 1030], [560, 1420], [1000, 1480],
    [1560, 1440], [2260, 640], [130, 560], [2300, 1460], [1350, 90],
  ],
  cars: [
    [700, 860, 0], [1200, 782, 0], [1900, 858, 0],
    [522, 400, 1], [598, 1200, 1], [1660, 300, 1], [1582, 1300, 1],
  ],
  kiosks: [[360, 950], [1900, 1440]],
  // an unmarked little door on the mall's south wall. walk into it.
  egg: { x: 280, y: 400, w: 40, h: 26, map: 'THE BLUEPRINT' },
});
