// Host for the WebAssembly game: fixed 60 Hz simulation, palette conversion, input, sound.
import { Sound } from './audio.js';
import { TouchPad } from './touch.js';

const W = 640, H = 480, STEP = 1000 / 60;

// input bits (must match src/app.rs)
const P1_UP = 1, P1_DOWN = 2, P1_LEFT = 4, P1_RIGHT = 8;
const P2_UP = 16, P2_DOWN = 32, P2_LEFT = 64, P2_RIGHT = 128;
const START = 256, BACK = 512, PAUSE = 1024;

// physical key codes, so AZERTY and QWERTY both work for player 2
const KEYS = {
  ArrowUp: P1_UP, ArrowDown: P1_DOWN, ArrowLeft: P1_LEFT, ArrowRight: P1_RIGHT,
  KeyW: P2_UP, KeyS: P2_DOWN, KeyA: P2_LEFT, KeyD: P2_RIGHT,
  Enter: START, NumpadEnter: START, Space: START,
  Escape: BACK, Backspace: BACK, KeyP: PAUSE,
};

const canvas = document.getElementById('screen');
const frame = document.getElementById('frame');
const ctx2d = canvas.getContext('2d', { alpha: false });
const sound = new Sound();
const audioHint = document.getElementById('audiohint');

let keyBits = 0;
// keys pressed since the last simulation step, so very short taps are never lost
let latched = 0;

const touch = new TouchPad({
  LEFT: P1_LEFT, RIGHT: P1_RIGHT, UP: P1_UP, DOWN: P1_DOWN, START, BACK, PAUSE,
});
touch.attach(document.getElementById('touch'));

function fit() {
  const touchMode = document.body.classList.contains('touch');
  document.body.classList.toggle('portrait', window.innerHeight > window.innerWidth);
  // 640x480, square pixels; integer zoom when the window is large enough. On a touch
  // screen the game takes the whole screen and the controls sit over the side bars.
  const maxW = window.innerWidth - (touchMode ? 0 : 24);
  const maxH = window.innerHeight - (touchMode ? 0 : 70);
  let w = Math.min(maxW, (maxH * 4) / 3);
  if (w >= 1280 && !touchMode) w = Math.floor(w / 640) * 640;
  document.body.style.setProperty('--bar', `${Math.max(0, (window.innerWidth - w) / 2)}px`);
  frame.style.width = `${Math.floor(w)}px`;
  frame.style.height = `${Math.floor((w * 3) / 4)}px`;
}
window.addEventListener('resize', fit);

// switch to the touch layout as soon as the screen is touched (or on a phone/tablet)
function touchMode() {
  if (document.body.classList.contains('touch')) return;
  document.body.classList.add('touch');
  fit();
}
if (matchMedia('(pointer: coarse)').matches) touchMode();
window.addEventListener('touchstart', touchMode, { passive: true });
fit();

// full screen, landscape (where the browser allows it; on iPhone: "Add to Home Screen")
const fullBtn = document.getElementById('t-full');
const root = document.documentElement;
const canFull = !!(root.requestFullscreen || root.webkitRequestFullscreen);
fullBtn.style.display = canFull ? '' : 'none';
fullBtn.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      await (root.requestFullscreen || root.webkitRequestFullscreen).call(root, { navigationUI: 'hide' });
      await screen.orientation?.lock?.('landscape').catch(() => {});
    }
  } catch (_) { /* refused: stay in the page */ }
  setTimeout(fit, 200);
});
document.getElementById('t-music').addEventListener('click', () => {
  const box = document.getElementById('music');
  box.checked = !box.checked;
  sound.musicEnabled = box.checked;
  document.getElementById('t-music').classList.toggle('off', !box.checked);
});
document.addEventListener('contextmenu', (e) => { if (document.body.classList.contains('touch')) e.preventDefault(); });

window.addEventListener('keydown', (e) => {
  const bit = KEYS[e.code];
  sound.start();
  if (bit) {
    keyBits |= bit;
    latched |= bit;
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  const bit = KEYS[e.code];
  if (bit) {
    keyBits &= ~bit;
    e.preventDefault();
  }
});
window.addEventListener('blur', () => { keyBits = 0; });
window.addEventListener('pointerdown', () => sound.start());

document.getElementById('crt').addEventListener('change', (e) => frame.classList.toggle('crt', e.target.checked));
document.getElementById('sound').addEventListener('change', (e) => { sound.enabled = e.target.checked; });
const musicBox = document.getElementById('music');
musicBox.addEventListener('change', (e) => { sound.musicEnabled = e.target.checked; });
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' && !e.repeat) {
    musicBox.checked = !musicBox.checked;
    sound.musicEnabled = musicBox.checked;
  }
});

