// Virtual controller for phones and tablets, laid over the game: a steering pad under the
// left thumb, the pedals under the right thumb, and a few buttons along the top.
//
// Every control is multi-touch and slide-friendly: a finger may land anywhere on a control
// and slide across it (from left to right on the pad, from the brake to the throttle on the
// pedals) without lifting. The game reads `bits` every simulation step, with the same input
// bits as the keyboard (see src/app.rs); `latched` keeps very short taps from being lost.

export class TouchPad {
  constructor(bits) {
    this.BITS = bits;
    this.bits = 0;
    this.latched = 0;
    this.sources = new Map(); // pointerId -> bits held by that finger
  }

  hold(id, bits) {
    const before = this.sources.get(id) ?? 0;
    if (bits) this.sources.set(id, bits);
    else this.sources.delete(id);
    this.latched |= bits & ~before;
    let all = 0;
    for (const b of this.sources.values()) all |= b;
    this.bits = all;
  }

  take() {
    const b = this.bits | this.latched;
    this.latched = 0;
    return b;
  }

  /** A control whose bits depend on where the finger is on it: `pick(x, y, rect)`. */
  zone(el, pick, onMove) {
    const update = (e) => {
      const r = el.getBoundingClientRect();
      const bits = pick(e.clientX - r.left, e.clientY - r.top, r);
      this.hold(e.pointerId, bits);
      onMove?.(e.clientX - r.left, e.clientY - r.top, r, bits);
    };
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      update(e);
    });
    el.addEventListener('pointermove', (e) => {
      if (this.sources.has(e.pointerId) || el.hasPointerCapture(e.pointerId)) update(e);
    });
    const end = (e) => {
      this.hold(e.pointerId, 0);
      onMove?.(null, null, el.getBoundingClientRect(), 0);
    };
    for (const t of ['pointerup', 'pointercancel', 'lostpointercapture']) el.addEventListener(t, end);
  }

  /** A plain button holding `bit` while pressed. */
  button(el, bit) {
    this.zone(el, () => bit, (_x, _y, _r, b) => el.classList.toggle('down', !!b));
  }

  /** Wire the controller in `root` (see index.html for the markup). */
  attach(root) {
    const { LEFT, RIGHT, UP, DOWN, START, BACK, PAUSE } = this.BITS;
    const steer = root.querySelector('#steer');
    const knob = steer.querySelector('.knob');
    this.zone(
      steer,
      (x, _y, r) => {
        const dx = (x - r.width / 2) / (r.width / 2);
        return dx < -0.2 ? LEFT : dx > 0.2 ? RIGHT : 0;
      },
      (x, _y, r, bits) => {
        const dx = x === null ? 0 : Math.max(-1, Math.min(1, (x - r.width / 2) / (r.width / 2)));
        knob.style.transform = `translateX(${dx * (r.width / 2 - knob.offsetWidth / 2)}px)`;
        steer.querySelector('.l').classList.toggle('down', bits === LEFT);
        steer.querySelector('.r').classList.toggle('down', bits === RIGHT);
      },
    );
    const pedals = root.querySelector('#pedals');
    this.zone(
      pedals,
      // throttle at the bottom, under the resting thumb; brake above it
      (_x, y, r) => (y > r.height * 0.42 ? UP : DOWN),
      (_x, _y, _r, bits) => {
        pedals.querySelector('.gas').classList.toggle('down', bits === UP);
        pedals.querySelector('.brake').classList.toggle('down', bits === DOWN);
      },
    );
    this.button(root.querySelector('#t-ok'), START);
    this.button(root.querySelector('#t-back'), BACK);
    this.button(root.querySelector('#t-pause'), PAUSE);
  }
}
