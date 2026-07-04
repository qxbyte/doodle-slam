'use strict';

/* THE OTHER TOWN — the hidden world behind the little door on the
   DOWNTOWN mall. Never listed on any select screen (hidden: true,
   stage: -1); you can only get here mid-match through the door.

   It is the city again — but wrong. Night-blue paper, a sleepy
   moon, roads that spiral into nothing, leaning towers, houses
   built upside-down, a billboard with one big eye, a melting
   clock tower, chunks of street floating in the air, and the
   plaza fountain pouring upward. Every obstacle kind is unique
   to this world (js/world/themes/othertown.js). */
registerMap({
  name: 'THE OTHER TOWN',
  desc: 'The town behind the door.',
  stage: -1,
  hidden: true,
  seed: 20261111,
  palette: 'night',
  ground: 'othercity',
  ambient: 'stars',
  mood: 'moon',
  // the fountain plaza sits exactly where DOWNTOWN's does — almost
  plaza: { x: 760, y: 900, r: 140 },
  plazaStyle: 'unfountain',
  buildings: [
    { x: 350,  y: 280,  w: 250, h: 300, kind: 'tiltoffice' },
    { x: 1900, y: 880,  w: 240, h: 320, kind: 'tiltoffice' },
    { x: 1100, y: 240,  w: 200, h: 190, kind: 'flippedhouse' },
    { x: 480,  y: 1140, w: 200, h: 190, kind: 'flippedhouse' },
    { x: 1650, y: 240,  w: 290, h: 210, kind: 'eyeboard' },
    { x: 1160, y: 720,  w: 190, h: 310, kind: 'meltclock' },
    { x: 1480, y: 1230, w: 330, h: 150, kind: 'floatstreet' },
    { x: 230,  y: 680,  w: 310, h: 140, kind: 'floatstreet' },
    { x: 2110, y: 470,  w: 100, h: 170, kind: 'bentlamp' },
    { x: 880,  y: 1380, w: 100, h: 170, kind: 'bentlamp' },
  ],
});
