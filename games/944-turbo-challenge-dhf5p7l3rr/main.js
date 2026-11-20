// Host for the WebAssembly game: fixed 60 Hz simulation, palette conversion, input, sound.
import { Sound } from './audio.js';

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
const image = ctx2d.createImageData(W, H);
const pixels = new Uint32Array(image.data.buffer);
const sound = new Sound();
const audioHint = document.getElementById('audiohint');

let keyBits = 0;
// keys pressed since the last simulation step, so very short taps are never lost
let latched = 0;

function fit() {
  // 640x480, square pixels; integer zoom when the window is large enough
  const maxW = window.innerWidth - 24;
  const maxH = window.innerHeight - 70;
  let w = Math.min(maxW, (maxH * 4) / 3);
  if (w >= 1280) w = Math.floor(w / 640) * 640;
  frame.style.width = `${Math.floor(w)}px`;
  frame.style.height = `${Math.floor((w * 3) / 4)}px`;
}
window.addEventListener('resize', fit);
fit();

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

function present(ex) {
  const mem = ex.memory.buffer;
  const fb = new Uint8Array(mem, ex.framebuffer(), W * H);
  const pal = new Uint32Array(mem, ex.palette(), 32);
  for (let i = 0; i < W * H; i++) pixels[i] = pal[fb[i] & 31];
  ctx2d.putImageData(image, 0, 0);
}

async function main() {
  const { instance } = await loadWasm('game.wasm');
  const ex = instance.exports;
  ex.init((Math.random() * 0xffffffff) >>> 0);

  // demo mode: ?demo&players=2&course=1 lets the CPU drive (attract mode / video capture)
  const params = new URLSearchParams(location.search);
  if (params.has('autopilot')) ex.set_autopilot(3); // normal menus, but the CPU drives
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
    while (acc >= STEP) {
      ex.tick(keyBits | latched | pads);
      latched = 0;
      acc -= STEP;
    }
    ex.render();
    present(ex);
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
