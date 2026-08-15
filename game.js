(() => {
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 960, H = 300, GROUND = 256;
ctx.imageSmoothingEnabled = false;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

function load(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(k, String(v)); } catch (e) {} }

let storedHi = parseInt(load('trex.hi', '0'), 10) || 0;
let muted    = load('trex.muted', '0') === '1';

const TOP = [
"..........XXXXXXXXXX.",
".........XXXXXXXXXXX.",
".........XOXXXXXXXXX.",
".........XXXXXXXXXXX.",
".........XXXXXXXXXX..",
".........XXXXX.......",
".........XXXXXXXXX...",
"X........XXXXX.......",
"X.......XXXXXX.......",
"XX.....XXXXXXXX......",
"XXX...XXXXXXXXXXXX...",
"XXXXXXXXXXXXXXXXXXX..",
".XXXXXXXXXXXXXXXXX...",
"..XXXXXXXXXXXXXXX....",
"...XXXXXXXXXXXXX.....",
"....XXXXXXXXXXX......",
".....XXXXXXXXX.......",
];
const DEAD_TOP = TOP.slice();
DEAD_TOP[2] = ".........X..XXXXXXXX.";
DEAD_TOP[3] = ".........X..XXXXXXXX.";

const LEGS_S = [
"......XXX...XXX......",
"......XXX...XXX......",
"......XXX...XXX......",
"......XXXX..XXXX.....",
];
const LEGS_A = [
"......XXX...XXX......",
"......XXX...XXX......",
"......XXX............",
"......XXXX...........",
];
const LEGS_B = [
"......XXX...XXX......",
"......XXX...XXX......",
"...........XXX.......",
"...........XXXX......",
];

const DUCK = [
"......................XXXXXXXX",
"......................XOXXXXXX",
"......................XXXXXXXX",
"....................XXXXXXXXXX",
"XX................XXXXXXXXXXXX",
"XXXX............XXXXXXXXXXXXXX",
"XXXXXXXXXXXXXXXXXXXXXXXXXXX...",
".XXXXXXXXXXXXXXXXXXXXXXXXX....",
"..XXXXXXXXXXXXXXXXXXXXXX......",
];
const DLEGS_A = [
".....XXX....XXX...............",
".....XXX....XXX...............",
".....XXXX...XXXX..............",
];
const DLEGS_B = [
".....XXX....XXX...............",
".....XXX......................",
".....XXXX.....................",
];

const PTERO_A = [
"..............XX............",
"..............XXX...........",
"..............XXXX..........",
"..............XXXXX.........",
"..............XXXXXX........",
"..............XXXXXXX.......",
"XX............XXXXXXX.......",
"XXXX.........XXXXXXXX.......",
"XXXXXXXXXXXXXXXXXXXXXX......",
".XXXXXXXXXXXXXXXXXXOXXXXXX",
"..XXXXXXXXXXXXXX..........",
"....XXXXXXXXX.............",
];
const PTERO_B = [
"............................",
"............................",
"XX............XXXXXXX.......",
"XXXX.........XXXXXXXX.......",
"XXXXXXXXXXXXXXXXXXXXXX......",
".XXXXXXXXXXXXXXXXXXOXXXXXX",
"..XXXXXXXXXXXXXX..........",
"....XXXXXXXXX.............",
"..............XXXXXXX.......",
"..............XXXXXX........",
"..............XXXXX.........",
"..............XXXX..........",
"..............XXX...........",
];

const CACTUS_S = [
"...XXXX...",
"...XXXX...",
"...XXXX...",
"XX.XXXX...",
"XX.XXXX.XX",
"XX.XXXX.XX",
"XX.XXXX.XX",
"XXXXXXX.XX",
"...XXXXXXX",
"...XXXX...",
"...XXXX...",
"...XXXX...",
"...XXXX...",
"...XXXX...",
];
const CACTUS_L = [
"....XXXX....",
"....XXXX....",
"....XXXX....",
"....XXXX....",
"XXX.XXXX....",
"XXX.XXXX.XXX",
"XXX.XXXX.XXX",
"XXX.XXXX.XXX",
"XXX.XXXX.XXX",
"XXXXXXXX.XXX",
"....XXXXXXXX",
"....XXXX....",
"....XXXX....",
"....XXXX....",
"....XXXX....",
"....XXXX....",
"....XXXX....",
];
const CLOUD = [
".......XXXX...........",
"......XXXXXX...XXX....",
"XX..XXXXXXXXX.XXXXX...",
"XXXXXXXXXXXXXXXXXXXXXX",
".XXXXXXXXXXXXXXXXXXXX.",
];

const SPRITES = {
  runA:  { rows: TOP.concat(LEGS_A),        s: 3 },
  runB:  { rows: TOP.concat(LEGS_B),        s: 3 },
  stand: { rows: TOP.concat(LEGS_S),        s: 3 },
  dead:  { rows: DEAD_TOP.concat(LEGS_S),   s: 3 },
  duckA: { rows: DUCK.concat(DLEGS_A),      s: 3 },
  duckB: { rows: DUCK.concat(DLEGS_B),      s: 3 },
  pteroA:{ rows: PTERO_A,                   s: 3 },
  pteroB:{ rows: PTERO_B,                   s: 3 },
  cS:    { rows: CACTUS_S,                  s: 3 },
  cL:    { rows: CACTUS_L,                  s: 4 },
  cloud: { rows: CLOUD,                     s: 3 },
};

function buildSprite(def, color) {
  const s = def.s, rows = def.rows;
  const c = document.createElement('canvas');
  c.width = rows[0].length * s; c.height = rows.length * s;
  const g = c.getContext('2d');
  g.fillStyle = color;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let i = 0; i < row.length; i++) if (row[i] === 'X') g.fillRect(i * s, r * s, s, s);
  }
  return c;
}
const sprCache = new Map();
function spr(name) {
  const col = (name === 'cloud') ? pal.cloud : pal.body;
  const key = name + col;
  let c = sprCache.get(key);
  if (!c) { c = buildSprite(SPRITES[name], col); sprCache.set(key, c);
            if (sprCache.size > 120) sprCache.delete(sprCache.keys().next().value); }
  return c;
}

