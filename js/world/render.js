'use strict';

/* ============================================================
   World renderer core — a small plugin engine.
   Themes (js/world/themes/*.js) register ground surfaces, road
   styles, scenery features, plaza styles and obstacle renderers;
   buildWorldLayers only orchestrates.

   To add a theme: create a theme file, call the register*
   functions, add a <script> tag in index.html — nothing else.
   ============================================================ */

let groundLayer, topLayer;

const RENDER = {
  grounds: {},      // map.ground     -> fn(g, rng, map)
  roadStyles: {},   // map.roadStyle  -> fn(g, rng, map)
  features: [],     // [{order, fn(g, rng, map)}], low order drawn first
  topFeatures: [],  // like features, but on the top layer, above the paint
  plazas: {},       // map.plazaStyle -> fn(g, rng, map, p)
  obstacles: {},    // building.kind  -> fn(t, rng, b)
};

function registerGround(name, fn) { RENDER.grounds[name] = fn; }
function registerRoadStyle(name, fn) { RENDER.roadStyles[name] = fn; }
function registerFeature(order, fn) {
  RENDER.features.push({ order, fn });
  RENDER.features.sort((a, b) => a.order - b.order);
}
/* for map elements the player must always find (warp pipes…):
   drawn above the paint so splats can never bury them */
function registerTopFeature(order, fn) {
  RENDER.topFeatures.push({ order, fn });
  RENDER.topFeatures.sort((a, b) => a.order - b.order);
}
function registerPlaza(name, fn) { RENDER.plazas[name] = fn; }
function registerObstacles(byKind) { Object.assign(RENDER.obstacles, byKind); }

function buildWorldLayers(map) {
  const rng = makeRng(map.seed);

  /* ---- ground layer: surface, scenery, plaza, vignette ---- */
  groundLayer = document.createElement('canvas');
  groundLayer.width = WORLD.w; groundLayer.height = WORLD.h;
  const g = groundLayer.getContext('2d');
  g.lineJoin = 'round';
  g.lineCap = 'round';

  (RENDER.grounds[map.ground] || RENDER.grounds.paper)(g, rng, map);
  for (const f of RENDER.features) f.fn(g, rng, map);
  drawPlaza(g, rng, map);
  drawVignette(g);

  /* ---- top layer: obstacles stay clean above the paint ---- */
  topLayer = document.createElement('canvas');
  topLayer.width = WORLD.w; topLayer.height = WORLD.h;
  const t = topLayer.getContext('2d');
  t.lineJoin = 'round';
  t.lineCap = 'round';

  for (const b of map.buildings) {
    (RENDER.obstacles[b.kind] || drawUnknownObstacle)(t, rng, b);
  }
  for (const f of RENDER.topFeatures) f.fn(t, rng, map);
  if (map.egg) drawEggDoor(t, rng, map.egg);
}

/* the unmarked little door to the hidden world — deliberately quiet:
   just a door on a wall, drawn above the trigger zone. */
function drawEggDoor(t, rng, egg) {
  const x = egg.x + 4, w = egg.w - 8, h = 30;
  const y = egg.y - h;   // the zone sits just outside the wall
  t.fillStyle = '#3a4666';
  t.strokeStyle = INK;
  t.lineWidth = 1.8;
  t.beginPath();
  t.moveTo(x, y + h);
  t.lineTo(x, y + 9);
  t.quadraticCurveTo(x + w / 2, y - 6, x + w, y + 9);
  t.lineTo(x + w, y + h);
  t.closePath();
  t.fill(); t.stroke();
  // panel line + knob
  t.lineWidth = 1;
  t.strokeStyle = 'rgba(220,232,242,0.5)';
  t.beginPath();
  t.moveTo(x + w / 2, y + 6); t.lineTo(x + w / 2, y + h - 3);
  t.stroke();
  t.fillStyle = '#dce8f2';
  t.beginPath(); t.arc(x + w * 0.72, y + h * 0.58, 1.8, 0, Math.PI * 2); t.fill();
  // the faintest keyhole glow — you'd have to be looking
  t.fillStyle = 'rgba(140,190,240,0.35)';
  t.beginPath(); t.arc(x + w / 2, y + h * 0.45, 2.6, 0, Math.PI * 2); t.fill();
}

/* roads are a fixed feature slot; the look comes from the map */
registerFeature(22, (g, rng, map) => {
  if (!map.roads.length) return;
  (RENDER.roadStyles[map.roadStyle] || RENDER.roadStyles.asphalt)(g, rng, map);
});

/* dashed guide rings around the red-button plaza + themed centre */
function drawPlaza(g, rng, map) {

  const p = map.plaza;
  g.strokeStyle = INK_LIGHT;
  g.lineWidth = 1.4;
  for (const rr of [p.r, p.r * 0.72]) {
    g.setLineDash(rr === p.r ? [10, 12] : []);
    wobblyCircle(g, rng, p.x, p.y, rr, 0.02);
    g.stroke();
    g.setLineDash([]);
  }

  const style = RENDER.plazas[map.plazaStyle];
  if (style) style(g, rng, map, p);
}

function drawVignette(g) {
  const grad = g.createRadialGradient(
    WORLD.w / 2, WORLD.h / 2, Math.min(WORLD.w, WORLD.h) * 0.45,
    WORLD.w / 2, WORLD.h / 2, Math.max(WORLD.w, WORLD.h) * 0.72
  );
  grad.addColorStop(0, 'rgba(70,60,50,0)');
  grad.addColorStop(1, 'rgba(70,60,50,0.10)');
  g.fillStyle = grad;
  g.fillRect(0, 0, WORLD.w, WORLD.h);
}

function wildsShadow(t, x, y, w, h) {
  t.fillStyle = 'rgba(90,90,86,0.12)';
  t.beginPath();
  t.ellipse(x + w / 2 + 5, y + h - 4, w * 0.5, h * 0.16, 0, 0, Math.PI * 2);
  t.fill();
}

/* fallback so an unregistered kind is visible, not invisible */
function drawUnknownObstacle(t, rng, b) {
  wildsShadow(t, b.x, b.y, b.w, b.h);
  t.fillStyle = PAPER;
  t.strokeStyle = INK;
  t.lineWidth = 2;
  t.fillRect(b.x, b.y, b.w, b.h);
  wobblyRect(t, rng, b.x, b.y, b.w, b.h, 1.5);
  t.stroke();
  hatchRect(t, rng, b.x, b.y, b.w, b.h, 8);
}
