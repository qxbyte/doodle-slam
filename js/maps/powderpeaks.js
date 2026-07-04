'use strict';

/* POWDER PEAKS — stage 4. A ski resort in the snow: two frozen
   lakes you slide across, a cable-car line climbing the slope,
   the lodge, and a campfire circle for the red button. */
registerMap({
  name: 'POWDER PEAKS',
  mood: 'peaks',
  desc: 'Ski lifts, a lodge and two lakes of slippery ice.',
  stage: 4,
  seed: 20260710,
  ground: 'snow',
  ambient: 'snow',
  plaza: { x: 1150, y: 1250, r: 140 },
  plazaStyle: 'campfire',
  buildings: [
    { x: 950,  y: 230,  w: 340, h: 230, kind: 'lodge' },
    { x: 380,  y: 780,  w: 90,  h: 140, kind: 'pylon' },
    { x: 1150, y: 560,  w: 90,  h: 140, kind: 'pylon' },
    { x: 1950, y: 340,  w: 90,  h: 140, kind: 'pylon' },
    { x: 700,  y: 1150, w: 120, h: 130, kind: 'snowman' },
    { x: 2120, y: 1280, w: 200, h: 150, kind: 'cabin' },
    { x: 1650, y: 160,  w: 110, h: 85,  kind: 'rock' },
    { x: 200,  y: 1300, w: 100, h: 80,  kind: 'rock' },
    { x: 2250, y: 880,  w: 100, h: 75,  kind: 'rock' },
    { x: 550,  y: 320,  w: 100, h: 80,  kind: 'rock' },
  ],
  // frozen lakes: slippery (see entities), paintable, not solid
  ice: [
    { x: 1480, y: 880, w: 620, h: 440 },
    { x: 260,  y: 360, w: 330, h: 250 },
  ],
  // cable-car spans strung between the pylon tops
  cables: [
    [425, 800, 1195, 580],
    [1195, 580, 1995, 360],
  ],
  tracks: [
    [300, 1450, 900, 1100], [1300, 1500, 1800, 1230],
    [500, 700, 320, 1000], [2050, 700, 1750, 850],
  ],
  drifts: [
    [400, 600], [900, 900], [1500, 700], [2050, 550],
    [650, 1400], [1750, 1450], [300, 1150], [2300, 1150],
  ],
  snowpines: [
    [130, 130], [350, 90], [700, 120], [1450, 100], [1850, 90], [2300, 140],
    [120, 550], [140, 900], [820, 620], [900, 1080],
    [1350, 900], [1400, 1150], [2200, 700], [2350, 1000],
    [400, 1480], [950, 1460], [1550, 1440], [1950, 1480], [2330, 1440],
    [1700, 480], [750, 380],
  ],
  roads: [],
});
