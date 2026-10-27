// TOJE dans le navigateur : boucle, image, son et entrées autour du wasm (WebMain).
//
// Pacing : le son est l'horloge maître, comme sur le pilote desktop. Tant que
// moins de AUDIO_LEAD secondes d'audio sont programmées, on exécute une trame
// (20 ms émulées, 882 échantillons). Sans son — le navigateur exige un geste
// de l'utilisateur pour ouvrir l'AudioContext — on se cale sur performance.now().
import { createTouchPad } from './touch-pad.js';
import { buildKeyboard } from './to8-keyboard.js';

const FRAME_SECONDS = 0.02;
const AUDIO_LEAD = 0.08;          // ~4 trames d'avance : assez pour absorber un rAF en retard
const MAX_FRAMES_PER_TICK = 8;    // onglet revenu au premier plan : on ne rattrape pas tout
const JOY = { left: 1, right: 2, up: 4, down: 8 };   // IoHandler.JOYSTICK_*

const $ = id => document.getElementById(id);
const canvas = $('screen');
const ctx2d = canvas.getContext('2d');
const status = $('status');
const coarsePointer = matchMedia('(pointer: coarse)').matches;

// Réglages de confort du visiteur, dans son navigateur seulement.
const prefs = {
  get(key, fallback) {
    try { const v = localStorage.getItem(`toje.${key}`); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(`toje.${key}`, JSON.stringify(value)); } catch { /* stockage indisponible */ }
  },
};

async function loadEmulator() {
  try {
    const teavm = await TeaVM.wasmGC.load('toje.wasm');
    teavm.exports.main([]);
    return teavm.exports;
  } catch (e) {
    // Deux causes courantes, à distinguer : fichiers absents (page ouverte en
    // file://, wasm non construit) ou navigateur trop ancien pour Wasm GC.
    const noGc = typeof WebAssembly === 'undefined' || e instanceof WebAssembly.CompileError;
    status.textContent = noGc
      ? 'navigateur sans WebAssembly GC (Chrome 119+, Firefox 120+, Safari 18.2+)'
      : `échec du chargement : ${e.message || e}`;
    console.error(e);
    return null;
  }
}

const toje = await loadEmulator();
if (toje) start(toje);

