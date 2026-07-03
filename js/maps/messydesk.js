'use strict';

/* MESSY DESK — stage 3. Zoom out and the truth shows: the whole
   arena is the desktop the doodles live on. Stationery is cover,
   washi-tape strips are the roads, and the red button floats on
   a spilled bottle of ink. */
registerMap({
  name: 'MESSY DESK',
  desc: 'Duck behind the stationery and claim the ink spill.',
  stage: 2,
  seed: 20260707,
  ground: 'desk',
  roadStyle: 'tape',
  plaza: { x: 950, y: 1000, r: 140 },
  plazaStyle: 'ink',
  buildings: [
    { x: 300,  y: 240,  w: 230, h: 130, kind: 'eraser' },
    { x: 860,  y: 170,  w: 180, h: 180, kind: 'notepad' },
    { x: 1560, y: 220,  w: 400, h: 190, kind: 'pencilcase' },
    { x: 2110, y: 620,  w: 190, h: 190, kind: 'mug' },
    { x: 620,  y: 520,  w: 640, h: 64,  kind: 'ruler' },
    { x: 1450, y: 700,  w: 150, h: 120, kind: 'sharpener' },
    { x: 380,  y: 1180, w: 280, h: 110, kind: 'stapler' },
    { x: 1350, y: 1130, w: 620, h: 56,  kind: 'pencil' },
    { x: 2060, y: 1300, w: 210, h: 120, kind: 'eraser' },
    { x: 140,  y: 700,  w: 170, h: 170, kind: 'notepad' },
  ],
  roads: [
    { x1: 0, y1: 880, x2: WORLD.w, y2: 880, w: 90 },
    { x1: 1180, y1: 0, x2: 1180, y2: WORLD.h, w: 84 },
  ],
  // loose sheets of homework, still doodled on
  papers: [
    [560, 330, -0.08], [1300, 420, 0.1], [1900, 950, -0.14],
    [700, 1420, 0.06], [1650, 1450, -0.05], [250, 950, 0.12],
    [2250, 180, 0.18],
  ],
  rings: [[1980, 480], [420, 640], [1150, 1350], [2280, 1030]],
  clips: [[760, 700, 0.4], [1620, 580, -0.7], [980, 1250, 1.2], [2200, 1050, 0.2], [480, 420, -1.1]],
  shavings: [[1560, 850], [1370, 640], [530, 1050]],
});
