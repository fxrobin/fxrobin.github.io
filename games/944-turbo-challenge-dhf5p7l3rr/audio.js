// Synthesised sound, no samples: a 4-cylinder turbo engine per player (engine-worklet.js), tyre squeal, event
// blips and a small chiptune loop for the menus. Everything is built from WebAudio nodes.

const EV_BEEP = 1, EV_GO = 2, EV_CRASH = 4, EV_BUMP = 8, EV_LAP = 16, EV_FINISH = 32, EV_BACKFIRE = 64, EV_MENU = 256;
const SCREEN_RACE = 1, SCREEN_GAME_OVER = 3;

// --- menu music: 4 bars of 16 steps (MIDI notes, 0 = rest) ------------------------------
const BPM = 132;
const STEP = 60 / BPM / 4;
const BARS = [
  { bass: 45, lead: [69, 0, 72, 0, 76, 0, 72, 0, 69, 0, 72, 76, 0, 72, 69, 0] },
  { bass: 41, lead: [69, 0, 72, 0, 77, 0, 72, 0, 69, 0, 72, 77, 0, 72, 69, 0] },
  { bass: 48, lead: [67, 0, 72, 0, 76, 0, 72, 0, 67, 0, 72, 76, 0, 79, 76, 0] },
  { bass: 43, lead: [67, 0, 71, 0, 74, 0, 79, 0, 78, 0, 74, 0, 71, 0, 74, 0] },
];
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