function start(toje) {
  const width = toje.screenWidth();
  const height = toje.screenHeight();
  const sampleRate = toje.sampleRate();
  canvas.width = width;
  canvas.height = height;
  const image = ctx2d.createImageData(width, height);

  // ── Son ────────────────────────────────────────────────────────────────
  let audio = null;      // { ctx, gain, next }
  let soundOn = true;

  function openAudio() {
    if (audio || !soundOn) return;
    // Le contexte tourne au taux du TO8 émulé (44,1 kHz) : sans cela, un
    // téléphone à 48 kHz doit rééchantillonner chaque tampon, et un navigateur
    // qui s'en dispense jouerait la musique 9 % trop aiguë et trop vite.
    let ctx;
    try { ctx = new AudioContext({ sampleRate, latencyHint: 'interactive' }); }
    catch { ctx = new AudioContext(); }   // navigateur qui refuse ce taux : il rééchantillonne
    const gain = ctx.createGain();
    gain.gain.value = 0.8;
    gain.connect(ctx.destination);
    audio = { ctx, gain, next: 0 };
    ctx.resume();
  }

  function audioRunning() {
    return audio !== null && audio.ctx.state === 'running' && soundOn;
  }

  function queueAudio(samples) {
    const { ctx, gain } = audio;
    const buffer = ctx.createBuffer(1, samples.length, sampleRate);
    buffer.copyToChannel(samples, 0);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(gain);
    // Sous-alimentation (onglet masqué, machine lente) : on repart un peu devant,
    // plutôt que de programmer dans le passé.
    if (audio.next < ctx.currentTime) {
      audio.next = ctx.currentTime + 0.03;
      stats.underruns++;
    }
    src.start(audio.next);
    audio.next += buffer.duration;
  }

  // ── Boucle ─────────────────────────────────────────────────────────────
  let wallDue = 0;
  let wallLast = performance.now();
  let framesThisSecond = 0;
  let fpsStamp = performance.now();

  // Diagnostic de cadence, lisible depuis la console ou une recette Playwright :
  // trames émulées, coupures du son (file audio vidée), plus grosse rafale.
  const stats = { frames: 0, underruns: 0, maxBurst: 0, start: performance.now() };
  window.tojeStats = stats;

  function step() {
    toje.runFrame();
    if (audioRunning()) queueAudio(toje.audio());
    framesThisSecond++;
    stats.frames++;
  }

  function framesDue(now) {
    if (audioRunning()) {
      const ahead = audio.next - audio.ctx.currentTime;
      return Math.max(0, Math.ceil((AUDIO_LEAD - ahead) / FRAME_SECONDS));
    }
    wallDue = Math.min(wallDue + (now - wallLast) / 1000 / FRAME_SECONDS, MAX_FRAMES_PER_TICK);
    return Math.floor(wallDue);
  }

  function present() {
    image.data.set(new Uint8ClampedArray(toje.pixels().buffer));
    ctx2d.putImageData(image, 0, 0);
    updateCapsLed();
  }

  // Voyant CAPS LOCK du clavier à l'écran : l'état du 6804, pas celui du clavier du PC.
  function updateCapsLed() {
    if (!keyboardOn) return;
    const on = toje.capsLock();
    if (on === capsShown) return;
    capsShown = on;
    keyboard.setCapsLock(on);
  }

  // Vitesse moyennée sur 5 s : compter une seule seconde tombe sur 49 ou 51
  // trames selon la phase, et l'affichage oscillait entre 98 et 102 % pour
  // une cadence exacte.
  const SPEED_WINDOW = 5;
  const perSecond = [];
  function updateStatus(now) {
    if (now - fpsStamp < 1000) return;
    perSecond.push({ frames: framesThisSecond, ms: now - fpsStamp });
    if (perSecond.length > SPEED_WINDOW) perSecond.shift();
    const frames = perSecond.reduce((sum, s) => sum + s.frames, 0);
    const seconds = perSecond.reduce((sum, s) => sum + s.ms, 0) / 1000;
    const speed = Math.round(frames / seconds * 2);   // 50 trames/s = 100 %
    status.textContent = `${speed} %${audioRunning() ? '' : ' · muet'}`;
    framesThisSecond = 0;
    fpsStamp = now;
  }

  function tick(now) {
    pollJoystick();
    const n = Math.min(framesDue(now), MAX_FRAMES_PER_TICK);
    wallLast = now;
    stats.maxBurst = Math.max(stats.maxBurst, n);
    for (let i = 0; i < n; i++) {
      step();
      wallDue = Math.max(0, wallDue - 1);
    }
    if (n > 0) present();
    updateStatus(now);
    requestAnimationFrame(tick);
  }

  // Le navigateur n'ouvre le son qu'après un geste : n'importe lequel suffit.
  const startHint = $('start');
  startHint.hidden = false;
  function firstGesture() {
    startHint.hidden = true;
    openAudio();
    keepScreenAwake();
  }
  document.addEventListener('pointerdown', firstGesture, { capture: true });
  startHint.addEventListener('click', () => canvas.focus());

  // Un téléphone qui se met en veille au milieu d'une partie : on l'en empêche.
  let wakeLock = null;
  async function keepScreenAwake() {
    if (wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch { /* refusé (batterie faible, réglage) : sans conséquence */ }
  }
  document.addEventListener('visibilitychange', () => { if (audio) keepScreenAwake(); });

  // ── Disquette ──────────────────────────────────────────────────────────
  async function insertDisk(file) {
    const bytes = new Int8Array(await file.arrayBuffer());
    toje.insertDisk(bytes, file.name);
    $('disk-name').textContent = file.name;
    firstGesture();
    canvas.focus();
  }

  $('disk-input').addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) insertDisk(file);
    e.target.value = '';
  });

  const frame = $('screen-frame');
  const hint = $('drop-hint');
  frame.addEventListener('dragover', e => { e.preventDefault(); hint.hidden = false; });
  frame.addEventListener('dragleave', () => { hint.hidden = true; });
  frame.addEventListener('drop', e => {
    e.preventDefault();
    hint.hidden = true;
    const file = e.dataTransfer.files[0];
    if (file) insertDisk(file);
  });

  // ── Boutons ────────────────────────────────────────────────────────────
  function setPressed(button, on) {
    button.setAttribute('aria-pressed', String(on));
  }

  $('reset').addEventListener('click', () => { toje.reset(); canvas.focus(); });

  $('sound').addEventListener('click', e => {
    soundOn = !soundOn;
    setPressed(e.currentTarget, soundOn);
    if (soundOn) openAudio();
    if (audio) soundOn ? audio.ctx.resume() : audio.ctx.suspend();
  });

  // Plein écran : l'écran seul au bureau ; toute la page (manette, clavier)
  // dès que les commandes tactiles sont affichées, en paysage si possible.
  $('fullscreen').addEventListener('click', async () => {
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    const target = touchOn || keyboardOn ? document.documentElement : frame;
    try {
      await target.requestFullscreen({ navigationUI: 'hide' });
      if (touchOn && screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock('landscape').catch(() => {});
      }
    } catch { /* iPhone : pas d'API plein écran hors vidéo — « Sur l'écran d'accueil » à la place */ }
    canvas.focus();
  });

  // ── Manette tactile et clavier à l'écran ──────────────────────────────
  const touchPad = createTouchPad($('stick'), $('fire'), JOY);
  let touchOn = false;
  function setTouch(on) {
    touchOn = on;
    $('stick').hidden = !on;
    $('fire').hidden = !on;
    document.body.classList.toggle('touch', on);
    setPressed($('touch-mode'), on);
    if (!on) touchPad.reset();
    prefs.set('touch', on);
  }
  $('touch-mode').addEventListener('click', () => setTouch(!touchOn));

  let keyboardOn = false;
  let keyboard = null;     // { setCapsLock } une fois dessiné
  let capsShown = null;
  function setKeyboard(on) {
    if (on && !keyboard) {
      keyboard = buildKeyboard($('keyboard'), toje, (sc, down) => toje.pressKey(sc, down));
      capsShown = null;
    }
    keyboardOn = on;
    $('keyboard').hidden = !on;
    document.body.classList.toggle('kb', on);
    setPressed($('kb-mode'), on);
    prefs.set('keyboard', on);
  }
  $('kb-mode').addEventListener('click', () => setKeyboard(!keyboardOn));

  // ── Clavier du PC et manettes ─────────────────────────────────────────
  let keyboardJoystick = true;
  const keyJoy = { dirs: 0, a: false, b: false };
  $('joy-mode').addEventListener('click', e => {
    keyboardJoystick = !keyboardJoystick;
    setPressed(e.currentTarget, keyboardJoystick);
    keyJoy.dirs = 0; keyJoy.a = false; keyJoy.b = false;
    canvas.focus();
  });

  let joyPort = 0;
  function setPort(port) {
    toje.joystick(joyPort, 0, false, false);   // relâche l'ancien port
    joyPort = port;
    for (const o of document.querySelectorAll('.seg-btn')) setPressed(o, Number(o.dataset.port) === port);
    prefs.set('port', port);
  }
  for (const b of document.querySelectorAll('.seg-btn')) {
    b.addEventListener('click', () => { setPort(Number(b.dataset.port)); canvas.focus(); });
  }

  const JOY_KEYS = {
    ArrowLeft: JOY.left, ArrowRight: JOY.right, ArrowUp: JOY.up, ArrowDown: JOY.down,
  };

  function joystickKey(code, down) {
    if (!keyboardJoystick) return false;
    if (code in JOY_KEYS) {
      keyJoy.dirs = down ? keyJoy.dirs | JOY_KEYS[code] : keyJoy.dirs & ~JOY_KEYS[code];
    } else if (code === 'Space') {
      keyJoy.a = down;
    } else if (code === 'AltLeft' || code === 'AltRight') {
      keyJoy.b = down;
    } else {
      return false;
    }
    return true;
  }

  function onKey(e, down) {
    if (e.ctrlKey && e.code === 'KeyR') return;     // laisse recharger la page
    if (e.target instanceof HTMLInputElement) return;
    firstGesture();
    if (e.repeat) { e.preventDefault(); return; }    // le 6804 répète lui-même
    if (joystickKey(e.code, down) || toje.key(e.code, down)) e.preventDefault();
  }
  window.addEventListener('keydown', e => onKey(e, true));
  window.addEventListener('keyup', e => onKey(e, false));
  window.addEventListener('blur', () => {
    keyJoy.dirs = 0; keyJoy.a = false; keyJoy.b = false;
    touchPad.reset();
  });

  function gamepadState() {
    const pad = navigator.getGamepads ? [...navigator.getGamepads()].find(p => p) : null;
    if (!pad) return { dirs: 0, a: false, b: false };
    const ax = pad.axes[0] || 0;
    const ay = pad.axes[1] || 0;
    const btn = i => Boolean(pad.buttons[i] && pad.buttons[i].pressed);
    let dirs = 0;
    if (ax < -0.5 || btn(14)) dirs |= JOY.left;
    else if (ax > 0.5 || btn(15)) dirs |= JOY.right;
    if (ay < -0.5 || btn(12)) dirs |= JOY.up;
    else if (ay > 0.5 || btn(13)) dirs |= JOY.down;
    return { dirs, a: btn(0) || btn(2), b: btn(1) || btn(3) };
  }

  // Trois sources pour une seule manette TO8 : clavier du PC, manette USB, écran tactile.
  let lastJoy = '';
  function pollJoystick() {
    const pad = gamepadState();
    const touch = touchPad.state();
    const dirs = keyJoy.dirs | pad.dirs | touch.dirs;
    const a = keyJoy.a || pad.a || touch.a;
    const b = keyJoy.b || pad.b || touch.b;
    const state = `${dirs}${a}${b}`;
    if (state === lastJoy) return;
    lastJoy = state;
    toje.joystick(joyPort, dirs, a, b);
  }

  setTouch(prefs.get('touch', coarsePointer));
  setKeyboard(prefs.get('keyboard', false));
  setPort(prefs.get('port', 0));
  status.textContent = 'prêt';
  canvas.focus();
  requestAnimationFrame(tick);
}
