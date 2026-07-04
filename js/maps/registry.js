'use strict';

/* ============================================================
   Map registry + active-map state.

   Every map is a plain data object registered from its own file
   (js/maps/<name>.js) via registerMap(). To add a map: create a
   new file there, call registerMap({...}), and add a <script>
   tag for it in index.html — nothing else to touch.

   Map schema:
     name, desc     — shown on the map-select card
     stage          — index into STAGES (0 city, 1 wilds)
     seed           — fixed RNG seed for the sketch art
     plaza {x,y,r}  — where the red button appears
     plazaStyle     — 'fountain' | 'pond' | 'campfire' | 'stones'
     buildings[]    — {x,y,w,h,kind}; solid + unpaintable, drawn clean
                      city kinds:  office | mall | heli | house
                                   | billboard | station | stadium
                      wilds kinds: cabin | tower | tent | rock
                                   | bigtree | mushroom
     water[]        — rects; solid + unpaintable, drawn as river/lake
     bridges[]      — rects drawn as plank decks (gaps in the water)
     rails[]        — {y} horizontal railway doodles
     courts[]       — rects drawn as basketball courts (paintable)
     roads[]        — {x1,y1,x2,y2,w} straight roads/paths
     roadStyle      — 'asphalt' (default) | 'dirt'
     crosswalks[]   — {x,y} stripe clusters
     trees[]        — [x,y] round scribble canopies
     pines[]        — [x,y] triangle pine doodles
     flowers[]      — [x,y] little flower clusters
     logs[]         — [x,y,angle] fallen log doodles
     grass          — number of scattered grass tufts
     cars[]         — [x,y,vertical] parked car doodles
     kiosks[]       — [x,y] hexagon kiosks
   ============================================================ */

const WORLD = { w: 2400, h: 1600 };

/* Stages group the maps; the stage-select screen is a journey line
   with one stop per stage. vignette: key into drawStageVignette(). */
const STAGES = [
  { id: 0, name: 'THE CITY',  label: 'STAGE 1', vignette: 'city',
    desc: 'Streets, malls and rooftop billboards.' },
  { id: 1, name: 'THE WILDS', label: 'STAGE 2', vignette: 'forest',
    desc: 'Pines, campfires and creek crossings.' },
  { id: 2, name: 'THE SHORE', label: 'STAGE 3', vignette: 'shore',
    desc: 'Sun, piers and a striped lighthouse.' },
  { id: 3, name: 'THE DEEP',  label: 'STAGE 4', vignette: 'deep',
    desc: 'Wrecks, corals and sweeping currents.' },
  { id: 4, name: 'THE PEAKS', label: 'STAGE 5', vignette: 'peaks',
    desc: 'Ski lifts, snowmen and slippery ice.' },
  { id: 5, name: 'THE FAIR',  label: 'STAGE 6', vignette: 'fair',
    desc: 'A funfair chalked on the midnight blackboard.' },
  { id: 6, name: 'THE DESK',  label: 'STAGE 7', vignette: 'desk',
    desc: 'Zoom out — battle the stationery on the desktop.' },
  { id: 7, name: 'THE MOON',  label: 'STAGE 8', vignette: 'moon',
    desc: 'Craters, flags and one crashed saucer.' },
];

/* Team spawn corners: blue, red, yellow, green.
   A map whose corners are unusable (e.g. covered by sea) can
   override them with its own `spawns` array. */
const DEFAULT_SPAWNS = [
  { x: 90, y: 90 },
  { x: WORLD.w - 90, y: 90 },
  { x: 90, y: WORLD.h - 90 },
  { x: WORLD.w - 90, y: WORLD.h - 90 },
];
let SPAWNS = DEFAULT_SPAWNS;

const MAPS = [];

function registerMap(def) {
  MAPS.push(Object.assign({
    stage: 0,
    palette: 'default',         // default | chalk | deep — see core/sketch.js
    ground: 'paper',            // paper | desk | moon | sand | snow | chalk | seabed
    roads: [], water: [], bridges: [], rails: [], courts: [],
    crosswalks: [], trees: [], cars: [], kiosks: [],
    pines: [], flowers: [], logs: [], grass: 0,
    papers: [], rings: [], clips: [], shavings: [],   // desk scenery
    craters: [], flags: [], prints: [],               // moon scenery
    shells: [], starfish: [], gulls: [],              // shore scenery
    ice: [], drifts: [], snowpines: [], tracks: [], cables: [],  // peaks scenery
    bunting: [], chalkstars: [],                      // fair scenery
    currents: [], kelp: [], fishes: [], jellies: [],  // deep scenery
    plazaStyle: 'fountain', roadStyle: 'asphalt',
    ambient: null,        // snow | bubbles | fireflies | leaves | dust | stars
    mood: 'default',      // Music.MOODS key — per-stage BGM feel
  }, def));
}

/* ---- active map state (set by setMap, read everywhere) ---- */
let CURRENT_MAP = null;
let BUILDINGS = [];   // drawn on the top layer, stay clean
let WATER = [];       // drawn on the ground layer as river/sea
let OBSTACLES = [];   // buildings + water: block movement & paint
let ICE = [];         // walkable but slippery, still paintable
let CURRENTS = [];    // walkable lanes that push fighters along
let PLAZA = null;

function setMap(idx) {
  CURRENT_MAP = MAPS[clamp(idx, 0, MAPS.length - 1)];
  BUILDINGS = CURRENT_MAP.buildings;
  WATER = CURRENT_MAP.water;
  OBSTACLES = BUILDINGS.concat(WATER);
  ICE = CURRENT_MAP.ice;
  CURRENTS = CURRENT_MAP.currents;
  PLAZA = CURRENT_MAP.plaza;
  SPAWNS = CURRENT_MAP.spawns || DEFAULT_SPAWNS;
  setPalette(CURRENT_MAP.palette);
  buildWorldLayers(CURRENT_MAP);
}
