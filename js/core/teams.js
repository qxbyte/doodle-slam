'use strict';

/* The four fighters/teams. Index = team id everywhere in the game. */
const TEAMS = [
  { id: 0, name: 'ZURI', color: '#2f66e0', dark: '#1d47a8', desc: 'Cool-headed turf tactician. Team Blue.' },
  { id: 1, name: 'JAX',  color: '#e6392a', dark: '#a8231a', desc: 'Hot-blooded rusher. Team Red.' },
  { id: 2, name: 'NIA',  color: '#f0b41c', dark: '#b5830f', desc: 'Sharp-eyed duelist. Team Yellow.' },
  { id: 3, name: 'KOBI', color: '#3ba24f', dark: '#256b34', desc: 'Easy-going area painter. Team Green.' },
];

/* One weapon per fighter — the card blurbs made real. Indexed by team id.
   sound: key into SFX bank. splatMin/Max: landing splat radius. */
const WEAPONS = [
  { name: 'SketchBlaster', blurb: 'steady all-round sprayer',
    sound: 'shoot', fireInterval: 0.11, inkCost: 1.8, range: 360,
    projSpeed: 560, damage: 16, pellets: 1, spread: 0.075, splatMin: 14, splatMax: 24 },
  { name: 'Splat Scatter', blurb: 'point-blank burst of four pellets',
    sound: 'scatter', fireInterval: 0.30, inkCost: 5.6, range: 240,
    projSpeed: 520, damage: 9, pellets: 4, spread: 0.30, splatMin: 10, splatMax: 18 },
  { name: 'Longshot Pen', blurb: 'slow, surgical long-range bolt',
    sound: 'longshot', fireInterval: 0.55, inkCost: 6.0, range: 540,
    projSpeed: 820, damage: 34, pellets: 1, spread: 0.012, splatMin: 18, splatMax: 26 },
  { name: 'Blob Roller', blurb: 'lobs huge, slow blobs of paint',
    sound: 'roller', fireInterval: 0.34, inkCost: 6.5, range: 300,
    projSpeed: 420, damage: 12, pellets: 1, spread: 0.11, splatMin: 30, splatMax: 42 },
];
