'use strict';

/* ============================================================
   Local career records, kept in localStorage:
   matches played, wins, best personal turf coverage.
   ============================================================ */

const Records = (() => {
  const KEY = 'doodleSlam.records';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  }

  function save(r) {
    try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* private mode etc. */ }
  }

  return {
    get() {
      const r = load();
      return { plays: r.plays || 0, wins: r.wins || 0, best: r.best || 0 };
    },
    /* returns true when coverage sets a new personal best */
    addMatch({ won, coverage }) {
      const r = this.get();
      r.plays++;
      if (won) r.wins++;
      const newBest = coverage > r.best;
      if (newBest) r.best = coverage;
      save(r);
      return newBest;
    },
  };
})();
