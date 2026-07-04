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
  { id: 'doubleThreat', icon: 'loop',     name: 'Double Threat',
    desc: 'Win with 30% coverage and 5 splats in one match.',
    check: c => c.match.won && c.match.cov >= 30 && c.match.splats >= 5 },
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
  /* secret badges — greyed out like any locked badge until earned */
  { id: 'doorFinder',   icon: 'door',     name: 'Through the Little Door',
    desc: 'Find the door to another town.', secret: true,
    check: c => c.match.egg === 'THE OTHER TOWN' },
  { id: 'otherSide',    icon: 'compass',  name: 'King of the Other Side',
    desc: 'Win a match that ends in the other town.', secret: true,
    check: c => c.match.eggEnd === 'THE OTHER TOWN' && c.match.won },
  { id: 'caseStowaway', icon: 'case',     name: 'Pencil Case Stowaway',
    desc: 'Squeeze in through the zipper.', secret: true,
    check: c => c.match.egg === 'INSIDE THE PENCIL CASE' },
  { id: 'caseKing',     icon: 'case',     name: 'Keeper of the Case',
    desc: 'Win a match that ends inside the pencil case.', secret: true,
    check: c => c.match.eggEnd === 'INSIDE THE PENCIL CASE' && c.match.won },
];

const Achieve = (() => {
  const KEY = 'doodleSlam.achievements';

  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY)) || {};
      d.unlocked = d.unlocked || {};
      d.counters = Object.assign({ splats: 0, dailyPlays: 0 }, d.counters);
      return d;
    } catch {
      return { unlocked: {}, counters: { splats: 0, dailyPlays: 0 } };
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
    /* match = { won, cov, splats, downs, buttons, daily, egg… } —
       updates counters, then returns freshly unlocked defs */
    evaluate(match) {
      const d = load();
      d.counters.splats += match.splats;
      if (match.daily) d.counters.dailyPlays++;
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
