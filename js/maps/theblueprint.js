'use strict';

/* THE BLUEPRINT — the hidden world behind the little door on the
   DOWNTOWN mall. Never listed on any select screen (hidden: true,
   stage: -1); you can only get here mid-match through the door.

   The concept: the city's own drawing. An unbuilt town on deep
   blue drafting paper — wireframe "ghost" buildings that were
   never constructed, a giant drafting compass, a set square,
   rolled-up sheets and pushpins. All obstacle kinds are unique
   to this world (js/world/themes/blueprint.js). */
registerMap({
  name: 'THE BLUEPRINT',
  desc: 'The world behind the door.',
  stage: -1,
  hidden: true,
  seed: 20261111,
  palette: 'blueprint',
  ground: 'blueprint',
  ambient: 'stars',
  mood: 'moon',
  plaza: { x: 1560, y: 520, r: 120 },
  plazaStyle: 'rose',
  buildings: [
    { x: 950,  y: 280,  w: 420, h: 280, kind: 'ghost' },     // the unbuilt tower
    { x: 280,  y: 1130, w: 300, h: 220, kind: 'ghost' },
    { x: 1850, y: 1080, w: 340, h: 240, kind: 'ghost' },
    { x: 1750, y: 300,  w: 260, h: 280, kind: 'compassTool' },
    { x: 350,  y: 420,  w: 300, h: 230, kind: 'setsquare' },
    { x: 600,  y: 830,  w: 300, h: 100, kind: 'roll' },
    { x: 1250, y: 910,  w: 330, h: 110, kind: 'roll' },
    { x: 180,  y: 250,  w: 90,  h: 90,  kind: 'pin' },
    { x: 2150, y: 700,  w: 90,  h: 90,  kind: 'pin' },
    { x: 1080, y: 1350, w: 90,  h: 90,  kind: 'pin' },
  ],
});
