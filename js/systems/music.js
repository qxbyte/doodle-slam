'use strict';

/* ============================================================
   Music — a procedural lo-fi loop, fully synthesized (no
   files). A lookahead scheduler plays a four-chord pad with a
   soft kick, hats, bass and occasional pentatonic plucks.
   Starts on the first user gesture; M mutes it with the SFX.
   ============================================================ */

const Music = (() => {
  const TEMPO = 82;
  const STEP = 60 / TEMPO / 2;           // 8th notes
  const VOLUME = 0.13;

  // Am — F — C — G, as frequency stacks (root, third, fifth)
  const CHORDS = [
    [220.0, 261.6, 329.6],
    [174.6, 220.0, 261.6],
    [196.0, 246.9, 293.7],
    [164.8, 196.0, 246.9],
  ];
  const PENTA = [440, 523.3, 587.3, 659.3, 784.0];

  let ac = null, master = null, timer = null;
  let muted = false, step = 0, nextTime = 0, noiseBuf = null;

  function ensure() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = VOLUME;
    // gentle lowpass over the whole mix = instant lo-fi
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2400;
    master.connect(lp).connect(ac.destination);
    const len = ac.sampleRate * 0.1;
    noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function note(freq, t, dur, gain, type = 'triangle', detune = 0) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + Math.min(0.05, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  function hat(t, gain) {
    const src = ac.createBufferSource();
    src.buffer = noiseBuf;
    const f = ac.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 6000;
    const g = ac.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    src.connect(f).connect(g).connect(master);
    src.start(t);
  }

  function kick(t) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.2);
  }

  function scheduleStep(s, t) {
    const bar = Math.floor(s / 8) % 4;
    const beat = s % 8;
    const chord = CHORDS[bar];
    if (beat === 0) {
      // pad: two soft detuned voices per chord note, one bar long
      for (const f of chord) {
        note(f, t, STEP * 8, 0.05, 'triangle', -6);
        note(f, t, STEP * 8, 0.05, 'triangle', 6);
      }
      note(chord[0] / 2, t, STEP * 3.4, 0.16, 'sine');   // bass
      kick(t);
    }
    if (beat === 4) note(chord[0] / 2, t, STEP * 1.6, 0.1, 'sine');
    if (beat === 5) kick(t);
    if (beat % 2 === 1) hat(t, beat === 7 ? 0.05 : 0.028);
    // sparse pentatonic pluck on offbeats
    if (beat % 2 === 0 && beat !== 0 && Math.random() < 0.22) {
      note(PENTA[Math.floor(Math.random() * PENTA.length)], t, STEP * 1.4, 0.05, 'sine');
    }
  }

  function start() {
    if (timer || muted || !ensure()) return;
    if (ac.state === 'suspended') ac.resume();
    step = 0;
    nextTime = ac.currentTime + 0.1;
    timer = setInterval(() => {
      while (nextTime < ac.currentTime + 0.2) {
        scheduleStep(step, nextTime);
        step++;
        nextTime += STEP;
      }
    }, 50);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function setMuted(m) {
    muted = m;
    if (m) stop();
    else start();
  }

  return { start, stop, setMuted };
})();
