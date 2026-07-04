'use strict';

/* ============================================================
   Campaign — three star challenges per map (earned in TURF WAR
   vs bots; daily runs and other modes don't count). Stars gate
   the next stage on the journey line: one star anywhere in a
   stage unlocks the stage after it.
   Progress lives in localStorage.
   ============================================================ */

const CHALLENGE_TYPES = {
  win:      { desc: () => L('Win the match'),                       check: (r) => r.rank === 0 },
  coverage: { desc: v => L('Cover {v}% of the ground', { v }),      check: (r, v) => r.cov >= v },
  splats:   { desc: v => L('Splat {v} rivals', { v }),              check: (r, v) => r.splats >= v },
  nodeath:  { desc: () => L('Finish without getting splatted'),     check: (r) => r.downs === 0 },
  buttons:  { desc: v => L('Hit the red button {v}×', { v }),  check: (r, v) => r.buttons >= v },
};

/* [type, target] x3 per map, keyed by map name */
const CAMPAIGN_DEFS = {
  'DOWNTOWN':      [['win'], ['coverage', 26], ['splats', 4]],
  'RIVERSIDE':     [['win'], ['coverage', 24], ['buttons', 2]],
  'PINE CAMP':     [['win'], ['coverage', 26], ['nodeath']],
  'FERN HOLLOW':   [['win'], ['coverage', 24], ['splats', 5]],
  'SUNNY SHORE':   [['win'], ['coverage', 26], ['buttons', 2]],
  'THE DEEP':      [['win'], ['coverage', 24], ['nodeath']],
  'POWDER PEAKS':  [['win'], ['coverage', 24], ['splats', 5]],
  'MIDNIGHT FAIR': [['win'], ['coverage', 26], ['buttons', 2]],
  'MESSY DESK':    [['win'], ['coverage', 26], ['splats', 5]],
  'CRATER FIELD':  [['win'], ['coverage', 24], ['nodeath']],
  'CINDER BASIN':  [['win'], ['coverage', 22], ['nodeath']],
  'GOO JUNCTION':  [['win'], ['coverage', 24], ['splats', 5]],
};

const Campaign = {
  KEY: 'doodleSlam.campaign',

  load() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || {}; }
    catch { return {}; }
  },
  save(p) {
    try { localStorage.setItem(this.KEY, JSON.stringify(p)); } catch { /* private mode */ }
  },

  stars(mapName) {
    const p = this.load();
    return p[mapName] || [false, false, false];
  },

  descs(mapName) {
    return (CAMPAIGN_DEFS[mapName] || []).map(([type, v]) => CHALLENGE_TYPES[type].desc(v));
  },

  stageStars(stageIdx) {
    let got = 0, total = 0;
    for (const m of MAPS) {
      if (m.stage !== stageIdx) continue;
      total += 3;
      got += this.stars(m.name).filter(Boolean).length;
    }
    return { got, total };
  },

  unlockAll() {
    try { return localStorage.getItem('doodleSlam.unlockAll') === '1'; }
    catch { return false; }
  },
  setUnlockAll(on) {
    try {
      if (on) localStorage.setItem('doodleSlam.unlockAll', '1');
      else localStorage.removeItem('doodleSlam.unlockAll');
    } catch { }
  },

  stageUnlocked(stageIdx) {
    if (this.unlockAll()) return true;
    if (stageIdx === 0) return true;
    return this.stageStars(stageIdx - 1).got > 0;
  },

  /* called at the end of a real turf match; returns the descriptions
     of any newly earned stars */
  evaluate(game) {
    if (game.demo || game.daily || game.mode !== 'turf') return [];
    const map = CURRENT_MAP.name;
    const defs = CAMPAIGN_DEFS[map];
    if (!defs) return [];
    const cov = game.lastCoverage;
    const order = [0, 1, 2, 3].sort((a, b) => cov[b] - cov[a]);
    const s = game.stats[game.player.team];
    const result = {
      rank: order.indexOf(game.player.team),
      cov: cov[game.player.team] * 100,
      splats: s.splats,
      downs: s.downs,
      buttons: s.buttons,
    };
    const progress = this.load();
    const stars = progress[map] || [false, false, false];
    const fresh = [];
    defs.forEach(([type, v], i) => {
      if (!stars[i] && CHALLENGE_TYPES[type].check(result, v)) {
        stars[i] = true;
        fresh.push(CHALLENGE_TYPES[type].desc(v));
      }
    });
    if (fresh.length) {
      progress[map] = stars;
      this.save(progress);
    }
    return fresh;
  },
};
