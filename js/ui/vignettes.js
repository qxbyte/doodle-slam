'use strict';

/* ============================================================
   Stage vignettes — one signature doodle per stage, drawn with
   the sketch kit onto the stage-select cards.
   Register more by adding a key here and referencing it from
   the STAGES entry (maps/registry.js).
   ============================================================ */

const VIGNETTE_SEEDS = { city: 11, forest: 22, shore: 55, peaks: 66, desk: 33, moon: 44 };
const VIGNETTE_BG = {
  desk: '#eedfcf', moon: '#e9edef', shore: '#f2e7cf', peaks: '#f4f7f9',
};

const VIGNETTES = {

  city(c, rng, cv) {

    // skyline: three blocks + rooftop billboard + a cloud
    const blocks = [[24, 62, 44, 72], [82, 40, 56, 94], [152, 74, 40, 60]];
    for (const [x, y, w, h] of blocks) {
      c.fillStyle = PAPER;
      c.fillRect(x, y, w, h);
      c.lineWidth = 2;
      wobblyRect(c, rng, x, y, w, h, 1.4);
      c.stroke();
      hatchRect(c, rng, x, y, w, 8, 4);
      c.lineWidth = 1.1;
      for (let wy = y + 16; wy < y + h - 10; wy += 18) {
        for (let wx = x + 8; wx < x + w - 10; wx += 16) {
          wobblyRect(c, rng, wx, wy, 8, 10, 0.6);
          c.stroke();
        }
      }
    }
    // billboard on the middle block
    c.fillStyle = '#fff';
    c.lineWidth = 1.8;
    wobblyRect(c, rng, 88, 22, 46, 14, 1);
    c.fill(); c.stroke();
    c.font = `9px 'Patrick Hand', cursive`;
    c.fillStyle = INK;
    c.textAlign = 'center';
    c.fillText('SLAM!', 111, 32);
    // cloud
    c.lineWidth = 1.3;
    scribbleBlob(c, rng, 190, 30, 13);
    c.stroke();
    // street
    c.strokeStyle = INK_LIGHT;
    wobblyPath(c, rng, [[8, 138], [224, 138]], 1.5);
    c.stroke();
    c.setLineDash([8, 8]);
    wobblyPath(c, rng, [[8, 144], [224, 144]], 1);
    c.stroke();
    c.setLineDash([]);
  },

  forest(c, rng, cv) {

    // forest camp: pines + tent + campfire smoke + birds
    const pine = (px, py, s) => {
      c.strokeStyle = INK;
      c.lineWidth = 1.6;
      c.fillStyle = PAPER;
      for (let tier = 0; tier < 3; tier++) {
        const ty = py - tier * 11 * s, tw = (22 - tier * 5) * s;
        c.beginPath();
        c.moveTo(px - tw, ty);
        c.lineTo(px, ty - 14 * s);
        c.lineTo(px + tw, ty);
        c.closePath();
        c.fill(); c.stroke();
      }
      c.beginPath(); c.moveTo(px, py + 2); c.lineTo(px, py + 10 * s); c.stroke();
    };
    pine(38, 96, 1.1);
    pine(74, 108, 0.8);
    pine(196, 100, 1.0);
    // tent
    c.lineWidth = 1.8;
    c.fillStyle = PAPER;
    c.beginPath();
    c.moveTo(104, 122);
    c.quadraticCurveTo(118, 78, 132, 70);
    c.quadraticCurveTo(146, 78, 160, 122);
    c.closePath();
    c.fill(); c.stroke();
    c.beginPath();
    c.moveTo(132, 74); c.lineTo(122, 122); c.lineTo(142, 122);
    c.closePath();
    c.fillStyle = '#dddbd3';
    c.fill(); c.stroke();
    // campfire with the warm accent
    c.fillStyle = '#e88a2a';
    c.beginPath();
    c.moveTo(182, 118);
    c.quadraticCurveTo(189, 128, 182, 134);
    c.quadraticCurveTo(175, 128, 182, 118);
    c.fill();
    c.strokeStyle = INK;
    c.lineWidth = 1.3;
    c.stroke();
    c.beginPath();
    c.moveTo(172, 136); c.lineTo(192, 132);
    c.moveTo(172, 132); c.lineTo(192, 136);
    c.stroke();
    // smoke curl
    c.strokeStyle = INK_LIGHT;
    c.beginPath();
    c.moveTo(182, 114);
    c.quadraticCurveTo(190, 104, 184, 96);
    c.quadraticCurveTo(178, 88, 186, 80);
    c.stroke();
    // birds
    c.strokeStyle = INK;
    for (const [bx, by] of [[120, 34], [138, 28], [156, 38]]) {
      c.beginPath();
      c.moveTo(bx - 5, by);
      c.quadraticCurveTo(bx - 2, by - 4, bx, by);
      c.quadraticCurveTo(bx + 2, by - 4, bx + 5, by);
      c.stroke();
    }
    // ground line
    c.strokeStyle = INK_LIGHT;
    wobblyPath(c, rng, [[8, 128], [224, 128]], 2);
    c.stroke();
  },

  desk(c, rng, cv) {

    // wood grain backdrop
    c.strokeStyle = 'rgba(150,108,74,0.18)';
    c.lineWidth = 1.2;
    for (let y = 12; y < cv.height; y += 14) {
      wobblyPath(c, rng, [[0, y], [cv.width, y]], 2);
      c.stroke();
    }
    // a sheet of paper with a doodle
    c.save();
    c.translate(58, 84);
    c.rotate(-0.08);
    c.fillStyle = '#fbfaf4';
    c.fillRect(-40, -34, 84, 64);
    c.strokeStyle = INK_LIGHT;
    c.lineWidth = 1.2;
    c.strokeRect(-40, -34, 84, 64);
    c.strokeStyle = INK;
    c.beginPath(); c.arc(0, -4, 12, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.arc(-4, -7, 1.4, 0, Math.PI * 2); c.fillStyle = INK; c.fill();
    c.beginPath(); c.arc(4, -7, 1.4, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(0, 0, 6, 0.4, Math.PI - 0.4); c.stroke();
    c.restore();
    // mug with steam
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.fillStyle = '#f6f5f0';
    c.beginPath(); c.arc(160, 88, 26, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#7a4b28';
    c.beginPath(); c.arc(160, 88, 19, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = '#f6f5f0';
    c.beginPath(); c.ellipse(192, 88, 9, 14, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.strokeStyle = INK_LIGHT;
    c.beginPath();
    c.moveTo(152, 56); c.quadraticCurveTo(160, 44, 152, 34);
    c.moveTo(168, 58); c.quadraticCurveTo(176, 46, 168, 36);
    c.stroke();
    // pencil lying across the corner
    c.save();
    c.translate(118, 128);
    c.rotate(-0.12);
    c.strokeStyle = INK;
    c.lineWidth = 1.8;
    c.fillStyle = '#f2d489';
    c.fillRect(-58, -7, 96, 14); c.strokeRect(-58, -7, 96, 14);
    c.fillStyle = '#e8cf9e';
    c.beginPath(); c.moveTo(-58, -7); c.lineTo(-74, 0); c.lineTo(-58, 7); c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#3c3c3a';
    c.beginPath(); c.moveTo(-68, -2.6); c.lineTo(-74, 0); c.lineTo(-68, 2.6); c.closePath(); c.fill();
    c.fillStyle = '#e8a8a0';
    c.fillRect(38, -7, 12, 14); c.strokeRect(38, -7, 12, 14);
    c.restore();
    // ink blot accent
    drawSplat(c, rng, 208, 34, 12, '#26262c');
  },

  moon(c, rng, cv) {

    // stars + a tiny earth
    c.fillStyle = 'rgba(90,98,110,0.5)';
    for (let i = 0; i < 24; i++) {
      c.fillRect(rand(rng, 8, cv.width - 8), rand(rng, 6, 60), 1.6, 1.6);
    }
    c.strokeStyle = INK;
    c.lineWidth = 1.6;
    for (const [sx, sy] of [[36, 26], [196, 18], [120, 12]]) {
      c.beginPath();
      c.moveTo(sx - 5, sy); c.lineTo(sx + 5, sy);
      c.moveTo(sx, sy - 5); c.lineTo(sx, sy + 5);
      c.stroke();
    }
    c.fillStyle = '#cfe0ec';
    c.beginPath(); c.arc(206, 44, 13, 0, Math.PI * 2); c.fill();
    c.strokeStyle = INK; c.stroke();
    c.fillStyle = '#9dbf8e';
    c.beginPath(); c.arc(202, 41, 5, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(211, 49, 3.6, 0, Math.PI * 2); c.fill();
    // rolling surface with craters
    c.strokeStyle = INK;
    c.lineWidth = 2;
    wobblyPath(c, rng, [[0, 96], [cv.width, 92]], 2.5);
    c.stroke();
    for (const [cx2, cy2, r] of [[52, 116, 15], [150, 128, 19], [216, 112, 10]]) {
      wobblyCircle(c, rng, cx2, cy2, r, 0.08);
      c.lineWidth = 1.6;
      c.stroke();
      c.fillStyle = 'rgba(90,98,110,0.18)';
      c.fill();
    }
    // planted flag
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(102, 118); c.lineTo(102, 84); c.stroke();
    c.fillStyle = '#e6392a';
    c.beginPath(); c.moveTo(102, 84); c.lineTo(122, 89); c.lineTo(102, 95); c.closePath();
    c.fill(); c.lineWidth = 1.4; c.stroke();
    // little ufo overhead
    c.save();
    c.translate(66, 54);
    c.rotate(-0.1);
    c.fillStyle = '#d8dee8';
    c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(0, 0, 22, 8, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = 'rgba(200,225,235,0.8)';
    c.beginPath(); c.ellipse(0, -6, 10, 7, 0, Math.PI, 0); c.fill(); c.stroke();
    c.restore();
  },

  shore(c, rng, cv) {
    // sun with scribble rays
    c.strokeStyle = INK;
    c.lineWidth = 1.8;
    c.fillStyle = '#f6d66a';
    c.beginPath(); c.arc(196, 30, 14, 0, Math.PI * 2); c.fill(); c.stroke();
    c.lineWidth = 1.3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(196 + Math.cos(a) * 18, 30 + Math.sin(a) * 18);
      c.lineTo(196 + Math.cos(a) * 25, 30 + Math.sin(a) * 25);
      c.stroke();
    }
    // sea with foam + a little sailboat
    c.fillStyle = 'rgba(110,160,180,0.35)';
    c.fillRect(0, 92, cv.width, cv.height - 92);
    c.strokeStyle = INK;
    c.lineWidth = 2;
    wobblyPath(c, rng, [[0, 92], [cv.width, 92]], 2);
    c.stroke();
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 2.5;
    c.beginPath();
    for (let x = 8; x < cv.width - 10; x += 34) {
      c.moveTo(x, 98);
      c.quadraticCurveTo(x + 9, 103, x + 18, 98);
    }
    c.stroke();
    c.strokeStyle = INK;
    c.lineWidth = 1.8;
    c.fillStyle = '#f6f5f0';
    c.beginPath();
    c.moveTo(28, 116); c.lineTo(72, 116); c.lineTo(62, 126); c.lineTo(38, 126);
    c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(50, 116); c.lineTo(50, 84); c.stroke();
    c.fillStyle = '#e6392a';
    c.beginPath(); c.moveTo(50, 86); c.lineTo(70, 96); c.lineTo(50, 106); c.closePath();
    c.fill(); c.stroke();
    // lighthouse on the right
    c.fillStyle = '#f6f5f0';
    c.beginPath();
    c.moveTo(152, 112); c.lineTo(158, 56); c.lineTo(178, 56); c.lineTo(184, 112);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#e6392a';
    c.beginPath();
    c.moveTo(155, 92); c.lineTo(181, 92); c.lineTo(182, 102); c.lineTo(154, 102);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#f6e6a8';
    c.fillRect(160, 46, 16, 10); c.strokeRect(160, 46, 16, 10);
    c.beginPath(); c.arc(168, 46, 8, Math.PI, 0); c.closePath();
    c.fillStyle = '#e6392a'; c.fill(); c.stroke();
    // parasol on the sand
    c.fillStyle = '#e6392a';
    c.beginPath(); c.arc(96, 70, 17, Math.PI, 0); c.closePath(); c.fill(); c.stroke();
    c.beginPath(); c.moveTo(96, 70); c.lineTo(96, 88); c.stroke();
    // gulls
    for (const [bx, by] of [[60, 34], [84, 26]]) {
      c.beginPath();
      c.moveTo(bx - 5, by);
      c.quadraticCurveTo(bx - 2, by - 4, bx, by);
      c.quadraticCurveTo(bx + 2, by - 4, bx + 5, by);
      c.stroke();
    }
  },

  peaks(c, rng, cv) {
    // two jagged peaks with snow caps
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.fillStyle = PAPER;
    c.beginPath();
    c.moveTo(6, 118);
    c.lineTo(64, 34); c.lineTo(92, 74); c.lineTo(128, 22); c.lineTo(196, 118);
    c.closePath(); c.fill(); c.stroke();
    c.fillStyle = '#ffffff';
    c.strokeStyle = 'rgba(150,175,205,0.8)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(50, 54); c.lineTo(64, 34); c.lineTo(78, 54);
    c.quadraticCurveTo(64, 62, 50, 54);
    c.closePath(); c.fill(); c.stroke();
    c.beginPath();
    c.moveTo(112, 46); c.lineTo(128, 22); c.lineTo(146, 48);
    c.quadraticCurveTo(128, 56, 112, 46);
    c.closePath(); c.fill(); c.stroke();
    // cable car line with a gondola
    c.strokeStyle = INK;
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(12, 52); c.quadraticCurveTo(110, 88, 208, 40);
    c.stroke();
    c.beginPath(); c.moveTo(104, 72); c.lineTo(104, 80); c.stroke();
    c.fillStyle = '#e6392a';
    c.beginPath(); c.roundRect(94, 80, 20, 15, 4); c.fill(); c.stroke();
    c.fillStyle = 'rgba(200,225,235,0.9)';
    c.fillRect(98, 83, 12, 6); c.strokeRect(98, 83, 12, 6);
    // ground line + snowman
    c.strokeStyle = INK;
    c.lineWidth = 2;
    wobblyPath(c, rng, [[0, 122], [cv.width, 118]], 2);
    c.stroke();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(186, 128, 12, 0, Math.PI * 2); c.fill(); c.stroke();
    c.beginPath(); c.arc(186, 110, 8, 0, Math.PI * 2); c.fill(); c.stroke();
    c.fillStyle = INK;
    c.beginPath(); c.arc(183, 108, 1.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(189, 108, 1.2, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#e88a2a';
    c.beginPath(); c.moveTo(186, 111); c.lineTo(194, 113); c.lineTo(186, 114);
    c.closePath(); c.fill();
    // falling snow dots
    c.fillStyle = 'rgba(150,175,205,0.6)';
    for (let i = 0; i < 14; i++) {
      c.beginPath();
      c.arc(rand(rng, 10, cv.width - 10), rand(rng, 10, 100), 1.6, 0, Math.PI * 2);
      c.fill();
    }
  },
};
