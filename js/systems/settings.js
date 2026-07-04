'use strict';

/* ============================================================
   Settings — user preferences persisted in localStorage and
   applied to the audio/juice/ambience systems. The panel UI
   lives on the title screen (wired in game.js).
   ============================================================ */

const Settings = (() => {
  const KEY = 'doodleSlam.settings';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  }

  const data = Object.assign(
    { music: true, sfx: true, shake: true, ambient: true },
    load()
  );

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* private mode */ }
  }

  function apply() {
    SFX.setMuted(!data.sfx);
    Music.setMuted(!data.music);
    if (typeof CURRENT_MAP !== 'undefined' && CURRENT_MAP) {
      Ambient.set(data.ambient ? CURRENT_MAP.ambient : null);
    }
  }

  function set(key, value) {
    data[key] = value;
    save();
    apply();
  }

  return { data, set, apply };
})();
