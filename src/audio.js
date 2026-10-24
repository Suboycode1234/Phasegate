// Procedural Web Audio Engine for Space 3D
// High-tech sci-fi synthesized sound effects & dynamic ambiance

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.humGain = null;
    this.thrusterGain = null;
    this.thrusterOsc = null;
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.setupContinuousSounds();
      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio not supported:", e);
    }
  }

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setupContinuousSounds() {
    if (!this.ctx) return;

    // Interior reactor ambient hum
    const humOsc = this.ctx.createOscillator();
    const humFilter = this.ctx.createBiquadFilter();
    this.humGain = this.ctx.createGain();

    humOsc.type = 'sawtooth';
    humOsc.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A1 note

    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.humGain.gain.setValueAtTime(0.04, this.ctx.currentTime);

    humOsc.connect(humFilter);
    humFilter.connect(this.humGain);
    this.humGain.connect(this.ctx.destination);
    humOsc.start();

    // Space thruster engine sound
    this.thrusterOsc = this.ctx.createOscillator();
    const thrusterFilter = this.ctx.createBiquadFilter();
    this.thrusterGain = this.ctx.createGain();

    this.thrusterOsc.type = 'triangle';
    this.thrusterOsc.frequency.setValueAtTime(80, this.ctx.currentTime);

    thrusterFilter.type = 'bandpass';
    thrusterFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
    thrusterFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.thrusterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);

    this.thrusterOsc.connect(thrusterFilter);
    thrusterFilter.connect(this.thrusterGain);
    this.thrusterGain.connect(this.ctx.destination);
    this.thrusterOsc.start();
  }

  setInteriorMode(isInterior) {
    if (!this.humGain) return;
    const now = this.ctx.currentTime;
    if (isInterior) {
      this.humGain.gain.setTargetAtTime(0.045, now, 0.4);
      if (this.thrusterGain) this.thrusterGain.gain.setTargetAtTime(0.0, now, 0.2);
    } else {
      this.humGain.gain.setTargetAtTime(0.01, now, 0.4);
    }
  }

  setThrusterIntensity(intensity, boost = false) {
    if (!this.thrusterGain || !this.thrusterOsc) return;
    const now = this.ctx.currentTime;
    const targetGain = Math.min(intensity * (boost ? 0.2 : 0.09), 0.25);
    const targetFreq = 70 + intensity * 60 + (boost ? 80 : 0);
    this.thrusterGain.gain.setTargetAtTime(targetGain, now, 0.1);
    this.thrusterOsc.frequency.setTargetAtTime(targetFreq, now, 0.1);
  }

  playLaser(isShip = false) {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = isShip ? 'sawtooth' : 'sine';
    const startFreq = isShip ? 980 : 1300;
    const endFreq = isShip ? 120 : 250;

    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + (isShip ? 0.22 : 0.14));

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isShip ? 2800 : 3500, now);

    gain.gain.setValueAtTime(isShip ? 0.18 : 0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (isShip ? 0.22 : 0.14));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + (isShip ? 0.25 : 0.16));
  }

  playJump() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.18);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  playLand() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  playFootstep() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90 + Math.random() * 20, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(260, now);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  playPunch() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.12);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  playTransition() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.25);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.5);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.56);
  }

  playDoor() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.exponentialRampToValueAtTime(90, now + 0.5);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.56);
  }

  playExplosion() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 0.45);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.52);
  }

  playPlasma() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.16);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(3.5, now);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  playRailgun() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass kinetic boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(220, now);
    sub.frequency.exponentialRampToValueAtTime(35, now + 0.35);
    subGain.gain.setValueAtTime(0.35, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    sub.connect(subGain);
    subGain.connect(this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.4);

    // Hyper-velocity capacitor discharge
    const zap = this.ctx.createOscillator();
    const zapGain = this.ctx.createGain();
    zap.type = 'triangle';
    zap.frequency.setValueAtTime(2800, now);
    zap.frequency.exponentialRampToValueAtTime(600, now + 0.12);
    zapGain.gain.setValueAtTime(0.18, now);
    zapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    zap.connect(zapGain);
    zapGain.connect(this.ctx.destination);
    zap.start(now);
    zap.stop(now + 0.15);
  }

  playBallistic() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playEquip() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(620, now);
    osc.frequency.setValueAtTime(880, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playReload() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Mag release latch click
    const click1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    click1.type = 'sine';
    click1.frequency.setValueAtTime(1400, now);
    click1.frequency.exponentialRampToValueAtTime(300, now + 0.05);
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    click1.connect(gain1);
    gain1.connect(this.ctx.destination);
    click1.start(now);
    click1.stop(now + 0.07);

    // 2. Mag insertion lock
    const click2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    click2.type = 'triangle';
    click2.frequency.setValueAtTime(550, now + 0.65);
    click2.frequency.setValueAtTime(980, now + 0.72);
    gain2.gain.setValueAtTime(0, now);
    gain2.gain.setValueAtTime(0.22, now + 0.65);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.82);
    click2.connect(gain2);
    gain2.connect(this.ctx.destination);
    click2.start(now + 0.65);
    click2.stop(now + 0.85);

    // 3. Bolt chamber slide & ready lock
    const bolt = this.ctx.createOscillator();
    const boltGain = this.ctx.createGain();
    bolt.type = 'sawtooth';
    bolt.frequency.setValueAtTime(850, now + 1.1);
    bolt.frequency.exponentialRampToValueAtTime(120, now + 1.25);
    boltGain.gain.setValueAtTime(0, now);
    boltGain.gain.setValueAtTime(0.16, now + 1.1);
    boltGain.gain.exponentialRampToValueAtTime(0.001, now + 1.28);
    bolt.connect(boltGain);
    boltGain.connect(this.ctx.destination);
    bolt.start(now + 1.1);
    bolt.stop(now + 1.3);
  }

  playMagBoot() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playJetpack(boost = false) {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(boost ? 220 : 140, now);
    osc.frequency.exponentialRampToValueAtTime(boost ? 340 : 180, now + 0.15);
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(boost ? 1200 : 700, now);
    filter.Q.setValueAtTime(2.0, now);
    gain.gain.setValueAtTime(boost ? 0.28 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playAirlockCycle() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // 1. Steam depressurization hiss
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.8);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.95);

    // 2. Heavy steel clamp engagement
    const clamp = this.ctx.createOscillator();
    const clampGain = this.ctx.createGain();
    clamp.type = 'sine';
    clamp.frequency.setValueAtTime(180, now + 0.6);
    clamp.frequency.exponentialRampToValueAtTime(45, now + 0.85);
    clampGain.gain.setValueAtTime(0, now);
    clampGain.gain.setValueAtTime(0.35, now + 0.6);
    clampGain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
    clamp.connect(clampGain);
    clampGain.connect(this.ctx.destination);
    clamp.start(now + 0.6);
    clamp.stop(now + 1.0);
  }

  playLootPickup() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 crystalline chord
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.45);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.5);
    });
  }

  playHyperjump() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Rising sub-bass charge
    const charge = this.ctx.createOscillator();
    const chargeGain = this.ctx.createGain();
    charge.type = 'sawtooth';
    charge.frequency.setValueAtTime(60, now);
    charge.frequency.exponentialRampToValueAtTime(1200, now + 1.6);
    chargeGain.gain.setValueAtTime(0.1, now);
    chargeGain.gain.linearRampToValueAtTime(0.4, now + 1.5);
    chargeGain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
    charge.connect(chargeGain);
    chargeGain.connect(this.ctx.destination);
    charge.start(now);
    charge.stop(now + 2.5);

    // Spacetime burst bang
    const bang = this.ctx.createOscillator();
    const bangGain = this.ctx.createGain();
    bang.type = 'triangle';
    bang.frequency.setValueAtTime(180, now + 1.55);
    bang.frequency.exponentialRampToValueAtTime(30, now + 2.6);
    bangGain.gain.setValueAtTime(0, now);
    bangGain.gain.setValueAtTime(0.5, now + 1.55);
    bangGain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
    bang.connect(bangGain);
    bangGain.connect(this.ctx.destination);
    bang.start(now + 1.55);
    bang.stop(now + 2.9);
  }

  playJammerWarning() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.setValueAtTime(320, now + 0.15);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  playGrapple() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // High-pressure pneumatic launch whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);

    // Cable tension spool hum
    const tension = this.ctx.createOscillator();
    const tGain = this.ctx.createGain();
    tension.type = 'triangle';
    tension.frequency.setValueAtTime(220, now + 0.05);
    tension.frequency.linearRampToValueAtTime(440, now + 0.35);
    tGain.gain.setValueAtTime(0.08, now + 0.05);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    tension.connect(tGain);
    tGain.connect(this.ctx.destination);
    tension.start(now + 0.05);
    tension.stop(now + 0.42);
  }

  playGrappleHit() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Kinetic magnetic latch click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playRally() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Harmonized command pulse chord
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);
      gain.gain.setValueAtTime(0.12, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.06);
      osc.stop(now + 0.75);
    });
  }

  playRepair() {
    this.ensureContext();
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Nanite welding sizzle & power surge
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(680, now + 0.35);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.48);
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (this.ctx) {
      if (this.enabled) this.ctx.resume();
      else this.ctx.suspend();
    }
    return this.enabled;
  }
}

export const sounds = new SoundEngine();
