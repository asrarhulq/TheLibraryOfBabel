import seedrandom from 'seedrandom';

let engineInstance: SoundEngine | null = null;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientNodes: AudioNode[] = []; // filters, gains, LFOs to tear down
  private ambientGain: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private whisperTimer: ReturnType<typeof setTimeout> | null = null;
  // Master output bus: a gentle limiter that every sound routes through, so the drone,
  // page-turn thump, rustle, chime and whispers can never sum past the clipping point
  // (which is what produces harsh crackle/distortion). Nothing connects to ctx.destination
  // directly anymore — everything goes through here.
  private master: GainNode | null = null;
  private limiter: DynamicsCompressorNode | null = null;
  // Ambient sound is ON by default — soothing music starts on first interaction.
  private isEnabled: boolean = true;
  private currentRoomId: string = '';
  private hasInteracted: boolean = false;

  private ensureContext() {
    if (!this.ctx) {
      const w = window as typeof window & { webkitAudioContext?: typeof AudioContext };
      this.ctx = new (w.AudioContext || w.webkitAudioContext!)();
    }
    return this.ctx;
  }

  // The shared output bus. Created once, lazily.
  private out(): AudioNode {
    const ctx = this.ensureContext();
    if (!this.master || !this.limiter) {
      this.limiter = ctx.createDynamicsCompressor();
      // Brick-wall-ish limiter to catch peaks before they clip.
      this.limiter.threshold.value = -8;
      this.limiter.knee.value = 6;
      this.limiter.ratio.value = 12;
      this.limiter.attack.value = 0.003;
      this.limiter.release.value = 0.25;

      this.master = ctx.createGain();
      this.master.gain.value = 0.85; // a touch of headroom

      this.limiter.connect(this.master);
      this.master.connect(ctx.destination);
    }
    return this.limiter;
  }

  public handleUserInteraction() {
    if (this.hasInteracted) return;
    this.hasInteracted = true;
    
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    if (this.isEnabled && this.ambientOscillators.length === 0) {
      this.startAmbientHum(this.currentRoomId);
    }
  }

  public enable() {
    this.isEnabled = true;
    if (!this.hasInteracted) return;
    const ctx = this.ensureContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    this.startAmbientHum(this.currentRoomId);
  }

  public disable() {
    this.isEnabled = false;
    this.stopAmbientHum();
  }

  public toggle() {
    if (this.isEnabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.isEnabled;
  }

  public getEnabled() {
    return this.isEnabled;
  }

  public setRoom(roomId: string) {
    if (roomId !== this.currentRoomId) {
      this.currentRoomId = roomId;
      if (this.isEnabled && this.hasInteracted) {
        this.stopAmbientHum();
        setTimeout(() => this.startAmbientHum(roomId), 1200);
      }
    }
  }

  // Build a synthetic reverb impulse (a decaying noise tail) for a vast, cathedral-like space.
  private buildReverb(seconds = 6.0, decay = 2.8): ConvolverNode {
    const ctx = this.ctx!;
    const rate = ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        // exponential decay envelope over white noise
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
      }
    }
    const conv = ctx.createConvolver();
    conv.buffer = impulse;
    return conv;
  }

  // ── Musical scale helpers ───────────────────────────────────────────────────
  // Just intonation ratios for a major scale (relative to root).
  private static readonly MAJOR = [1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8, 2];
  // Pentatonic subset (scale degrees 1,2,3,5,6) — always sounds melodic.
  private static readonly PENTATONIC = [1, 9/8, 5/4, 3/2, 5/3, 2];

  // Chord progression: I – vi – IV – V (in scale degrees: 1, 6, 4, 5).
  // Each chord is a set of ratios stacking thirds from that degree.
  private static readonly PROGRESSION = [
    { root: 0, name: 'I',   ratios: [1, 5/4, 3/2, 2, 5/2] },        // I (major)
    { root: 5, name: 'vi',  ratios: [1, 6/5, 3/2, 2, 9/5] },        // vi (minor)
    { root: 3, name: 'IV',  ratios: [1, 5/4, 3/2, 2, 5/2] },        // IV (major)
    { root: 4, name: 'V',   ratios: [1, 5/4, 3/2, 2, 3/2 * 9/8] }, // V  (major)
  ];

  private startAmbientHum(roomId: string) {
    if (!this.ctx || !this.isEnabled || this.ambientOscillators.length > 0) return;
    if (this.ctx.state === 'suspended') return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const rng = seedrandom(roomId || 'default');

    // Pick a key — piano range: C3 (~131 Hz) to A3 (~220 Hz).
    const keys = [130.81, 146.83, 164.81, 174.61, 196.00, 220.00];
    const tonic = keys[Math.floor(rng() * keys.length)];

    // ── Master ambient bus + reverb send ──────────────────────────────────────
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.0;

    this.reverb = this.buildReverb();
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.55;
    const bus = this.out();
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(bus);
    this.ambientGain.connect(bus);
    this.ambientGain.connect(this.reverb);
    this.ambientNodes.push(this.ambientGain, this.reverb, this.reverbGain);

    const chordSeconds = 18 + rng() * 10; // each chord lasts 18-28 seconds

    // ── Piano-like arpeggio: gentle, clear notes picking through chord tones ──
    const arpTempo = 1.1 + rng() * 0.5; // seconds between notes
    const arpPattern = [0, 2, 1, 3, 0, 2, 4, 1, 3, 1, 0, 2];
    let arpStep = 0;
    const scheduleArp = () => {
      if (!this.ctx || !this.isEnabled) return;
      const t = ctx.currentTime;
      const progIdx = Math.floor((arpStep * arpTempo) / chordSeconds) % SoundEngine.PROGRESSION.length;
      const chord = SoundEngine.PROGRESSION[progIdx];
      const chordRoot = tonic * SoundEngine.MAJOR[chord.root];
      const ratioIdx = arpPattern[arpStep % arpPattern.length] % chord.ratios.length;
      const freq = chordRoot * chord.ratios[ratioIdx];

      // Piano-like tone: triangle wave with a soft attack and quick decay
      const osc = ctx.createOscillator();
      osc.type = 'sine'; // pure sine — softest, no harmonics
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.05, t + 0.1); // very soft attack
      g.gain.setValueAtTime(0.05, t + 0.18); // brief gentle sustain
      g.gain.exponentialRampToValueAtTime(0.0004, t + arpTempo * 1.2); // slow gentle decay
      g.gain.linearRampToValueAtTime(0, t + arpTempo * 1.3);
      osc.connect(g);
      g.connect(this.reverb!);
      osc.start(t);
      osc.stop(t + arpTempo * 1.5);
      arpStep++;
      this.whisperTimer = setTimeout(scheduleArp, arpTempo * 1000);
    };
    setTimeout(() => scheduleArp(), 1500);

    // ── Melody: a slow, wandering pentatonic line — the singing voice ─────────
    const melodyNotes: number[] = [];
    const melodyLen = 14 + Math.floor(rng() * 10);
    for (let i = 0; i < melodyLen; i++) {
      melodyNotes.push(SoundEngine.PENTATONIC[Math.floor(rng() * SoundEngine.PENTATONIC.length)]);
    }
    let melodyIdx = 0;
    const melodyInterval = 2.8 + rng() * 2.5;
    const scheduleMelody = () => {
      if (!this.ctx || !this.isEnabled) return;
      const t = ctx.currentTime;
      const ratio = melodyNotes[melodyIdx % melodyNotes.length];
      const freq = tonic * ratio * 2; // two octaves up

      // Warm, singing tone with a gentle swell
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.04, t + 0.35); // very gentle swell
      g.gain.setValueAtTime(0.04, t + 1.1);
      g.gain.exponentialRampToValueAtTime(0.0004, t + 2.5);
      g.gain.linearRampToValueAtTime(0, t + 2.6);
      osc.connect(g);
      g.connect(this.reverb!);
      osc.start(t);
      osc.stop(t + 2.7);
      melodyIdx++;
      this.whisperTimer = setTimeout(scheduleMelody, melodyInterval * 1000);
    };
    setTimeout(() => scheduleMelody(), 3500);

    // Fade in very gently over 8 seconds.
    this.ambientGain.gain.linearRampToValueAtTime(0.18, now + 8);

    // ── Distant bell tones: occasional soft chimes harmonized with the current chord ──
    this.scheduleBell(roomId, rng, tonic, chordSeconds);
  }

  // Occasional soft bell tones that harmonize with the current chord.
  private scheduleBell(roomId: string, rng: () => number, tonic: number, chordSeconds: number) {
    if (!this.ctx || !this.isEnabled) return;
    const delay = 12000 + rng() * 20000; // every 12-32s
    this.whisperTimer = setTimeout(() => {
      if (!this.ctx || !this.isEnabled || !this.reverb) { this.scheduleBell(roomId, rng, tonic, chordSeconds); return; }
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const progIdx = Math.floor((Date.now() % (chordSeconds * 4 * 1000)) / (chordSeconds * 1000));
      const chord = SoundEngine.PROGRESSION[progIdx % SoundEngine.PROGRESSION.length];
      const chordRoot = tonic * SoundEngine.MAJOR[chord.root];
      const bellFreq = chordRoot * [1, 2, 3/2, 5/2][Math.floor(rng() * 4)];
      const partials = [1, 2, 3, 4.5];
      partials.forEach((p, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = bellFreq * p;
        const g = ctx.createGain();
        const peak = 0.025 / (idx + 1);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak, t + 1.2);
        g.gain.exponentialRampToValueAtTime(0.00005, t + 9.0);
        osc.connect(g);
        g.connect(this.reverb!);
        osc.start(t);
        osc.stop(t + 9.1);
      });
      this.scheduleBell(roomId, rng, tonic, chordSeconds);
    }, delay);
  }

  private stopAmbientHum() {
    if (this.whisperTimer) {
      clearTimeout(this.whisperTimer);
      this.whisperTimer = null;
    }
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1.2);
      const oscsToStop = [...this.ambientOscillators];
      const nodesToDisconnect = [...this.ambientNodes];
      this.ambientOscillators = [];
      this.ambientNodes = [];
      this.reverb = null;
      this.reverbGain = null;
      setTimeout(() => {
        oscsToStop.forEach((osc) => {
          try { osc.stop(); } catch { /* already stopped */ }
          try { osc.disconnect(); } catch { /* noop */ }
        });
        nodesToDisconnect.forEach((n) => {
          try { n.disconnect(); } catch { /* noop */ }
        });
      }, 1400);
    }
  }

  /**
   * The cinematic search descent. Three exciting beats matched to the visual:
   *   phase 'encode'  — a rising sparkle as the coordinate assembles
   *   phase 'fall'    — a whooshing pitch-rising plunge (the rush through the void)
   *   phase 'arrive'  — a resonant chord bloom (the reward of arrival)
   * Plays regardless of the ambient-hum toggle if the context is usable, so the
   * moment always lands — but respects a fully-suspended context.
   */
  public playDescent(phase: 'encode' | 'fall' | 'arrive') {
    const ctx = this.ctx;
    if (!ctx || ctx.state === 'suspended') return;
    const bus = this.out();
    const t = ctx.currentTime;

    if (phase === 'encode') {
      // A quick ascending sparkle — four bell tones climbing.
      const base = 440;
      const steps = [1, 1.26, 1.5, 2.0];
      steps.forEach((r, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = base * r;
        const start = t + i * 0.09;
        g.gain.setValueAtTime(0, start);
        g.gain.linearRampToValueAtTime(0.06, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0008, start + 0.5);
        g.gain.linearRampToValueAtTime(0, start + 0.55);
        osc.connect(g);
        g.connect(this.reverb || bus);
        osc.start(start);
        osc.stop(start + 0.6);
      });
    } else if (phase === 'fall') {
      // The plunge: a filtered-noise whoosh that opens up + a rising sub sweep.
      const dur = 1.8;
      const bufferSize = Math.floor(ctx.sampleRate * dur);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const nf = ctx.createBiquadFilter();
      nf.type = 'bandpass';
      nf.frequency.setValueAtTime(300, t);
      nf.frequency.exponentialRampToValueAtTime(3500, t + dur * 0.8); // sweep upward = accelerating
      nf.Q.value = 1.2;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0, t);
      ng.gain.linearRampToValueAtTime(0.12, t + 0.5);
      ng.gain.linearRampToValueAtTime(0.14, t + dur * 0.75);
      ng.gain.exponentialRampToValueAtTime(0.001, t + dur);
      ng.gain.linearRampToValueAtTime(0, t + dur + 0.05);
      noise.connect(nf);
      nf.connect(ng);
      ng.connect(bus);
      noise.start(t);
      noise.stop(t + dur + 0.1);

      // rising tone underneath — builds anticipation
      const rise = ctx.createOscillator();
      const rg = ctx.createGain();
      rise.type = 'sawtooth';
      rise.frequency.setValueAtTime(60, t);
      rise.frequency.exponentialRampToValueAtTime(240, t + dur);
      const rf = ctx.createBiquadFilter();
      rf.type = 'lowpass';
      rf.frequency.value = 600;
      rg.gain.setValueAtTime(0, t);
      rg.gain.linearRampToValueAtTime(0.08, t + 0.4);
      rg.gain.exponentialRampToValueAtTime(0.001, t + dur);
      rg.gain.linearRampToValueAtTime(0, t + dur + 0.05);
      rise.connect(rf);
      rf.connect(rg);
      rg.connect(bus);
      rise.start(t);
      rise.stop(t + dur + 0.1);
    } else if (phase === 'arrive') {
      // Arrival bloom — a warm major chord swelling out of the reverb.
      const root = 220;
      const chord = [1, 1.5, 2.0, 2.52];
      chord.forEach((r) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = root * r;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.09, t + 0.12);
        g.gain.exponentialRampToValueAtTime(0.001, t + 2.2);
        g.gain.linearRampToValueAtTime(0, t + 2.3);
        osc.connect(g);
        g.connect(this.reverb || bus);
        osc.start(t);
        osc.stop(t + 2.4);
      });
    }
  }

  public playPageTurn(roomId: string, page: number) {
    if (!this.ctx || !this.isEnabled || this.ctx.state === 'suspended') return;

    const rng = seedrandom(`${roomId}-${page}`);
    const time = this.ctx.currentTime;
    const bus = this.out(); // everything routes through the master limiter

    // LAYER 1: Deep thump — a pitch-dropping sine wave
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(120, time);
    thumpOsc.frequency.exponentialRampToValueAtTime(35, time + 0.18);

    thumpGain.gain.setValueAtTime(0, time);
    thumpGain.gain.linearRampToValueAtTime(0.26, time + 0.015);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    thumpGain.gain.linearRampToValueAtTime(0, time + 0.3); // settle to true zero — no click

    thumpOsc.connect(thumpGain);
    thumpGain.connect(bus);
    thumpOsc.start(time);
    thumpOsc.stop(time + 0.32);

    // LAYER 2: Soft parchment rustle — filtered noise (band-limited so it can't crackle)
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 2000 + rng() * 500;
    noiseFilter.Q.value = 0.7;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(0.08, time + 0.03);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);
    noiseGain.gain.linearRampToValueAtTime(0, time + 0.3);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(bus);
    noiseSource.start(time);
    noiseSource.stop(time + 0.32);

    // LAYER 3: Gentle chime — satisfying tonal sparkle
    const chimeOsc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chimeOsc.type = 'triangle';
    const chimeFreq = 520 + rng() * 80;
    chimeOsc.frequency.setValueAtTime(chimeFreq, time + 0.02);
    chimeOsc.frequency.exponentialRampToValueAtTime(chimeFreq * 0.6, time + 0.4);

    chimeGain.gain.setValueAtTime(0, time);
    chimeGain.gain.linearRampToValueAtTime(0.05, time + 0.03);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);
    chimeGain.gain.linearRampToValueAtTime(0, time + 0.5);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(bus);
    chimeOsc.start(time);
    chimeOsc.stop(time + 0.52);
  }
}

// Lazy singleton — only created in the browser
export function getEngine(): SoundEngine {
  if (!engineInstance) {
    engineInstance = new SoundEngine();
  }
  return engineInstance;
}