const PALS = [
  { st:'#9ad6d9', sb:'#f7e9c9', bd:'#53412f', cl:'#ffffff', nw:0    },
  { st:'#4b3a6b', sb:'#f2954f', bd:'#341f22', cl:'#ffd2a1', nw:0.25 },
  { st:'#0c1220', sb:'#24324c', bd:'#dfe8e2', cl:'#7e93ac', nw:1    },
  { st:'#31465f', sb:'#f4b06a', bd:'#3a2a25', cl:'#f6d9b0', nw:0.3  },
];
function hex2rgb(h){ return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)]; }
function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  const c = A.map((v,i)=>Math.round(v + (B[i]-v)*t));
  return '#' + c.map(v=>v.toString(16).padStart(2,'0')).join('');
}
const smooth = x => x*x*(3-2*x);
let pal = PALS[0], nightW = 0;
function updatePalette(sc) {
  const u = (sc % 900) / 900 * 4;
  const i = Math.floor(u) % 4;
  let f = u - Math.floor(u);
  f = f < 0.55 ? 0 : smooth((f - 0.55) / 0.45);
  const A = PALS[i], B = PALS[(i + 1) % 4];
  pal = { skyTop:mix(A.st,B.st,f), skyBot:mix(A.sb,B.sb,f),
          body:mix(A.bd,B.bd,f),   cloud:mix(A.cl,B.cl,f) };
  nightW = A.nw + (B.nw - A.nw) * f;
}