function gamepadBits() {
  let bits = 0;
  const pads = navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean) : [];
  pads.slice(0, 2).forEach((pad, i) => {
    const shift = i * 4;
    const b = (n) => pad.buttons[n]?.pressed;
    const ax = pad.axes[0] ?? 0;
    if (b(0) || b(7) || b(12)) bits |= P1_UP << shift;
    if (b(1) || b(2) || b(6) || b(13)) bits |= P1_DOWN << shift;
    if (b(14) || ax < -0.35) bits |= P1_LEFT << shift;
    if (b(15) || ax > 0.35) bits |= P1_RIGHT << shift;
    if (b(9)) bits |= START;
    if (b(8)) bits |= BACK;
    if (bits) sound.start();
  });
  return bits;
}

async function loadWasm(url) {
  if (WebAssembly.instantiateStreaming) {
    try {
      return await WebAssembly.instantiateStreaming(fetch(url), {});
    } catch (_) { /* wrong MIME type on some static servers: fall back */ }
  }
  const bytes = await (await fetch(url)).arrayBuffer();
  return WebAssembly.instantiate(bytes, {});
}

// The game converts its indexed framebuffer to RGBA itself; the image wraps that buffer in
// the wasm memory (rebuilt only if the memory grows or the buffer moves).
let image = null, imageMem = null, imagePtr = 0;
function present(ex) {
  const ptr = ex.rgba();
  if (ex.memory.buffer !== imageMem || ptr !== imagePtr) {
    imageMem = ex.memory.buffer;
    imagePtr = ptr;
    image = new ImageData(new Uint8ClampedArray(imageMem, ptr, W * H * 4), W, H);
  }
  ctx2d.putImageData(image, 0, 0);
}

// In the menus the pedals become arrows: the upper one moves up, the lower one down.
function touchBits(ex) {
  let t = touch.take();
  if (inMenu) {
    const up = t & P1_UP, down = t & P1_DOWN;
    t = (t & ~(P1_UP | P1_DOWN)) | (up ? P1_DOWN : 0) | (down ? P1_UP : 0);
  }
  return t;
}
let inMenu = true;

async function main() {
  const { instance } = await loadWasm('game.wasm');
  const ex = instance.exports;
  if (new URLSearchParams(location.search).has('debug')) window.game = ex; // test drivers
  ex.init((Math.random() * 0xffffffff) >>> 0);

  // demo mode: ?demo&players=2&course=1 lets the CPU drive (attract mode / video capture)
  const params = new URLSearchParams(location.search);
  if (params.has('autopilot')) ex.set_autopilot(3);
  // weather: ?weather=0 clear, 1 rain, 2 snow (default: each course's own)
  if (params.has('weather')) ex.set_weather(Number(params.get('weather'))); // normal menus, but the CPU drives
  // test bench: ?bench&course=1 (alone on the course, endless laps), add &autopilot to watch
  if (params.has('bench')) {
    ex.bench_race(Number(params.get('players') ?? 1), Number(params.get('course') ?? 0));
  } else if (params.has('demo')) {
    ex.set_autopilot(3);
    ex.quick_race(Number(params.get('players') ?? 1), Number(params.get('course') ?? 0), 0);
  }

  let last = performance.now();
  let acc = 0;
  function loop(now) {
    acc += Math.min(now - last, 250);
    last = now;
    const pads = gamepadBits();
    let stepped = false;
    while (acc >= STEP) {
      ex.tick(keyBits | latched | pads | touchBits(ex));
      latched = 0;
      acc -= STEP;
      stepped = true;
    }
    // nothing moved since the last frame (screens refreshing faster than 60 Hz): the
    // picture on the canvas is still the right one
    if (stepped || !image) {
      ex.render();
      present(ex);
    }
    const menu = ex.screen_id() !== 1;
    if (menu !== inMenu) { inMenu = menu; document.body.classList.toggle('menu', menu); }
    sound.update(ex);
    audioHint.classList.toggle('on', sound.running);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

main().catch((err) => {
  const el = document.getElementById('error');
  el.style.display = 'block';
  el.textContent = `Impossible de charger game.wasm (${err}). Servez le dossier web/ via HTTP, ex. : python3 -m http.server -d web`;
  console.error(err);
});

// installable and playable offline (see sw.js); not over file://
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => console.warn('service worker:', err));
  });
}

// "Install" buttons, shown when the browser offers to install the game (Android Chrome,
// desktop Chrome/Edge): the game then gets its own icon and opens full screen, offline
let installPrompt = null;
const installButtons = [document.getElementById('t-install'), document.getElementById('install')];
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  installButtons.forEach((b) => { if (b) b.style.display = ''; });
});
installButtons.forEach((b) => b?.addEventListener('click', async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice.catch(() => {});
  installPrompt = null;
  installButtons.forEach((x) => { if (x) x.style.display = 'none'; });
}));
window.addEventListener('appinstalled', () => installButtons.forEach((b) => { if (b) b.style.display = 'none'; }));
