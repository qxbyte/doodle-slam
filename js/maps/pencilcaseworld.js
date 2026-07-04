'use strict';

/* INSIDE THE PENCIL CASE — the hidden world behind the unzipped
   gap on MESSY DESK's pencil case. Never listed anywhere
   (hidden: true, stage: -1); you can only squeeze in mid-match.

   NOT the desk again: in here you are ant-sized inside the case
   itself. Quilted fabric lining, padded slot dividers, and only
   things that live in a pencil case — a bundle of crayons, a
   glue stick, a fat marker with its cap off, a correction-tape
   mouse. Sticker decals dot the lining. The red button rests on
   a leaked ink blot. */
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
    // pencil-case natives, huge at this scale
    { x: 420,  y: 170,  w: 660, h: 90,  kind: 'crayons' },
    { x: 1400, y: 240,  w: 560, h: 80,  kind: 'marker' },
    { x: 300,  y: 690,  w: 190, h: 150, kind: 'gluestick' },
    { x: 1860, y: 610,  w: 220, h: 130, kind: 'correction' },
    { x: 700,  y: 1240, w: 200, h: 140, kind: 'gluestick' },
    { x: 2020, y: 1300, w: 240, h: 130, kind: 'correction' },
    { x: 150,  y: 1180, w: 520, h: 80,  kind: 'crayons' },
    { x: 820,  y: 940,  w: 300, h: 70,  kind: 'crayons' },
  ],
});