const FONT = {
'0':["111","101","101","101","111"], '1':["010","110","010","010","111"],
'2':["111","001","111","100","111"], '3':["111","001","011","001","111"],
'4':["101","101","111","001","001"], '5':["111","100","111","001","111"],
'6':["111","100","111","101","111"], '7':["111","001","001","010","010"],
'8':["111","101","111","101","111"], '9':["111","101","111","001","111"],
'A':["111","101","111","101","101"], 'C':["111","100","100","100","111"],
'D':["110","101","101","101","110"], 'E':["111","100","111","100","111"],
'G':["111","100","101","101","111"], 'H':["101","101","111","101","101"],
'I':["111","010","010","010","111"], 'M':["101","111","111","101","101"],
'N':["101","111","101","101","101"], 'O':["111","101","101","101","111"],
'P':["111","101","111","100","100"], 'R':["111","101","110","101","101"],
'S':["111","100","111","001","111"], 'T':["111","010","010","010","010"],
'U':["101","101","101","101","111"], 'V':["101","101","101","101","010"],
'W':["101","101","111","111","101"], 'Y':["101","101","010","010","010"],
'!':["010","010","010","000","010"], '.':["000","000","000","000","010"],
'-':["000","000","111","000","000"], ' ':["000","000","000","000","000"],
};
function textW(str, px) { return str.length * 4 * px - px; }
function drawText(str, x, y, px, color, align) {
  if (align === 'center') x -= textW(str, px) / 2;
  if (align === 'right')  x -= textW(str, px);
  ctx.fillStyle = color;
  for (const ch of str.toUpperCase()) {
    const gl = FONT[ch] || FONT[' '];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++)
      if (gl[r][c] === '1') ctx.fillRect(x + c * px, y + r * px, px, px);
    x += 4 * px;
  }
}
const pad = n => String(Math.max(0, Math.min(99999, n | 0))).padStart(5, '0');

let ac = null;
function audio() {
  if (!ac) { const AC = window.AudioContext || window.webkitAudioContext; if (AC) ac = new AC(); }
  if (ac && ac.state === 'suspended') ac.resume();
}
function tone(f0, f1, dur, type, vol, delay) {
  if (muted || !ac) return;
  const t0 = ac.currentTime + (delay || 0);
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t0);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(ac.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
const sfxJump = () => tone(420, 760, 0.13, 'square', 0.045);
const sfx100  = () => { tone(660, 660, 0.07, 'square', 0.04); tone(880, 880, 0.09, 'square', 0.04, 0.09); };
const sfxDie  = () => { tone(300, 55, 0.4, 'sawtooth', 0.08); tone(140, 40, 0.5, 'square', 0.05, 0.05); };

const START_SPEED = 6.2, MAX_SPEED = 13.5, ACC = 0.0021, GRAV = 0.62;

let state = 'idle';
let t = 0, score = 0, prevScore = 0, speed = START_SPEED;
let spawnDist = 0, nextGap = 520, deadT = 0, newRec = false;
let shake = 0, flashT = 0, squashT = 0, blinkT = 120;
let duckHeld = false, jumpQueued = false, jumpBuf = 0;

const dino = { x: 64, y: GROUND, vy: 0, onGround: true, ducking: false, legF: 0, legT: 0 };
const obs = [], parts = [];

const stars = Array.from({ length: 42 }, () => ({
  x: Math.random() * W, y: 8 + Math.random() * 170, s: Math.random() < .2 ? 2 : 1, p: Math.random() * 6.28
}));
const clouds = Array.from({ length: 5 }, () => ({
  x: Math.random() * (W + 200), y: 22 + Math.random() * 90
}));
let mesas = [];
function addMesa(x) {
  const w = 70 + Math.random() * 160, h = 26 + Math.random() * 66, s = 10 + Math.random() * 22;
  mesas.push({ x, w, h, s });
  return x + w + 30 + Math.random() * 120;
}
(function seedMesas(){ let x = 0; while (x < W + 300) x = addMesa(x); })();
const pebbles = Array.from({ length: 26 }, () => ({
  x: Math.random() * W, y: GROUND + 8 + Math.random() * 28, w: 3 + (Math.random() * 8 | 0)
}));

function dust(n, x, y, pow) {
  for (let i = 0; i < n; i++) parts.push({
    x: x + Math.random() * 14, y: y - Math.random() * 5,
    vx: -speed * 0.35 - Math.random() * pow * 2, vy: -Math.random() * 1.4 * pow,
    life: 0.7 + Math.random() * 0.4, size: 2 + (Math.random() * 2 | 0), g: 0.06
  });
}
function burst(x, y) {
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * 6.28, v = 2 + Math.random() * 4;
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2,
                 life: 1, size: 2 + (Math.random() * 3 | 0), g: 0.25 });
  }
}

