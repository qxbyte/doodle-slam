'use strict';

/* ============================================================
   Music — a procedural lo-fi loop, fully synthesized (no
   files). A lookahead scheduler plays a four-chord pad with a
   soft kick, hats, bass and occasional pentatonic plucks.
   Starts on the first user gesture; M mutes it with the SFX.

   Each stage picks a MOOD (map data `mood` field): same engine,
   different tempo / chords / filter / drum pattern, so the deep
   sea drags and the chalk fair swings. setMood() switches live.
   ============================================================ */

const Music = (() => {
  const VOLUME = 0.13;

  /* note frequencies used by the chord stacks (3rd octave-ish) */
  // E3 164.8  F3 174.6  G3 196.0  G#3 207.7  A3 220.0  B3 246.9
  // C4 261.6  D4 293.7  E4 329.6  F4 349.2  G4 392.0

  const MOODS = {
    // Am F C G — the classic daydream loop (city + menus)
    default: {
      tempo: 82, lp: 2400, pad: 'triangle', pluck: 0.22, hatMul: 1, swing: 0,
      kickBeats: [0, 5],
      chords: [
        [220.0, 261.6, 329.6], [174.6, 220.0, 261.6],
        [196.0, 246.9, 293.7], [164.8, 196.0, 246.9],
      ],
      penta: [440, 523.3, 587.3, 659.3, 784.0],
    },
    // C G Am F — warm campfire folk, a touch slower
    forest: {
      tempo: 72, lp: 2200, pad: 'triangle', pluck: 0.18, hatMul: 0.8, swing: 0,
      kickBeats: [0, 5],
      chords: [
        [196.0, 261.6, 329.6], [196.0, 246.9, 293.7],
        [220.0, 261.6, 329.6], [174.6, 220.0, 261.6],
      ],
      penta: [523.3, 587.3, 659.3, 784.0, 880.0],
    },
    // C F C G — bright, quick, sunny
    shore: {
      tempo: 92, lp: 3200, pad: 'triangle', pluck: 0.30, hatMul: 1.2, swing: 0,
      kickBeats: [0, 5],
      chords: [
        [196.0, 261.6, 329.6], [174.6, 220.0, 261.6],
        [196.0, 261.6, 329.6], [196.0, 246.9, 293.7],
      ],
      penta: [523.3, 659.3, 784.0, 880.0, 1046.5],
    },
    // Am Em F Am — slow, dark, muffled like deep water
    deep: {
      tempo: 58, lp: 1300, pad: 'sine', pluck: 0.08, hatMul: 0.5, swing: 0,
      kickBeats: [0],
      chords: [
        [220.0, 261.6, 329.6], [164.8, 196.0, 246.9],
        [174.6, 220.0, 261.6], [220.0, 261.6, 329.6],
      ],
      penta: [329.6, 392.0, 440.0, 523.3, 587.3],
    },
    // Am F Am G — sparse and cold, thin air
    peaks: {
      tempo: 68, lp: 2000, pad: 'triangle', pluck: 0.07, hatMul: 0.6, swing: 0,
      kickBeats: [0, 5],
      chords: [
        [220.0, 261.6, 329.6], [174.6, 220.0, 261.6],
        [220.0, 261.6, 329.6], [196.0, 246.9, 293.7],
      ],
      penta: [659.3, 784.0, 880.0, 1046.5, 1174.7],
    },
    // Dm7 G7 Cmaj7 Am7 — night-fair swing, brushed and jazzy
    chalk: {
      tempo: 98, lp: 2800, pad: 'triangle', pluck: 0.35, hatMul: 1.3, swing: 0.32,
      kickBeats: [0, 5],
      chords: [
        [220.0, 261.6, 293.7, 349.2], [196.0, 246.9, 293.7, 349.2],
        [196.0, 246.9, 261.6, 329.6], [220.0, 261.6, 329.6, 392.0],
      ],
      penta: [523.3, 587.3, 659.3, 784.0, 880.0],
    },
    // C F G F — playful desk-toy bounce
    desk: {
      tempo: 104, lp: 2800, pad: 'triangle', pluck: 0.32, hatMul: 1.1, swing: 0,
      kickBeats: [0, 4, 5],
      chords: [
        [196.0, 261.6, 329.6], [174.6, 220.0, 261.6],
        [196.0, 246.9, 293.7], [174.6, 220.0, 261.6],
      ],
      penta: [784.0, 880.0, 1046.5, 1174.7, 1318.5],
    },
    // Am F Am G — slow, airy, high sparkles far away
    moon: {
      tempo: 62, lp: 1600, pad: 'sine', pluck: 0.10, hatMul: 0.4, swing: 0,
      kickBeats: [0],
      chords: [
        [220.0, 261.6, 329.6], [174.6, 220.0, 261.6],
        [220.0, 261.6, 329.6], [196.0, 246.9, 293.7],
      ],
      penta: [880.0, 1046.5, 1174.7, 1318.5, 1568.0],
    },
    // Am G Am E — tense, driving, extra kicks
    volcano: {
      tempo: 90, lp: 2000, pad: 'triangle', pluck: 0.12, hatMul: 0.9, swing: 0,
      kickBeats: [0, 3, 5],
      chords: [
        [220.0, 261.6, 329.6], [196.0, 246.9, 293.7],
        [220.0, 261.6, 329.6], [164.8, 207.7, 246.9],
      ],
      penta: [440.0, 523.3, 587.3, 659.3, 784.0],
    },
    // Dm Am Dm G — murky offbeat dub under the streets
    sewer: {
      tempo: 74, lp: 1100, pad: 'sine', pluck: 0.15, hatMul: 1.4, swing: 0.2,
      kickBeats: [0, 5],
      chords: [
        [220.0, 293.7, 349.2], [220.0, 261.6, 329.6],
        [220.0, 293.7, 349.2], [196.0, 246.9, 293.7],
      ],
      penta: [392.0, 440.0, 523.3, 587.3, 659.3],
    },
  };

  let ac = null, master = null, lpNode = null, timer = null;
  let muted = false, step = 0, nextTime = 0, noiseBuf = null;
  let mood = MOODS.default;
  const stepDur = () => 60 / mood.tempo / 2;   // 8th notes

  function ensure() {
    if (ac) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = VOLUME;
    // gentle lowpass over the whole mix = instant lo-fi
    lpNode = ac.createBiquadFilter();
    lpNode.type = 'lowpass';
    lpNode.frequency.value = mood.lp;
    master.connect(lpNode).connect(ac.destination);
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
    const S = stepDur();
    const bar = Math.floor(s / 8) % 4;
    const beat = s % 8;
    const chord = mood.chords[bar];
    if (beat === 0) {
      // pad: two soft detuned voices per chord note, one bar long
      for (const f of chord) {
        note(f, t, S * 8, 0.05, mood.pad, -6);
        note(f, t, S * 8, 0.05, mood.pad, 6);
      }
      note(chord[0] / 2, t, S * 3.4, 0.16, 'sine');   // bass
    }
    if (beat === 4) note(chord[0] / 2, t, S * 1.6, 0.1, 'sine');
    if (mood.kickBeats.includes(beat)) kick(t);
    if (beat % 2 === 1) hat(t, (beat === 7 ? 0.05 : 0.028) * mood.hatMul);
    // sparse pentatonic pluck on offbeats
    if (beat % 2 === 0 && beat !== 0 && Math.random() < mood.pluck) {
      note(mood.penta[Math.floor(Math.random() * mood.penta.length)], t, S * 1.4, 0.05, 'sine');
    }
  }

  function tick() {
    // the context only runs after a user gesture; wait for it
    if (ac.state !== 'running') return;
    // after a suspension the clock jumped ahead — resync instead of
    // machine-gunning every missed step at once
    if (nextTime < ac.currentTime) nextTime = ac.currentTime + 0.1;
    while (nextTime < ac.currentTime + 0.2) {
      // swung 8ths: odd steps land late
      const t = nextTime + (step % 2 ? stepDur() * mood.swing : 0);
      scheduleStep(step, t);
      step++;
      nextTime += stepDur();
    }
  }

  /* switch mood live; takes effect at the next scheduled bar */
  function setMood(name) {
    const next = MOODS[name] || MOODS.default;
    if (next === mood) return;
    mood = next;
    if (lpNode) lpNode.frequency.setTargetAtTime(mood.lp, ac.currentTime, 0.4);
    step = Math.floor(step / 8) * 8;   // restart the bar cleanly
  }

  function start() {
    if (muted || !ensure()) return;
    // always try to resume: start() may be re-invoked by the first
    // user gesture while the scheduler is already armed
    if (ac.state === 'suspended') ac.resume();
    if (timer) return;
    step = 0;
    nextTime = ac.currentTime + 0.1;
    timer = setInterval(tick, 50);
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

  return { start, stop, setMuted, setMood, MOODS };
})();
