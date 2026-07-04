'use strict';

/* GOO JUNCTION — stage 10. A cross of glowing goo channels under
   the town, grate bridges at each arm, and numbered warp pipes
   that teleport you across the map (mechanic in the game loop).
   The red button sits on a drain cover. */
registerMap({
  name: 'GOO JUNCTION',
  mood: 'sewer',
  desc: 'Grate bridges and warp pipes — mind the goo.',
  stage: 9,
  seed: 20261002,
  ground: 'sewer',
  ambient: 'fireflies',
  plaza: { x: 620, y: 380, r: 110 },
  plazaStyle: 'drain',
  buildings: [
    { x: 350,  y: 950,  w: 170, h: 150, kind: 'vat' },
    { x: 1550, y: 250,  w: 170, h: 150, kind: 'vat' },
    { x: 2000, y: 950,  w: 160, h: 140, kind: 'vat' },
    { x: 850,  y: 180,  w: 140, h: 110, kind: 'valve' },
    { x: 1450, y: 1300, w: 140, h: 110, kind: 'valve' },
    { x: 300,  y: 550,  w: 90,  h: 120, kind: 'pillar' },
    { x: 1950, y: 550,  w: 90,  h: 120, kind: 'pillar' },
    { x: 700,  y: 1300, w: 90,  h: 120, kind: 'pillar' },
    { x: 2200, y: 1300, w: 90,  h: 120, kind: 'pillar' },
    { x: 1750, y: 700,  w: 100, h: 80,  kind: 'rock' },
  ],
  // the goo cross — gaps under the grate bridges keep it crossable
  water: [
    { x: 300,  y: 720,  w: 300, h: 160 },
    { x: 710,  y: 720,  w: 410, h: 160 },
    { x: 1280, y: 720,  w: 490, h: 160 },
    { x: 1880, y: 720,  w: 220, h: 160 },
    { x: 1120, y: 200,  w: 160, h: 240 },
    { x: 1120, y: 550,  w: 160, h: 170 },
    { x: 1120, y: 880,  w: 160, h: 260 },
    { x: 1120, y: 1250, w: 160, h: 150 },
  ],
  bridges: [
    { x: 600,  y: 720,  w: 110, h: 160 },
    { x: 1770, y: 720,  w: 110, h: 160 },
    { x: 1120, y: 440,  w: 160, h: 110 },
    { x: 1120, y: 1140, w: 160, h: 110 },
  ],
  // numbered warp-pipe pairs
  pipes: [
    { ax: 240,  ay: 240,  bx: 2160, by: 1360 },
    { ax: 2160, ay: 240,  bx: 240,  by: 1360 },
    { ax: 660,  ay: 1050, bx: 1750, by: 480 },
  ],
  moss: [
    [420, 700], [1350, 950], [1900, 720], [800, 900],
    [1120, 180], [2100, 1150], [500, 1350],
  ],
  drips: [
    [600, 300], [1650, 600], [2250, 800], [950, 1200], [1400, 150], [300, 1100],
  ],
});