function spawnObstacle() {
  const r = Math.random();
  if (score > 250 && r < 0.24) {
    const lvl = Math.random() * 3 | 0;
    const bottom = lvl === 0 ? GROUND - 4 : lvl === 1 ? GROUND - 46 : GROUND - 92;
    obs.push({ kind: 'ptero', x: W + 60, w: 78, h: 36, top: bottom - 36,
               extra: Math.random() * 1.4, flap: Math.random() * 20 });
  } else if (score > 140 && r < 0.55) {
    const n = (score > 480 && Math.random() < 0.35) ? 2 : 1;
    obs.push({ kind: 'big', x: W + 60, w: 48 * n + 4 * (n - 1), h: 68, parts: n });
  } else {
    const maxN = score > 340 ? 3 : score > 110 ? 2 : 1;
    const n = 1 + (Math.random() * maxN | 0);
    obs.push({ kind: 'small', x: W + 60, w: 30 * n + 3 * (n - 1), h: 42, parts: n });
  }
}
function dinoBox() {
  if (dino.ducking) return { x: dino.x + 8, y: GROUND - 34, w: 72, h: 34 };
  return { x: dino.x + 12, y: dino.y - 58, w: 36, h: 58 };
}
function obBox(o) {
  if (o.kind === 'ptero') return { x: o.x + 10, y: o.top + 8, w: o.w - 20, h: o.h - 14 };
  return { x: o.x + 4, y: GROUND - o.h + 5, w: o.w - 8, h: o.h - 5 };
}
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

function die() {
  state = 'dead'; deadT = 0; flashT = 10;
  shake = reduced ? 0 : 14;
  sfxDie();
  burst(dino.x + 30, dino.y - 30);
  const s = Math.floor(score);
  if (s > storedHi) { storedHi = s; newRec = true; save('trex.hi', s); }
  syncHi();
}
function restart() {
  obs.length = 0; parts.length = 0;
  score = 0; prevScore = 0; speed = START_SPEED;
  spawnDist = 0; nextGap = 520; newRec = false;
  dino.y = GROUND; dino.vy = 0; dino.onGround = true; dino.ducking = false;
  shake = 0; flashT = 0; jumpBuf = 0;
  state = 'playing';
}
function doJump() {
  dino.vy = -12.35; dino.onGround = false; dino.ducking = false;
  jumpBuf = 0; sfxJump(); dust(5, dino.x + 8, GROUND, 1.4);
}
function press() {
  audio();
  if (state === 'idle')   { restart(); return; }
  if (state === 'paused') { state = 'playing'; return; }
  if (state === 'dead')   { if (deadT > 22) restart(); return; }
  jumpQueued = true;
}

function updateWorld(s, dt) {
  for (const c of clouds) { c.x -= s * 0.3 * dt; if (c.x < -90) { c.x = W + 60 + Math.random() * 200; c.y = 22 + Math.random() * 90; } }
  const ms = s * 0.22 * dt;
  for (const m of mesas) m.x -= ms;
  while (mesas.length && mesas[0].x + mesas[0].w < -40) mesas.shift();
  let lastX = mesas.length ? mesas[mesas.length - 1].x + mesas[mesas.length - 1].w : 0;
  while (lastX < W + 300) lastX = addMesa(lastX + 30 + Math.random() * 120);
  if (s > 0) for (const p of pebbles) { p.x -= s * dt; if (p.x < -12) { p.x += W + 24; p.y = GROUND + 8 + Math.random() * 28; } }
}

