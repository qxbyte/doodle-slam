'use strict';

/* ============================================================
   Turf replay — snapshots of the ownership grid taken during
   the match, played back as a timelapse on the results screen.
   ~90 frames x 9.6KB for a full match; cheap enough to keep.
   ============================================================ */

const Replay = (() => {
  const SNAP_EVERY = 2;      // seconds of match time per frame
  const PLAY_MS = 5000;      // playback duration
  const HOLD_MS = 1400;      // hold the final frame before looping

  let frames = [];
  let acc = 0;
  let raf = null;

  function reset() {
    frames = [];
    acc = 0;
    snap();
  }

  function tick(dt) {
    acc += dt;
    if (acc >= SNAP_EVERY) {
      acc = 0;
      snap();
    }
  }

  function snap() {
    if (typeof grid !== 'undefined' && grid) frames.push(grid.slice());
  }

  /* one grid frame -> canvas, minimap-style */
  function drawFrame(c, frame, w, h, progress) {
    const sx = w / GRID_W, sy = h / GRID_H;
    c.fillStyle = '#fdfdfa';
    c.fillRect(0, 0, w, h);
    for (let gy = 0; gy < GRID_H; gy++) {
      for (let gx = 0; gx < GRID_W; gx++) {
        const v = frame[gy * GRID_W + gx];
        if (v >= 0) {
          c.fillStyle = TEAMS[v].color;
          c.fillRect(gx * sx, gy * sy, sx + 0.5, sy + 0.5);
        }
      }
    }
    c.fillStyle = 'rgba(165,210,235,0.55)';
    for (const r of ICE) {
      c.fillRect(r.x / WORLD.w * w, r.y / WORLD.h * h, r.w / WORLD.w * w, r.h / WORLD.h * h);
    }
    c.fillStyle = 'rgba(238,116,52,0.85)';
    for (const r of LAVA) {
      c.fillRect(r.x / WORLD.w * w, r.y / WORLD.h * h, r.w / WORLD.w * w, r.h / WORLD.h * h);
    }
    c.fillStyle = 'rgba(110,150,175,0.5)';
    for (const wa of WATER) {
      c.fillRect(wa.x / WORLD.w * w, wa.y / WORLD.h * h, wa.w / WORLD.w * w, wa.h / WORLD.h * h);
    }
    c.fillStyle = '#b9b9b2';
    for (const b of BUILDINGS) {
      c.fillRect(b.x / WORLD.w * w, b.y / WORLD.h * h, b.w / WORLD.w * w, b.h / WORLD.h * h);
    }
    // progress bar + match clock along the bottom (sized to the frame)
    const barH = Math.max(5, Math.round(h * 0.023));
    c.fillStyle = 'rgba(28,28,26,0.15)';
    c.fillRect(0, h - barH, w, barH);
    c.fillStyle = '#1c1c1a';
    c.fillRect(0, h - barH, w * progress, barH);
    c.font = `800 ${Math.max(11, Math.round(h * 0.05))}px 'Nunito', sans-serif`;
    c.textAlign = 'right';
    c.fillStyle = '#1c1c1a';
    c.fillText(formatTime(180 * progress), w - 6, h - barH - 5);
  }

  function start(canvas) {
    stop();
    if (!frames.length) return;
    const c = canvas.getContext('2d');
    let t0 = null;
    const step = now => {
      if (t0 === null) t0 = now;   // rAF timestamps may lag performance.now()
      const t = Math.max(0, now - t0) % (PLAY_MS + HOLD_MS);
      const k = clamp(t / PLAY_MS, 0, 1);
      const idx = Math.min(frames.length - 1, Math.round(k * (frames.length - 1)));
      drawFrame(c, frames[idx], canvas.width, canvas.height, k);
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  /* the final turf frame, for the share card */
  function drawFinal(c, w, h) {
    if (frames.length) drawFrame(c, frames[frames.length - 1], w, h, 1);
  }

  /* render the timelapse into a WebM download via MediaRecorder */
  function exportWebM(onDone) {
    if (!frames.length || typeof MediaRecorder === 'undefined') {
      pushToast(L('Video export is not supported in this browser.'));
      if (onDone) onDone(false);
      return;
    }
    const cv = document.createElement('canvas');
    cv.width = 660; cv.height = 440;
    const c = cv.getContext('2d');
    const stream = cv.captureStream(30);
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
      ? 'video/webm;codecs=vp9' : 'video/webm';
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4e6 });
    const chunks = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
      a.download = `doodle-slam-replay-${Date.now()}.webm`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      if (onDone) onDone(true);
    };
    rec.start();
    let t0 = null;
    const step = now => {
      if (t0 === null) t0 = now;
      const t = now - t0;
      const k = clamp(t / PLAY_MS, 0, 1);
      const idx = Math.min(frames.length - 1, Math.round(k * (frames.length - 1)));
      drawFrame(c, frames[idx], cv.width, cv.height, k);
      if (t < PLAY_MS + 800) requestAnimationFrame(step);
      else rec.stop();
    };
    requestAnimationFrame(step);
  }

  return { reset, tick, snap, start, stop, drawFinal, exportWebM };
})();
