'use strict';

/* ============================================================
   Sound — everything is synthesized with WebAudio, no files.
   The context unlocks on the first user gesture; M toggles mute.
   Usage: SFX.play('shoot') etc.
   ============================================================ */

const SFX = (() => {
  let ac = null, master = null, muted = false;

  function ensure() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.32;
      master.connect(ac.destination);
    }
    if (ac.state === 'suspended') ac.resume();
    return true;
  }

  /* one oscillator with a gain envelope; freq can slide */
  function tone({ type = 'sine', from = 440, to = null, dur = 0.15, gain = 0.5, delay = 0 }) {
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(from, t0);
    if (to !== null) o.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g).connect(master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  /* filtered noise burst */
  function noise({ dur = 0.2, freq = 800, q = 1, gain = 0.5, slideTo = null, delay = 0 }) {
    const t0 = ac.currentTime + delay;
    const len = Math.ceil(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const f = ac.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) f.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
    f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t0);
  }

  const bank = {
    // weapons
    shoot:      () => { tone({ type: 'square', from: 420 + Math.random() * 120, to: 220, dur: 0.06, gain: 0.14 }); },
    scatter:    () => { noise({ dur: 0.12, freq: 1400, slideTo: 300, gain: 0.3 }); },
    longshot:   () => { tone({ type: 'sawtooth', from: 1200, to: 180, dur: 0.18, gain: 0.22 }); noise({ dur: 0.08, freq: 2400, gain: 0.12 }); },
    roller:     () => { tone({ type: 'sine', from: 180, to: 90, dur: 0.16, gain: 0.3 }); },
    // impacts
    hit:        () => { tone({ type: 'triangle', from: 190, to: 90, dur: 0.09, gain: 0.3 }); },
    splatted:   () => { tone({ type: 'sawtooth', from: 320, to: 60, dur: 0.4, gain: 0.32 }); noise({ dur: 0.28, freq: 900, slideTo: 120, gain: 0.3 }); },
    hurt:       () => { tone({ type: 'square', from: 140, to: 70, dur: 0.12, gain: 0.26 }); },
    // bombs & rockets
    bombThrow:  () => { noise({ dur: 0.25, freq: 500, slideTo: 1600, gain: 0.18 }); },
    boom:       () => { noise({ dur: 0.45, freq: 700, slideTo: 80, gain: 0.55 }); tone({ type: 'sine', from: 110, to: 40, dur: 0.4, gain: 0.4 }); },
    rocketWarn: () => { for (const d of [0, 0.22]) tone({ type: 'square', from: 880, dur: 0.14, gain: 0.16, delay: d }); },
    rocketBoom: () => { noise({ dur: 0.6, freq: 900, slideTo: 60, gain: 0.6 }); tone({ type: 'sine', from: 90, to: 34, dur: 0.55, gain: 0.5 }); },
    // pickups & events
    pickup:     () => { tone({ type: 'triangle', from: 520, dur: 0.07, gain: 0.2 }); tone({ type: 'triangle', from: 780, dur: 0.1, gain: 0.2, delay: 0.08 }); },
    button:     () => { tone({ type: 'square', from: 240, dur: 0.06, gain: 0.25 }); [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', from: f, dur: 0.12, gain: 0.18, delay: 0.08 + i * 0.07 })); },
    tick:       () => { tone({ type: 'square', from: 1100, to: 900, dur: 0.04, gain: 0.14 }); },
    slam:       () => { [392, 523, 659, 784].forEach((f, i) => tone({ type: 'sawtooth', from: f, dur: 0.18, gain: 0.2, delay: i * 0.09 })); noise({ dur: 0.4, freq: 1200, slideTo: 200, gain: 0.25, delay: 0.36 }); },
    start:      () => { tone({ type: 'sine', from: 600, to: 950, dur: 0.25, gain: 0.25 }); tone({ type: 'sine', from: 950, dur: 0.18, gain: 0.22, delay: 0.28 }); },
    end:        () => { [660, 550, 440].forEach((f, i) => tone({ type: 'sawtooth', from: f, dur: 0.3, gain: 0.2, delay: i * 0.22 })); },
    skill:      () => { tone({ type: 'sawtooth', from: 220, to: 880, dur: 0.22, gain: 0.22 }); tone({ type: 'triangle', from: 990, dur: 0.1, gain: 0.18, delay: 0.2 }); },
    sizzle:     () => { noise({ dur: 0.16, freq: 2600, slideTo: 800, gain: 0.16 }); },
    warp:       () => { tone({ type: 'sine', from: 300, to: 900, dur: 0.16, gain: 0.22 }); tone({ type: 'sine', from: 900, to: 420, dur: 0.18, gain: 0.2, delay: 0.14 }); },
    // menus
    click:      () => { tone({ type: 'square', from: 640, to: 520, dur: 0.05, gain: 0.15 }); },
    uiSplat:    () => { noise({ dur: 0.18, freq: 1000, slideTo: 200, gain: 0.3 }); },
  };

  return {
    play(name) {
      if (muted || !bank[name]) return;
      if (typeof game !== 'undefined' && game.demo) return;   // attract mode is silent
      if (!ensure()) return;
      bank[name]();
    },
    toggleMute() {
      muted = !muted;
      if (!muted) { ensure(); bank.click(); }
      return muted;
    },
    setMuted(m) { muted = m; },
    get muted() { return muted; },
    unlock() { ensure(); },
  };
})();
