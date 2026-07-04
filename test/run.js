'use strict';

/* ============================================================
   Test runner — loads the game's classic scripts into a vm
   context with minimal browser stubs, then runs test/spec.js
   inside the same context so it can reach top-level `let`
   bindings (grid, OBSTACLES, ...).

   Usage: node test/run.js
   ============================================================ */

const vm = require('vm');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

/* ---- browser stubs ---- */
function ctx2d() {
  // canvas 2d stub: every method is a no-op, every property writable
  return new Proxy({ canvas: {} }, {
    get(t, k) {
      if (k in t) return t[k];
      return () => undefined;
    },
    set(t, k, v) { t[k] = v; return true; },
  });
}

const storage = (() => {
  let s = {};
  return {
    getItem: k => (k in s ? s[k] : null),
    setItem: (k, v) => { s[k] = String(v); },
    removeItem: k => { delete s[k]; },
    clear: () => { s = {}; },
  };
})();

const results = { pass: 0, fail: 0, failures: [] };

const sandbox = {
  console,
  Math, JSON, Date, Number, String, Array, Object, Promise, Set, Map,
  Int8Array, Float32Array, URL,
  performance: { now: () => Date.now() },
  innerWidth: 1280,
  innerHeight: 720,
  devicePixelRatio: 1,
  localStorage: storage,
  navigator: { maxTouchPoints: 0 },
  document: {
    createElement: () => ({ getContext: ctx2d, width: 0, height: 0, style: {} }),
    fonts: { ready: Promise.resolve() },
    addEventListener: () => {},
    querySelector: () => null,
  },
  addEventListener: () => {},
  matchMedia: () => ({ matches: false }),
  requestAnimationFrame: () => 0,
  setTimeout, clearTimeout, setInterval, clearInterval,
  // game-side stubs used by entities at runtime
  SFX: { play: () => {}, toggleMute: () => false, setMuted: () => {}, muted: false },
  Music: { start: () => {}, setMuted: () => {} },
  Ambient: { set: () => {}, update: () => {}, draw: () => {} },
  flashHurt: () => {},
  addFx: () => {},
  addShake: () => {},
  slamMul: () => 1,
  pushToast: () => {},
  Skills: { cast: () => {} },
  game: { demo: false, stats: [] },
  // reporting hooks for the spec
  __pass: name => { results.pass++; },
  __fail: (name, err) => { results.fail++; results.failures.push({ name, err: String(err) }); },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

/* files under test — pure logic only, no ui/game loop */
const FILES = [
  'js/core/util.js',
  'js/core/i18n.js',
  'js/core/teams.js',
  'js/core/sketch.js',
  'js/maps/registry.js',
  'js/maps/downtown.js', 'js/maps/riverside.js', 'js/maps/pinecamp.js',
  'js/maps/fernhollow.js', 'js/maps/sunnyshore.js', 'js/maps/thedeep.js',
  'js/maps/powderpeaks.js', 'js/maps/midnightfair.js', 'js/maps/messydesk.js',
  'js/maps/craterfield.js',
  'js/world/collision.js',
  'js/systems/paint.js',
  'js/systems/modes.js',
  'js/systems/skills.js',
  'js/systems/challenges.js',
  'js/systems/daily.js',
  'js/systems/settings.js',
  'js/systems/records.js',
  'js/systems/entities.js',
];

for (const f of FILES) {
  const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
  vm.runInContext(code, sandbox, { filename: f });
}

const spec = fs.readFileSync(path.join(__dirname, 'spec.js'), 'utf8');
vm.runInContext(spec, sandbox, { filename: 'test/spec.js' });

/* ---- report ---- */
for (const f of results.failures) {
  console.error(`✗ ${f.name}\n    ${f.err}`);
}
console.log(`\n${results.pass} passed, ${results.fail} failed`);
process.exit(results.fail ? 1 : 0);
