'use strict';

/* ============================================================
   Share card — renders the match result as a doodle-styled
   PNG (logo, final turf frame, ranking, stats) for download.
   Always drawn on the default paper palette.
   ============================================================ */

function buildShareCard(game) {
  const W = 720, H = 920;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const rng = makeRng(777);
  c.lineJoin = 'round';
  c.lineCap = 'round';

  // paper + corner splats
  c.fillStyle = '#f0efe9';
  c.fillRect(0, 0, W, H);
  c.globalAlpha = 0.85;
  drawSplat(c, rng, 40, 36, 46, '#2f66e0');
  drawSplat(c, rng, W - 46, 60, 40, '#e6392a');
  drawSplat(c, rng, 60, H - 60, 38, '#3ba24f');
  drawSplat(c, rng, W - 60, H - 46, 44, '#f0b41c');
  c.globalAlpha = 1;

  // logo + subtitle
  c.fillStyle = '#1c1c1a';
  c.font = `italic 900 52px 'Archivo', 'Arial Black', sans-serif`;
  c.textAlign = 'center';
  c.fillText('DOODLE SLAM!', W / 2, 78);
  const mode = currentMode();
  const date = new Date().toLocaleDateString();
  c.font = `800 18px 'Nunito', sans-serif`;
  c.fillStyle = '#8a8a86';
  c.fillText(`${CURRENT_MAP.name}  ·  ${mode.name}${game.daily ? '  ·  DAILY RUN' : ''}  ·  ${date}`, W / 2, 110);

  // final turf frame in a card
  const fx = 60, fy = 136, fw = W - 120, fh = fw * 2 / 3;
  c.fillStyle = '#fff';
  c.strokeStyle = '#1c1c1a';
  c.lineWidth = 3;
  c.beginPath(); c.roundRect(fx - 10, fy - 10, fw + 20, fh + 20, 14); c.fill(); c.stroke();
  const frameCv = document.createElement('canvas');
  frameCv.width = fw; frameCv.height = fh;
  Replay.drawFinal(frameCv.getContext('2d'), fw, fh);
  c.drawImage(frameCv, fx, fy);

  // ranking rows
  const scores = mode.scores(game);
  const order = [0, 1, 2, 3].sort((a, b) => scores[b] - scores[a]);
  let ry = fy + fh + 56;
  c.textAlign = 'left';
  order.forEach((tid, i) => {
    const t = TEAMS[tid];
    const s = game.stats[tid];
    const you = tid === game.player.team;
    if (you) {
      c.fillStyle = 'rgba(240,180,28,0.25)';
      c.beginPath(); c.roundRect(52, ry - 30, W - 104, 44, 10); c.fill();
    }
    c.font = `italic 900 24px 'Archivo', sans-serif`;
    c.fillStyle = '#1c1c1a';
    c.fillText(`${i + 1}`, 70, ry);
    c.fillStyle = t.color;
    c.beginPath(); c.arc(112, ry - 8, 11, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#1c1c1a'; c.lineWidth = 2; c.stroke();
    c.font = `800 22px 'Nunito', sans-serif`;
    c.fillStyle = '#1c1c1a';
    c.fillText(`${t.name}${you ? ' (YOU)' : ''}`, 138, ry);
    c.font = `700 14px 'Nunito', sans-serif`;
    c.fillStyle = '#8a8a86';
    c.fillText(`${s.splats} splats · ${s.downs} downs${s.buttons ? ` · ${s.buttons} buttons` : ''}`, 138, ry + 18);
    c.font = `italic 900 26px 'Archivo', sans-serif`;
    c.fillStyle = t.dark;
    c.textAlign = 'right';
    c.fillText(mode.fmt(scores[tid]), W - 70, ry);
    c.textAlign = 'left';
    ry += 62;
  });

  // daily score banner
  if (game.daily) {
    c.font = `italic 900 26px 'Archivo', sans-serif`;
    c.fillStyle = '#e6392a';
    c.textAlign = 'center';
    c.fillText(`DAILY SCORE: ${(game.lastCoverage[game.player.team] * 100).toFixed(1)}`, W / 2, ry + 8);
    ry += 40;
  }

  // footer
  c.font = `700 15px 'Nunito', sans-serif`;
  c.fillStyle = '#a5a5a0';
  c.textAlign = 'center';
  c.fillText('github.com/qxbyte/doodle-slam', W / 2, H - 28);
  return cv;
}

function downloadShareCard(game) {
  const cv = buildShareCard(game);
  const a = document.createElement('a');
  a.href = cv.toDataURL('image/png');
  a.download = `doodle-slam-${Date.now()}.png`;
  a.click();
}
