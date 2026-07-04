'use strict';

/* ============================================================
   Achievements — career-wide badges, evaluated at the end of
   every real match (daily runs count too; attract mode never).
   Unlocks + counters persist in localStorage. The title screen
   shows them as a doodle badge wall (see ui/screens.js).
   ============================================================ */

const ACHIEVEMENTS = [
  { id: 'firstSplat',   icon: 'splat',    name: 'First Splat!',
    desc: 'Splat your first rival.',
    check: c => c.counters.splats >= 1 },
  { id: 'hatTrick',     icon: 'bolt',     name: 'Hat Trick',
    desc: 'Splat 3 rivals in a single match.',
    check: c => c.match.splats >= 3 },
  { id: 'rampage',      icon: 'crown',    name: 'Rampage',
    desc: 'Splat 8 rivals in a single match.',
    check: c => c.match.splats >= 8 },
  { id: 'landlord',     icon: 'flag',     name: 'Landlord',
    desc: 'Cover 40% of the ground yourself.',
    check: c => c.match.cov >= 40 },
  { id: 'untouchable',  icon: 'shield',   name: 'Untouchable',
    desc: 'Win a match without getting splatted.',
    check: c => c.match.won && c.match.downs === 0 },
  { id: 'buttonMasher', icon: 'button',   name: 'Button Masher',
    desc: 'Hit the red button 3 times in one match.',
    check: c => c.match.buttons >= 3 },
  { id: 'modeHopper',   icon: 'loop',     name: 'Mode Hopper',
    desc: 'Win in all three match modes.',
    check: c => c.counters.modeWins.turf > 0 && c.counters.modeWins.splat > 0 && c.counters.modeWins.zones > 0 },
  { id: 'risingStar',   icon: 'star',     name: 'Rising Star',
    desc: 'Earn 5 campaign stars.',
    check: c => c.starsTotal >= 5 },
  { id: 'constellation', icon: 'stars',   name: 'Constellation',
    desc: 'Earn 15 campaign stars.',
    check: c => c.starsTotal >= 15 },
  { id: 'dailyRegular', icon: 'calendar', name: 'Daily Regular',
    desc: 'Play 3 daily runs.',
    check: c => c.counters.dailyPlays >= 3 },
  { id: 'veteran',      icon: 'pencil',   name: 'Veteran Doodler',
    desc: 'Play 25 matches.',
    check: c => c.records.plays >= 25 },
  { id: 'champion',     icon: 'trophy',   name: 'Champion',
    desc: 'Win 10 matches.',
    check: c => c.records.wins >= 10 },
  /* secret badges — shown as ??? on the wall until unlocked */
  { id: 'doorFinder',   icon: 'door',     name: 'Through the Little Door',
    desc: 'Find the way into another world.', secret: true,
    check: c => c.match.egg },
  { id: 'otherSide',    icon: 'compass',  name: 'King of the Other Side',
    desc: 'Win a match that ends in the hidden world.', secret: true,
    check: c => c.match.eggEnd && c.match.won },
];

const Achieve = (() => {
  const KEY = 'doodleSlam.achievements';

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY)) || {};
      d.unlocked = d.unlocked || {};
      d.counters = Object.assign({ splats: 0, dailyPlays: 0, modeWins: { turf: 0, splat: 0, zones: 0 } }, d.counters);
      return d;
    } catch {
      return { unlocked: {}, counters: { splats: 0, dailyPlays: 0, modeWins: { turf: 0, splat: 0, zones: 0 } } };
    }
  }

  function save(d) {
    try { localStorage.setItem(KEY, JSON.stringify(d)); } catch { /* private mode */ }
  }

  function starsTotal() {
    const p = Campaign.load();
    let n = 0;
    for (const k in p) n += p[k].filter(Boolean).length;
    return n;
  }

  return {
    /* match = { won, cov, splats, downs, buttons, mode, daily } —
       updates counters, then returns freshly unlocked defs */
    evaluate(match) {
      const d = load();
      d.counters.splats += match.splats;
      if (match.daily) d.counters.dailyPlays++;
      if (match.won && d.counters.modeWins[match.mode] !== undefined) {
        d.counters.modeWins[match.mode]++;
      }
      const ctx = {
        match,
        counters: d.counters,
        records: Records.get(),
        starsTotal: starsTotal(),
      };
      const fresh = [];
      for (const a of ACHIEVEMENTS) {
        if (!d.unlocked[a.id] && a.check(ctx)) {
          d.unlocked[a.id] = Date.now();
          fresh.push(a);
        }
      }
      save(d);
      return fresh;
    },

    /* for the badge wall */
    all() {
      const d = load();
      return ACHIEVEMENTS.map(a => ({ ...a, unlocked: !!d.unlocked[a.id] }));
    },

    count() {
      const d = load();
      return {
        got: ACHIEVEMENTS.filter(a => d.unlocked[a.id]).length,
        total: ACHIEVEMENTS.length,
      };
    },
  };
})();