function tick(dt) {
  t += dt;
  blinkT -= dt; if (blinkT <= -8) blinkT = 140 + Math.random() * 160;

  if (state === 'playing') {
    speed = Math.min(MAX_SPEED, speed + ACC * dt);
    score += speed * dt * 0.062;

    if (Math.floor(score / 100) > Math.floor(prevScore / 100)) { flashT = 36; sfx100(); }
    prevScore = score;

    if (jumpQueued) { jumpQueued = false; if (dino.onGround) doJump(); else jumpBuf = 8; }
    if (jumpBuf > 0) { jumpBuf -= dt; if (dino.onGround) doJump(); }

    if (!dino.onGround) {
      dino.vy += GRAV * (duckHeld ? 2.4 : 1) * dt;
      dino.y  += dino.vy * dt;
      if (dino.y >= GROUND) { dino.y = GROUND; dino.onGround = true; dino.vy = 0; squashT = 4; dust(4, dino.x + 14, GROUND, 1); }
    }
    dino.ducking = duckHeld && dino.onGround;
    if (squashT > 0) squashT -= dt;

    if (dino.onGround) {
      dino.legT += speed * dt;
      if (dino.legT > 10) { dino.legT = 0; dino.legF ^= 1; dust(1, dino.x + 14, GROUND, 0.6); }
    }

    spawnDist += speed * dt;
    if (spawnDist >= nextGap) {
      spawnDist = 0; spawnObstacle();
      nextGap = 240 + speed * 24 + Math.random() * 300;
    }

    const db = dinoBox();
    for (let i = obs.length - 1; i >= 0; i--) {
      const o = obs[i];
      o.x -= (speed + (o.extra || 0)) * dt;
      if (o.x + o.w < -60) { obs.splice(i, 1); continue; }
      if (hit(db, obBox(o))) { die(); break; }
    }
    updateWorld(speed, dt);
  } else if (state === 'idle') {
    updateWorld(0.6, dt);
  } else if (state === 'dead') {
    deadT += dt;
  }

  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; p.life -= 0.04 * dt;
    if (p.life <= 0) parts.splice(i, 1);
  }
  if (flashT > 0) flashT -= dt;
  shake = shake > 0.3 ? shake * Math.pow(0.86, dt) : 0;
  updatePalette(score);
}

function dinoSprite() {
  if (state === 'dead') return spr('dead');
  if (dino.ducking)     return dino.legF ? spr('duckB') : spr('duckA');
  if (!dino.onGround)   return spr('stand');
  if (state !== 'playing') return spr('stand');
  return dino.legF ? spr('runB') : spr('runA');
}