export class Sound {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicStep = 0;
    this.musicTime = 0;
    this.musicOn = false;
  }

  get running() {
    return !!this.ctx && this.ctx.state === 'running';
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  start() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());
    // master bus with a compressor so the mix is loud without clipping
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.ratio.value = 6;
    this.master.connect(comp).connect(ctx.destination);
    this.music = ctx.createGain();
    this.music.gain.value = 0.8;
    this.music.connect(this.master);
    this.noise = this.makeNoise();
    this.engines = [];
    // the engine is a sample-accurate AudioWorklet; old browsers get the oscillator version
    const ready = ctx.audioWorklet ? ctx.audioWorklet.addModule('engine-worklet.js') : Promise.reject(new Error('no AudioWorklet'));
    ready
      .then(() => true, (err) => { console.warn('engine worklet unavailable, using oscillators:', err); return false; })
      .then((worklet) => { this.engines = [0, 1].map(() => this.makeEngine(worklet)); });
  }

  makeNoise() {
    const ctx = this.ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  makeEngine(worklet) {
    const ctx = this.ctx;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    pan.connect(this.master);

    // tyre squeal: band-passed noise
    const squeal = ctx.createBufferSource();
    squeal.buffer = this.noise;
    squeal.loop = true;
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = 1900;
    band.Q.value = 5;
    const skid = ctx.createGain();
    skid.gain.value = 0;
    squeal.connect(band).connect(skid).connect(pan);
    squeal.start();

    if (worklet) {
      const node = new AudioWorkletNode(ctx, 'engine944', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] });
      node.connect(pan);
      const p = (name) => node.parameters.get(name);
      return {
        pan,
        skid,
        set(t, on, rpm, thr, boost) {
          p('level').setTargetAtTime(on ? 0.55 : 0, t, 0.05);
          if (!on) return;
          p('rpm').setTargetAtTime(rpm, t, 0.015);
          p('throttle').setTargetAtTime(thr, t, 0.02);
          p('boost').setTargetAtTime(boost, t, 0.03);
        },
      };
    }
    return this.makeOscillatorEngine(pan, skid);
  }

  /** Fallback when AudioWorklet is missing: detuned oscillators, whistle and blow-off burst. */
  makeOscillatorEngine(pan, skid) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 3;
    const shaper = ctx.createWaveShaper();
    shaper.curve = Float32Array.from({ length: 1024 }, (_, i) => Math.tanh((i / 512 - 1) * 2.5));
    const voices = [['sawtooth', 1, 0.6], ['sawtooth', 2.01, 0.35], ['square', 0.5, 0.45]].map(([type, ratio, gain]) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      const g = ctx.createGain();
      g.gain.value = gain;
      osc.connect(g).connect(shaper);
      osc.start();
      return { osc, ratio };
    });
    shaper.connect(filter).connect(out).connect(pan);
    const whistle = ctx.createOscillator();
    whistle.type = 'sine';
    const whistleGain = ctx.createGain();
    whistleGain.gain.value = 0;
    whistle.connect(whistleGain).connect(pan);
    whistle.start();
    const sound = this;
    let lastThr = 0;
    let lastBoost = 0;
    return {
      pan,
      skid,
      set(t, on, rpm, thr, boost) {
        out.gain.setTargetAtTime(on ? 0.22 + thr * 0.2 : 0, t, 0.05);
        whistleGain.gain.setTargetAtTime(on ? boost * boost * 0.035 : 0, t, 0.05);
        if (!on) return;
        const f = (rpm / 60) * 2;
        for (const v of voices) v.osc.frequency.setTargetAtTime(f * v.ratio, t, 0.03);
        filter.frequency.setTargetAtTime(500 + thr * 1800 + rpm * 0.35, t, 0.05);
        whistle.frequency.setTargetAtTime(2200 + boost * 2600, t, 0.05);
        if (lastThr > 0.5 && thr < 0.5 && lastBoost > 0.5) sound.burst(0.28, 0.2, 'highpass', 3500, 1500, pan);
        lastThr = thr;
        lastBoost = boost;
      },
    };
  }

  /** Called once per rendered frame with the wasm exports. */
  update(ex) {
    const events = ex.take_events();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.enabled ? 0.9 : 0, t, 0.02);
    const n = ex.active_players();
    this.engines.forEach((e, i) => {
      const on = i < n;
      e.skid.gain.setTargetAtTime(on ? ex.engine_skid(i) * 0.3 : 0, t, 0.05);
      e.set(t, on, ex.engine_rpm(i), ex.engine_throttle(i), ex.engine_boost(i));
      if (on && 'pan' in e.pan) e.pan.pan.value = n === 2 ? (i === 0 ? -0.6 : 0.6) : 0;
    });
    if (events & EV_BEEP) this.blip(440, 0.18, 0.3);
    if (events & EV_GO) this.blip(880, 0.6, 0.3);
    if (events & EV_LAP) { this.blip(660, 0.1, 0.2); this.blip(990, 0.18, 0.2, 0.12); }
    if (events & EV_FINISH) [523, 659, 784, 1046].forEach((f, k) => this.blip(f, 0.2, 0.22, k * 0.15));
    if (events & EV_CRASH) this.burst(0.7, 0.9, 'lowpass', 2500, 120);
    if (events & EV_BACKFIRE) this.backfire();
    if (events & EV_BUMP) this.burst(0.18, 0.5, 'lowpass', 1200, 150);
    if (events & EV_MENU) this.blip(1200, 0.05, 0.12);
    this.updateMusic(ex.screen_id());
  }

  // --- one-shots -----------------------------------------------------------------

  blip(freq, dur, vol, delay = 0, type = 'square', dest = this.master) {
    const ctx = this.ctx;
    const t = Math.max(ctx.currentTime, 0) + delay;
    this.note(freq, t, dur, vol, type, dest);
  }

  note(freq, t, dur, vol, type, dest) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** Exhaust backfire on an upshift: a dull bang followed by two crackles. */
  backfire() {
    const t = this.ctx.currentTime;
    this.burst(0.14, 0.9, 'lowpass', 1600, 90, this.master, t);
    this.kickAt(t, 110, 40, 0.5, this.master);
    this.burst(0.05, 0.4, 'bandpass', 2600, 1800, this.master, t + 0.06);
    this.burst(0.04, 0.3, 'bandpass', 3200, 2200, this.master, t + 0.11);
  }

  kickAt(t, from, to, vol, dest) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + 0.1);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + 0.15);
  }

  /** Filtered noise burst (crash, bump, blow-off, drums). */
  burst(dur, vol, type, from, to, dest = this.master, t = this.ctx.currentTime) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(from, t);
    f.frequency.exponentialRampToValueAtTime(to, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  // --- music -----------------------------------------------------------------------

  updateMusic(screen) {
    const wanted = screen !== SCREEN_RACE && screen !== SCREEN_GAME_OVER;
    const now = this.ctx.currentTime;
    if (wanted && !this.musicOn) {
      this.musicStep = 0;
      this.musicTime = now + 0.05;
    }
    this.musicOn = wanted;
    this.music.gain.setTargetAtTime(wanted ? 0.8 : 0, now, 0.08);
    if (!wanted) return;
    if (this.musicTime < now) this.musicTime = now; // tab was in the background
    while (this.musicTime < now + 0.2) {
      this.playStep(this.musicStep, this.musicTime);
      this.musicStep = (this.musicStep + 1) % (BARS.length * 16);
      this.musicTime += STEP;
    }
  }

  playStep(step, t) {
    const bar = BARS[step >> 4];
    const s = step & 15;
    const lead = bar.lead[s];
    if (lead) this.note(hz(lead), t, STEP * 1.8, 0.24, 'square', this.music);
    if (s % 2 === 0) this.note(hz(bar.bass - (s % 4 === 2 ? 0 : 12) + 12), t, STEP * 1.6, 0.45, 'triangle', this.music);
    if (s % 8 === 0) this.kick(t);
    if (s % 8 === 4) this.burst(0.12, 0.3, 'highpass', 1800, 1200, this.music, t);
    else if (s % 2 === 0) this.burst(0.03, 0.12, 'highpass', 7000, 6000, this.music, t);
  }

  kick(t) {
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.6, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
    o.connect(g).connect(this.music);
    o.start(t);
    o.stop(t + 0.2);
  }
}
