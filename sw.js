'use strict';

/* ============================================================
   Service worker — app-shell caching so the game installs and
   plays offline. Bump VERSION whenever any shipped file changes
   (CI reminder lives in CLAUDE.md).
   ============================================================ */

const VERSION = 'doodle-slam-v21';

const SHELL = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png',
  './js/core/util.js', './js/core/i18n.js', './js/core/teams.js', './js/core/sketch.js',
  './js/maps/registry.js', './js/maps/downtown.js', './js/maps/riverside.js',
  './js/maps/pinecamp.js', './js/maps/fernhollow.js', './js/maps/sunnyshore.js',
  './js/maps/thedeep.js', './js/maps/powderpeaks.js', './js/maps/midnightfair.js',
  './js/maps/messydesk.js', './js/maps/craterfield.js',
  './js/maps/cinderbasin.js', './js/maps/goojunction.js', './js/maps/theothertown.js',
  './js/world/render.js', './js/world/collision.js',
  './js/world/themes/common.js', './js/world/themes/city.js',
  './js/world/themes/wilds.js', './js/world/themes/desk.js',
  './js/world/themes/moon.js', './js/world/themes/shore.js',
  './js/world/themes/peaks.js', './js/world/themes/fair.js',
  './js/world/themes/deep.js',
  './js/world/themes/volcano.js', './js/world/themes/sewer.js', './js/world/themes/othertown.js',
  './js/systems/audio.js', './js/systems/music.js', './js/systems/settings.js',
  './js/systems/paint.js',
  './js/systems/replay.js', './js/systems/records.js', './js/systems/modes.js',
  './js/systems/skills.js', './js/systems/challenges.js', './js/systems/achievements.js', './js/systems/daily.js',
  './js/systems/sharecard.js', './js/systems/ambient.js', './js/systems/touch.js',
  './js/systems/entities.js',
  './js/ui/hud.js', './js/ui/vignettes.js', './js/ui/screens.js',
  './js/game.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* cache-first for the shell; runtime-cache everything else (fonts) */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => hit);
    })
  );
});