function draw() {
  ctx.save();
  if (shake > 0.5) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake);

  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, pal.skyTop); g.addColorStop(1, pal.skyBot);
  ctx.fillStyle = g; ctx.fillRect(-20, -20, W + 40, H + 40);

  if (nightW > 0.05) {
    ctx.fillStyle = '#e8f0ff';
    for (const s of stars) {
      ctx.globalAlpha = nightW * (0.35 + 0.65 * Math.abs(Math.sin(t * 0.03 + s.p)));
      ctx.fillRect(s.x | 0, s.y | 0, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  const cyc = (score % 900) / 900;
  const sunA = Math.max(0, 1 - nightW * 1.8);
  if (sunA > 0.02) {
    ctx.globalAlpha = sunA; ctx.fillStyle = '#ffd684';
    ctx.beginPath(); ctx.arc(W * 0.9 - cyc * W * 0.75, 74 - Math.sin(cyc * Math.PI) * 28, 15, 0, 6.29); ctx.fill();
    ctx.globalAlpha = 1;
  }
  const moonA = Math.max(0, (nightW - 0.5) * 2);
  if (moonA > 0.02) {
    const mx = W * 0.85 - ((score + 450) % 900) / 900 * W * 0.7, my = 62;
    ctx.globalAlpha = moonA; ctx.fillStyle = '#e9eef5';
    ctx.beginPath(); ctx.arc(mx, my, 13, 0, 6.29); ctx.fill();
    ctx.fillStyle = pal.skyTop;
    ctx.beginPath(); ctx.arc(mx + 6, my - 3, 11, 0, 6.29); ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.globalAlpha = 0.85;
  for (const c of clouds) ctx.drawImage(spr('cloud'), c.x | 0, c.y | 0);
  ctx.globalAlpha = 1;

  ctx.globalAlpha = 0.55;
  ctx.fillStyle = mix(pal.skyBot, pal.body, 0.4);
  for (const m of mesas) {
    ctx.fillRect(m.x | 0, GROUND - m.h, m.w, m.h);
    ctx.fillRect((m.x + m.s) | 0, GROUND - m.h - 12, Math.max(8, m.w - m.s * 2), 12);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = pal.body;
  ctx.fillRect(0, GROUND, W, 2);
  for (const p of pebbles) ctx.fillRect(p.x | 0, p.y | 0, p.w, 2);

  for (const o of obs) {
    const x = Math.round(o.x);
    if (o.kind === 'small') {
      const im = spr('cS');
      for (let i = 0; i < o.parts; i++) ctx.drawImage(im, x + i * 33, GROUND - im.height);
    } else if (o.kind === 'big') {
      const im = spr('cL');
      for (let i = 0; i < o.parts; i++) ctx.drawImage(im, x + i * 52, GROUND - im.height);
    } else {
      const bob = Math.sin((t + o.flap) * 0.12) * 4;
      const f = ((t + o.flap) / 9 | 0) % 2;
      ctx.drawImage(f ? spr('pteroB') : spr('pteroA'), x, Math.round(o.top + bob));
    }
  }

  const img = dinoSprite();
  const sq = squashT > 0 ? Math.min(4, squashT * 1.5) : 0;
  const topY = GROUND - img.height;
  ctx.drawImage(img, dino.x, topY + sq, img.width, img.height - sq);
  if (!dino.ducking && state !== 'dead' && blinkT <= 0) {
    ctx.fillStyle = pal.body;
    ctx.fillRect(dino.x + 30, topY + 6 + sq, 3, 3);
  }

  for (const p of parts) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = pal.body;
    ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const dispHi = Math.max(storedHi, Math.floor(score));
  const blinkOff = flashT > 0 && ((flashT / 4 | 0) % 2 === 0);
  if (!blinkOff) drawText('HI ' + pad(dispHi) + ' ' + pad(Math.floor(score)), W - 14, 14, 3, pal.body, 'right');

  if (state === 'idle') {
    if ((t / 30 | 0) % 2 === 0)
      drawText('PRESS SPACE OR TAP TO START', W / 2, 112, 3, pal.body, 'center');
    ctx.globalAlpha = 0.65;
    drawText('DOWN = DUCK · HOLD DOWN IN AIR = FAST-FALL', W / 2, 148, 2, pal.body, 'center');
    ctx.globalAlpha = 1;
  }

  if (state === 'paused') {
    ctx.fillStyle = 'rgba(10,14,22,.55)'; ctx.fillRect(0, 0, W, H);
    drawText('PAUSED', W / 2, 118, 4, pal.body, 'center');
    drawText('PRESS P TO RESUME', W / 2, 158, 2, pal.body, 'center');
  }

  if (state === 'dead' && deadT > 10) {
    const bw = 380, bx = (W - bw) / 2, by = 84, bh = newRec ? 112 : 96;
    ctx.globalAlpha = 0.88; ctx.fillStyle = pal.skyTop; ctx.fillRect(bx, by, bw, bh);
    ctx.globalAlpha = 1;
    ctx.fillStyle = pal.body;
    ctx.fillRect(bx, by, bw, 3); ctx.fillRect(bx, by + bh - 3, bw, 3);
    ctx.fillRect(bx, by, 3, bh); ctx.fillRect(bx + bw - 3, by, 3, bh);
    drawText('GAME OVER', W / 2, by + 18, 4, pal.body, 'center');
    if (newRec) drawText('NEW HI SCORE!', W / 2, by + 52, 2, pal.body, 'center');
    if ((t / 30 | 0) % 2 === 0)
      drawText('PRESS SPACE OR TAP TO RESTART', W / 2, by + (newRec ? 76 : 58), 2, pal.body, 'center');
  }

  if (flashT > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + Math.min(0.55, flashT * 0.05).toFixed(3) + ')';
    ctx.fillRect(0, 0, W, H);
  }
}

let last = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min((now - last) / 16.667, 3) || 1;
  last = now;
  if (state !== 'paused') tick(dt);
  draw();
}
requestAnimationFrame(frame);

const JUMP_KEYS = ['Space', 'ArrowUp', 'KeyW'];
const DOWN_KEYS = ['ArrowDown', 'KeyS'];

addEventListener('keydown', e => {
  if (JUMP_KEYS.includes(e.code)) { e.preventDefault(); if (!e.repeat) press(); }
  else if (DOWN_KEYS.includes(e.code)) { e.preventDefault(); duckHeld = true; }
  else if (e.code === 'KeyP') { if (state === 'playing') state = 'paused'; else if (state === 'paused') state = 'playing'; }
  else if (e.code === 'KeyM') toggleMute();
  else if (e.code === 'KeyR') { audio(); restart(); }
});
addEventListener('keyup', e => {
  if (JUMP_KEYS.includes(e.code)) { if (dino.vy < -4.5) dino.vy = -4.5; }
  else if (DOWN_KEYS.includes(e.code)) duckHeld = false;
});

let lastTouch = 0, tY0 = 0;
canvas.addEventListener('touchstart', e => {
  e.preventDefault(); lastTouch = Date.now(); tY0 = e.touches[0].clientY; press();
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (e.touches[0].clientY - tY0 > 26) duckHeld = true;
}, { passive: true });
canvas.addEventListener('touchend', e => { e.preventDefault(); duckHeld = false; lastTouch = Date.now(); }, { passive: false });
canvas.addEventListener('mousedown', e => {
  if (Date.now() - lastTouch < 500) return;
  e.preventDefault(); press();
});

const hiTop = document.getElementById('hiTop');
const netEl = document.getElementById('net'), netTxt = document.getElementById('netTxt');
const btnSound = document.getElementById('btnSound'), btnRestart = document.getElementById('btnRestart');
const tipEl = document.getElementById('tip');

function syncHi() { hiTop.textContent = pad(storedHi); }
function netStatus() {
  const on = navigator.onLine;
  netEl.className = 'pill ' + (on ? 'on' : 'off');
  netTxt.textContent = on ? 'ONLINE · WORKS ANYWAY' : 'OFFLINE · IDEAL CONDITIONS';
}
function toggleMute() {
  muted = !muted; save('trex.muted', muted ? '1' : '0');
  btnSound.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
}
btnSound.textContent = muted ? 'SOUND OFF' : 'SOUND ON';
btnSound.addEventListener('click', () => { audio(); toggleMute(); btnSound.blur(); });
btnRestart.addEventListener('click', () => { audio(); restart(); btnRestart.blur(); });

addEventListener('online', netStatus);
addEventListener('offline', netStatus);
addEventListener('blur', () => { if (state === 'playing') state = 'paused'; });
document.addEventListener('visibilitychange', () => { if (document.hidden && state === 'playing') state = 'paused'; });

const TIPS = [
  'TIP — Hold ↓ mid-air to fast-fall for clutch landings.',
  'TIP — Pterodactyls arrive after 250 points. Duck the head-high ones.',
  'TIP — Every 900 points, the desert shifts to a new time of day.',
  'TIP — Short taps make short hops. Hold space for the full leap.',
  'TIP — The dino blinks. So should you.',
];
let tipI = 0;
setInterval(() => {
  tipEl.style.opacity = 0;
  setTimeout(() => { tipI = (tipI + 1) % TIPS.length; tipEl.textContent = TIPS[tipI]; tipEl.style.opacity = 1; }, 400);
}, 7000);

syncHi();
netStatus();
})();