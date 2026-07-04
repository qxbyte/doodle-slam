'use strict';

/* ============================================================
   Touch controls — twin virtual sticks plus action buttons.
   Left half of the screen: movement stick (anchors where the
   thumb lands). Right half: aim stick — dragging aims, holding
   fires. BOMB / SKILL buttons sit above the right thumb.
   Only activates on touch-capable devices.
   ============================================================ */

const Touch = (() => {
  const active = 'ontouchstart' in window || navigator.maxTouchPoints > 0 ||
    new URLSearchParams(location.search).has('touch');   // debug force
  const state = { mx: 0, my: 0, aim: null, firing: false };

  let moveId = null, aimId = null;
  let moveBase = { x: 0, y: 0 };
  let aimBase = { x: 0, y: 0 };
  let els = null;

  function init() {
    if (!active) return;
    document.body.classList.add('touch');
    // hints assume a mouse otherwise
    $('#bomb-hint').innerHTML = L('PAINT BOMB &times;{s} &mdash; tap &#128163;', { s: '<span id="bomb-count">0</span>' });
    $('#skill-hint').innerHTML = L('{s1} &times;{s2} &mdash; tap Q', { s1: '<span id="skill-name">Skill</span>', s2: '<span id="skill-count">2</span>' });
    ui.bombCount = $('#bomb-count');   // the rewrite replaced the cached span
    els = {
      stick: $('#stick-base'),
      knob: $('#stick-knob'),
      bomb: $('#btn-bomb'),
      skill: $('#btn-skill'),
    };

    addEventListener('touchstart', onStart, { passive: false });
    addEventListener('touchmove', onMove, { passive: false });
    addEventListener('touchend', onEnd);
    addEventListener('touchcancel', onEnd);

    els.bomb.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      const p = game.player;
      if (game.state !== 'match' || game.browse || !p.alive) return;
      if (p.throwBomb(game, p.x + Math.cos(p.aim) * 300, p.y + Math.sin(p.aim) * 300)) {
        pushToast(`${p.name} threw a Paint Bomb!`);
      }
    });
    els.skill.addEventListener('touchstart', e => {
      e.preventDefault();
      e.stopPropagation();
      if (game.state === 'match' && !game.browse) Skills.cast(game, game.player);
    });
  }

  function inMatch() {
    return game.state === 'match' && !game.browse && !game.demo;
  }

  function onStart(e) {
    if (!inMatch()) return;
    for (const t of e.changedTouches) {
      if (t.target.closest('button')) continue;   // HUD buttons keep their taps
      e.preventDefault();
      if (t.clientX < innerWidth / 2 && moveId === null) {
        moveId = t.identifier;
        moveBase = { x: t.clientX, y: t.clientY };
        els.stick.style.left = `${t.clientX}px`;
        els.stick.style.top = `${t.clientY}px`;
        els.stick.classList.add('on');
        setKnob(0, 0);
      } else if (aimId === null) {
        aimId = t.identifier;
        aimBase = { x: t.clientX, y: t.clientY };
      }
    }
  }

  function onMove(e) {
    if (!inMatch()) return;
    for (const t of e.changedTouches) {
      if (t.identifier === moveId) {
        e.preventDefault();
        const dx = t.clientX - moveBase.x, dy = t.clientY - moveBase.y;
        const len = Math.hypot(dx, dy);
        const k = len > 44 ? 44 / len : 1;
        state.mx = (dx * k) / 44;
        state.my = (dy * k) / 44;
        setKnob(dx * k, dy * k);
      } else if (t.identifier === aimId) {
        e.preventDefault();
        const dx = t.clientX - aimBase.x, dy = t.clientY - aimBase.y;
        if (Math.hypot(dx, dy) > 14) {
          state.aim = Math.atan2(dy, dx);
          state.firing = true;
        }
      }
    }
  }

  function onEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === moveId) {
        moveId = null;
        state.mx = state.my = 0;
        els.stick.classList.remove('on');
      } else if (t.identifier === aimId) {
        aimId = null;
        state.firing = false;
        state.aim = null;
      }
    }
  }

  function setKnob(dx, dy) {
    els.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }

  return { active, state, init };
})();
