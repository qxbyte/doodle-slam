'use strict';

/* ============================================================
   Daily Run — everyone gets the same setup each day (map and
   fighter derived from the date), score is your turf coverage.
   Best score per day is kept locally.
   ============================================================ */

const Daily = {
  todayKey() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  },
  seed() { return Number(this.todayKey()); },
  mapIdx() { return this.seed() % MAPS.length; },
  team() { return (this.seed() >> 3) % 4; },

  best() {
    try {
      const v = localStorage.getItem('doodleSlam.daily.' + this.todayKey());
      return v === null ? null : Number(v);
    } catch { return null; }
  },

  /* returns true when this run sets a new daily best */
  submit(score) {
    const b = this.best();
    if (b !== null && score <= b) return false;
    try { localStorage.setItem('doodleSlam.daily.' + this.todayKey(), String(score)); } catch { }
    return true;
  },
};
