'use strict';

/* CRATER FIELD — stage 4. Doodle space: a moon base dome, a rocket
   on its pad, a crashed saucer, planted flags and rover tracks.
   The red button sits inside the biggest crater. */
registerMap({
  name: 'CRATER FIELD',
  desc: 'A moon base, a rocket pad and one crashed saucer.',
  stage: 5,
  seed: 20260708,
  ground: 'moon',
  roadStyle: 'dirt',
  plaza: { x: 1200, y: 800, r: 150 },
  plazaStyle: 'crater',
  buildings: [
    { x: 300,  y: 300,  w: 260, h: 220, kind: 'dome' },
    { x: 1700, y: 220,  w: 240, h: 280, kind: 'rocketpad' },
    { x: 700,  y: 1100, w: 230, h: 210, kind: 'lander' },
    { x: 1850, y: 1150, w: 300, h: 160, kind: 'ufo' },
    { x: 1150, y: 280,  w: 110, h: 85,  kind: 'rock' },
    { x: 500,  y: 800,  w: 120, h: 90,  kind: 'rock' },
    { x: 2200, y: 700,  w: 100, h: 80,  kind: 'rock' },
    { x: 1450, y: 1350, w: 110, h: 80,  kind: 'rock' },
    { x: 150,  y: 1250, w: 90,  h: 70,  kind: 'rock' },
  ],
  // rover tracks
  roads: [
    { x1: 0, y1: 600, x2: WORLD.w, y2: 600, w: 80 },
    { x1: 900, y1: 0, x2: 900, y2: WORLD.h, w: 80 },
  ],
  craters: [
    [400, 620, 70], [1600, 940, 90], [820, 400, 52], [2100, 400, 84],
    [1100, 1420, 76], [300, 1000, 56], [2260, 1280, 62], [1500, 150, 55],
    [650, 180, 40], [2000, 800, 44], [180, 480, 38], [1750, 1450, 48],
  ],
  flags: [[600, 250], [1350, 1000], [2010, 950], [900, 1300], [2280, 240]],
  // astronaut footprint trails: [x1,y1,x2,y2]
  prints: [
    [820, 1210, 1230, 880], [420, 520, 750, 430], [1830, 480, 1600, 860],
    [980, 1310, 1420, 1390],
  ],
});
