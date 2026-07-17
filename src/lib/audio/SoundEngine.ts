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
  // Ambient sound is OFF by default — it only begins once the visitor explicitly
  // enables it via the speaker toggle, so nothing plays on an incidental first click.
  private isEnabled: boolean = false;
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
  private buildReverb(seconds = 4.5, decay = 3.2): ConvolverNode {
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

  private startAmbientHum(roomId: string) {
    if (!this.ctx || !this.isEnabled || this.ambientOscillators.length > 0) return;
    if (this.ctx.state === 'suspended') return;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const rng = seedrandom(roomId || 'default');
    const rootFreq = 44 + rng() * 30; // ~44-74 Hz cosmic root

    // ── Master ambient bus + reverb send ──────────────────────────────────────
    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.value = 0.0;

    this.reverb = this.buildReverb();
    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.value = 0.55; // generous wet tail
    const bus = this.out();
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(bus);
    this.ambientGain.connect(bus); // dry
    this.ambientGain.connect(this.reverb); // wet
    this.ambientNodes.push(this.ambientGain, this.reverb, this.reverbGain);

    // ── Breathing lowpass filter (one slow "breath" every ~22s) ───────────────
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = rootFreq * 4;
    filter.Q.value = 0.8;
    filter.connect(this.ambientGain);
    this.ambientNodes.push(filter);

    const breathLfo = ctx.createOscillator();
    breathLfo.type = 'sine';
    breathLfo.frequency.value = 0.045;
    const breathGain = ctx.createGain();
    breathGain.gain.value = rootFreq * 2.2;
    breathLfo.connect(breathGain);
    breathGain.connect(filter.frequency);
    breathLfo.start();
    this.ambientOscillators.push(breathLfo);
    this.ambientNodes.push(breathGain);

    // ── Pad voices: a mystical minor chord (root, min3, 5th, min7, oct) ────────
    const ratios = [1, 1.189, 1.498, 1.781, 2.0];
    ratios.forEach((ratio) => {
      const osc = ctx.createOscillator();
      osc.type = rng() > 0.5 ? 'sine' : 'triangle';
      const detune = rng() * 5 - 2.5; // thick chorus
      osc.frequency.value = rootFreq * ratio + detune;

      // per-voice slow amplitude drift so the chord "evolves"
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = 0.5 + rng() * 0.3;
      const driftLfo = ctx.createOscillator();
      driftLfo.type = 'sine';
      driftLfo.frequency.value = 0.02 + rng() * 0.06;
      const driftAmt = ctx.createGain();
      driftAmt.gain.value = 0.25;
      driftLfo.connect(driftAmt);
      driftAmt.connect(voiceGain.gain);
      driftLfo.start();

      osc.connect(voiceGain);
      voiceGain.connect(filter);
      osc.start();
      this.ambientOscillators.push(osc, driftLfo);
      this.ambientNodes.push(voiceGain, driftAmt);
    });

    // ── Sub-bass swell: a felt-more-than-heard pulse under everything ──────────
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.value = rootFreq / 2;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.0;
    const subLfo = ctx.createOscillator();
    subLfo.type = 'sine';
    subLfo.frequency.value = 0.06 + rng() * 0.04; // slow tidal swell
    const subLfoAmt = ctx.createGain();
    subLfoAmt.gain.value = 0.16;
    subLfo.connect(subLfoAmt);
    subLfoAmt.connect(subGain.gain);
    subLfo.start();
    sub.connect(subGain);
    subGain.connect(this.ambientGain);
    sub.start();
    this.ambientOscillators.push(sub, subLfo);
    this.ambientNodes.push(subGain, subLfoAmt);

    // ── Shimmer: a high, glassy partial that slowly fades in and out ──────────
    const shimmer = ctx.createOscillator();
    shimmer.type = 'sine';
    shimmer.frequency.value = rootFreq * 6.02; // slightly detuned high partial
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.0;
    const shimmerLfo = ctx.createOscillator();
    shimmerLfo.type = 'sine';
    shimmerLfo.frequency.value = 0.033;
    const shimmerAmt = ctx.createGain();
    shimmerAmt.gain.value = 0.018;
    shimmerLfo.connect(shimmerAmt);
    shimmerAmt.connect(shimmerGain.gain);
    shimmerLfo.start();
    shimmer.connect(shimmerGain);
    shimmerGain.connect(this.reverb); // shimmer lives in the reverb tail
    shimmer.start();
    this.ambientOscillators.push(shimmer, shimmerLfo);
    this.ambientNodes.push(shimmerGain, shimmerAmt);

    // Fade the whole bed in gently over 4 seconds
    this.ambientGain.gain.linearRampToValueAtTime(0.2, now + 4);

    // ── Distant whispers: occasional soft bell-tones seeded by the room ───────
    this.scheduleWhisper(roomId, rng);
  }

  // Randomized, reverb-drenched bell tones that drift in "from far away".
  private scheduleWhisper(roomId: string, rng: () => number) {
    if (!this.ctx || !this.isEnabled) return;
    const delay = 7000 + rng() * 13000; // every 7-20s
    this.whisperTimer = setTimeout(() => {
      if (!this.ctx || !this.isEnabled || !this.reverb) return;
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const base = 220 + rng() * 440;
      const partials = [1, 2.01, 3.03];
      partials.forEach((p, idx) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = base * p;
        const g = ctx.createGain();
        const peak = 0.05 / (idx + 1);
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(peak, t + 0.6);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 4.5);
        osc.connect(g);
        g.connect(this.reverb!); // pure wet — sounds impossibly distant
        osc.start(t);
        osc.stop(t + 4.6);
      });
      this.scheduleWhisper(roomId, rng);
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
