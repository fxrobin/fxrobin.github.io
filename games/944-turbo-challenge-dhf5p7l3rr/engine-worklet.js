// Inline 4-cylinder turbo engine, synthesised sample by sample.
//
// Model: an even-firing 4-cylinder fires twice per crank revolution (every 180 degrees).
// Each firing is a short noisy pressure pulse whose strength depends on the load (throttle)
// and varies slightly from cylinder to cylinder: that unevenness, repeating every two
// revolutions, is what gives a four-pot its gruff, slightly lumpy note. The pulse train goes
// through the resonances of the exhaust (one that tracks the firing frequency, one fixed pipe
// resonance) and a muffler low-pass that opens with the throttle. Induction roar is added on
// load. The turbo only spools above 2800 rpm (driven by the game's `boost`): a whistle whose
// pitch follows the shaft speed, an airy whoosh, and a blow-off "pschh" when lifting off.

const TAU = Math.PI * 2;

class Biquad {
  constructor() {
    this.b0 = 1; this.b1 = 0; this.b2 = 0; this.a1 = 0; this.a2 = 0;
    this.x1 = 0; this.x2 = 0; this.y1 = 0; this.y2 = 0;
  }

  /** RBJ cookbook coefficients. */
  set(type, freq, q, sr) {
    const w = (TAU * Math.min(freq, sr * 0.45)) / sr;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (type === 'lowpass') {
      b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0;
    } else if (type === 'highpass') {
      b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0;
    } else { // band-pass, 0 dB peak
      b0 = alpha; b1 = 0; b2 = -alpha;
    }
    const a0 = 1 + alpha;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0; this.a2 = (1 - alpha) / a0;
  }

  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

// cylinder-to-cylinder spread of the combustion strength
const CYLINDERS = [1.0, 0.84, 0.95, 0.89];

class Engine944 extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'rpm', defaultValue: 900, minValue: 0, maxValue: 9000, automationRate: 'k-rate' },
      { name: 'throttle', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'boost', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
      { name: 'level', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'k-rate' },
    ];
  }

  constructor() {
    super();
    this.phase = 0;        // position between two firings, 0..1
    this.cyl = 0;
    this.pulse = 0;        // envelope of the current combustion pulse
    this.seed = 0x9e3779b9;
    this.gain = 0;         // smoothed output level
    this.load = 0;         // smoothed throttle
    this.whistlePhase = 0;
    this.bov = 0;          // blow-off valve envelope
    this.lastThrottle = 0;
    this.exhaustTone = new Biquad();
    this.exhaustPipe = new Biquad();
    this.muffler = new Biquad();
    this.intake = new Biquad();
    this.whoosh = new Biquad();
    this.bovFilter = new Biquad();
    this.dc = 0;
  }

  noise() {
    // xorshift, white noise in [-1, 1)
    let x = this.seed;
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    this.seed = x >>> 0;
    return (this.seed / 2147483648) - 1;
  }

  process(_inputs, outputs, params) {
    const out = outputs[0][0];
    if (!out) return true;
    const sr = sampleRate;
    const rpm = Math.max(params.rpm[0], 300);
    const throttle = params.throttle[0];
    const boost = params.boost[0];
    const level = params.level[0];
    const firing = (rpm / 60) * 2; // Hz: two firings per revolution

    // filters follow the engine state once per block
    this.exhaustTone.set('bandpass', Math.min(Math.max(firing * 2, 70), 700), 1.6, sr);
    this.exhaustPipe.set('bandpass', 340, 1.2, sr);
    this.muffler.set('lowpass', 700 + this.load * 2200 + rpm * 0.25, 0.8, sr);
    this.intake.set('bandpass', 1400 + rpm * 0.15, 1.1, sr);
    this.whoosh.set('bandpass', 1800 + boost * 1800, 1.4, sr);
    this.bovFilter.set('highpass', 2600, 0.7, sr);

    // blow-off valve: lifting off the throttle with the turbo on boost
    if (this.lastThrottle > 0.5 && throttle < 0.5 && boost > 0.3) this.bov = Math.min(1, boost * 1.2);
    this.lastThrottle = throttle;

    // combustion pulses last about a third of the firing interval: lumpy at idle, smooth when revving
    const decay = Math.exp(-1 / (sr * Math.min(0.014, 0.35 / firing)));
    const bovDecay = Math.exp(-1 / (sr * 0.12));
    const whistleHz = 1500 + boost * 2900; // shaft whistle, ~4.4 kHz at full boost
    for (let i = 0; i < out.length; i++) {
      this.gain += (level - this.gain) * 0.0008;
      this.load += (throttle - this.load) * 0.0006;

      this.phase += firing / sr;
      if (this.phase >= 1) {
        this.phase -= 1;
        this.cyl = (this.cyl + 1) & 3;
        const strength = (0.3 + 0.7 * this.load) * CYLINDERS[this.cyl];
        this.pulse = strength * (0.92 + 0.16 * Math.random());
      }
      this.pulse *= decay;
      const n = this.noise();
      const combustion = this.pulse * (0.75 + 0.25 * n);

      const exhaust = this.exhaustTone.run(combustion) * 1.6 + this.exhaustPipe.run(combustion) * 1.1 + combustion * 0.35;
      let y = this.muffler.run(exhaust);
      y += this.intake.run(n) * this.load * (rpm / 7000) * 0.12;

      // turbocharger: whistle + airy whoosh, both scaled by boost
      this.whistlePhase += whistleHz / sr;
      if (this.whistlePhase >= 1) this.whistlePhase -= 1;
      const spool = boost * boost;
      y += Math.sin(TAU * this.whistlePhase) * spool * 0.035;
      y += this.whoosh.run(n) * spool * (0.3 + 0.7 * this.load) * 0.11;
      // blow-off: a short, slightly fluttering hiss
      if (this.bov > 1e-4) {
        const flutter = 0.7 + 0.3 * Math.sin(TAU * 22 * this.bov);
        y += this.bovFilter.run(n) * this.bov * flutter * 0.5;
        this.bov *= bovDecay;
      }

      // remove DC, soft-clip like an overdriven pipe, apply level
      this.dc += (y - this.dc) * 0.0005;
      out[i] = Math.tanh((y - this.dc) * 2.2) * this.gain;
    }
    return true;
  }
}

registerProcessor('engine944', Engine944);
