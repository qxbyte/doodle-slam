'use strict';

/* INSIDE THE PENCIL CASE — the hidden world behind the unzipped
   gap on MESSY DESK's pencil case. Never listed anywhere
   (hidden: true, stage: -1); you can only squeeze in mid-match.

   Shrunk down among your own supplies: a quilted fabric lining,
   long slot dividers, and stationery the size of buildings —
   pencils, erasers, a sharpener, a notepad. The red button rests
   on a spilled ink blot, just like home. */
registerMap({
  name: 'INSIDE THE PENCIL CASE',
  desc: 'The world inside the zipper.',
  stage: -1,
  hidden: true,
  seed: 20261212,
  palette: 'night',
  ground: 'caselining',
  ambient: 'dust',
  mood: 'deep',
  plaza: { x: 1200, y: 820, r: 130 },
  plazaStyle: 'ink',
  buildings: [
    // slot dividers: the long padded ridges that split the case
    { x: 340,  y: 430,  w: 900, h: 60,  kind: 'divider' },
    { x: 1160, y: 1080, w: 900, h: 60,  kind: 'divider' },
    // giant stationery, snug in their slots
    { x: 420,  y: 180,  w: 640, h: 58,  kind: 'pencil' },
    { x: 1350, y: 250,  w: 620, h: 56,  kind: 'pencil' },
    { x: 300,  y: 700,  w: 230, h: 130, kind: 'eraser' },
    { x: 1850, y: 620,  w: 200, h: 115, kind: 'eraser' },
    { x: 700,  y: 1250, w: 150, h: 120, kind: 'sharpener' },
    { x: 2050, y: 1330, w: 170, h: 170, kind: 'notepad' },
    { x: 180,  y: 1150, w: 170, h: 170, kind: 'mug' },
    { x: 900,  y: 800,  w: 280, h: 105, kind: 'stapler' },
  ],
});
