// Sound: a synthesised 4-cylinder turbo engine per player (engine-worklet.js), tyre squeal, wind,
// event blips, all built from WebAudio nodes; and one recorded music track, looped:
// "Neon Sign Circuit" by MintoDog (OpenGameArt, CC0), 145 BPM, 60 bars.

const EV_BEEP = 1, EV_GO = 2, EV_CRASH = 4, EV_BUMP = 8, EV_LAP = 16, EV_FINISH = 32, EV_BACKFIRE = 64, EV_MENU = 256;
const SCREEN_RACE = 1, SCREEN_GAME_OVER = 3;
/// Squeal gain at full slip: light, a hint of the tyres at the limit rather than a screech.
const SQUEAL_LEVEL = 1.2;
/// Whoosh gain for an object just past the kerb at full speed.
const WHOOSH_LEVEL = 5.0;

// --- music ---------------------------------------------------------------------------------
const MUSIC = ['music/neon-sign-circuit.ogg', 'music/neon-sign-circuit.mp3'];
/// The loop is exactly 60 bars at 145 BPM; looping on it also skips MP3 encoder padding.
const MUSIC_LOOP = (60 * 4 * 60) / 145;
/// Music level per screen (see App::screen_id): quieter in a race so the engine leads.
const MUSIC_LEVEL = { 0: 0.75, 1: 0.45, 2: 0.7, 3: 0.55, 4: 0.8, 5: 0.2 };

export class Sound {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.musicSource = null;
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
    // the track is already mastered: it bypasses the compressor so the engine cannot pump it
    this.music = ctx.createGain();
    this.music.gain.value = 0;
    this.music.connect(ctx.destination);
    this.loadMusic();
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

  /**
   * Light tyre squeal: noise through two narrow resonances (the tyre's "voice" and an
   * overtone) whose pitch wavers a little, like rubber skipping on tarmac. Returns the gain
   * that the game's slip value drives.
   */
  makeSqueal(dest) {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    const skid = ctx.createGain();
    skid.gain.value = 0;
    const wobble = ctx.createOscillator();
    wobble.frequency.value = 6.5;
    for (const [freq, q, level] of [[1750, 9, 1.0], [2650, 11, 0.55]]) {
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = freq;
      band.Q.value = q;
      const depth = ctx.createGain();
      depth.gain.value = freq * 0.035;
      wobble.connect(depth).connect(band.frequency);
      const g = ctx.createGain();
      g.gain.value = level;
      src.connect(band).connect(g).connect(skid);
    }
    skid.connect(dest);
    wobble.start();
    src.start();
    return skid;
  }

  makeEngine(worklet) {
    const ctx = this.ctx;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    pan.connect(this.master);

    const skid = this.makeSqueal(pan);

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
    // always drain the wind cues, even muted, so none pile up
    const whooshes = [];
    for (let w = ex.take_whoosh(); w !== 0; w = ex.take_whoosh()) whooshes.push(w);
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(this.enabled ? 0.9 : 0, t, 0.02);
    const n = ex.active_players();
    this.engines.forEach((e, i) => {
      const on = i < n;
      e.skid.gain.setTargetAtTime(on ? ex.engine_skid(i) * SQUEAL_LEVEL : 0, t, 0.06);
      e.set(t, on, ex.engine_rpm(i), ex.engine_throttle(i), ex.engine_boost(i));
      if (on && 'pan' in e.pan) e.pan.pan.value = n === 2 ? (i === 0 ? -0.6 : 0.6) : 0;
    });
    if (this.enabled) {
      for (const w of whooshes) {
        const player = w >>> 16;
        const pan = ((w >>> 8) & 255) / 127.5 - 1;
        const gain = (w & 255) / 255;
        // split screen: player 1 on the left, player 2 on the right
        const offset = n === 2 ? (player === 0 ? -0.5 : 0.5) : 0;
        this.whoosh(Math.max(-1, Math.min(1, pan * (n === 2 ? 0.5 : 1) + offset)), gain);
      }
    }
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

  /**
   * Wind of a tree or a sign brushed past along the verge: a soft "fwoosh" of air rather than
   * a hit. Low-passed noise swells in over 0.16 s and dies away smoothly, its brightness
   * falling as the object goes by (a hint of Doppler), swinging towards the object's side.
   */
  whoosh(pan, gain) {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const rise = 0.16;
    const dur = 0.6;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const low = ctx.createBiquadFilter();
    low.type = 'lowpass';
    low.Q.value = 0.6;
    low.frequency.setValueAtTime(1400 + gain * 1400, t);
    low.frequency.exponentialRampToValueAtTime(450, t + dur);
    const high = ctx.createBiquadFilter();
    high.type = 'highpass';
    high.frequency.value = 160;
    const g = ctx.createGain();
    const vol = WHOOSH_LEVEL * (0.2 + 0.8 * gain);
    // no click: start from silence, swell linearly, then an exponential tail
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + rise);
    g.gain.setTargetAtTime(0, t + rise, 0.12);
    let out = g;
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.setValueAtTime(pan * 0.2, t);
      p.pan.linearRampToValueAtTime(pan, t + rise + 0.1);
      g.connect(p);
      out = p;
    }
    src.connect(high).connect(low).connect(g);
    out.connect(this.master);
    src.start(t, Math.random() * 0.3);
    src.stop(t + dur + 0.1);
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

  /** Decode the track (Ogg Vorbis first, MP3 for browsers without Vorbis) and start the loop. */
  async loadMusic() {
    for (const url of MUSIC) {
      try {
        const data = await (await fetch(url)).arrayBuffer();
        const buffer = await this.ctx.decodeAudioData(data);
        const src = this.ctx.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        src.loopStart = 0;
        src.loopEnd = Math.min(MUSIC_LOOP, buffer.duration);
        src.connect(this.music);
        src.start();
        this.musicSource = src;
        return;
      } catch (err) {
        console.warn(`music: ${url} unavailable (${err})`);
      }
    }
  }

  updateMusic(screen) {
    const on = this.enabled && this.musicEnabled && this.musicSource;
    const level = on ? MUSIC_LEVEL[screen] ?? 0.6 : 0;
    this.music.gain.setTargetAtTime(level, this.ctx.currentTime, 0.25);
  }
}
