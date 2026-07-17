import seedrandom from 'seedrandom';

let engineInstance: SoundEngine | null = null;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientGain: GainNode | null = null;
  private isEnabled: boolean = true;
  private currentRoomId: string = '';
  private hasInteracted: boolean = false;

  private ensureContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
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

  private startAmbientHum(roomId: string) {
    if (!this.ctx || !this.isEnabled || this.ambientOscillators.length > 0) return;
    if (this.ctx.state === 'suspended') return;

    const rng = seedrandom(roomId || 'default');
    const rootFreq = 50 + (rng() * 40);

    // Build a lush, addictive minor/mystical chord (Root, minor 3rd, 5th, minor 7th)
    const ratios = [1, 1.189, 1.498, 1.781];
    
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.value = 0.0;

    // Slow sweeping lowpass filter for a "breathing" cosmic effect
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = rootFreq * 4;
    
    // LFO to animate the filter: one full breath every 20 seconds
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.05;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = rootFreq * 2;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();
    this.ambientOscillators.push(lfo);

    ratios.forEach((ratio) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = rng() > 0.5 ? 'sine' : 'triangle';
      
      // Slight detuning for a thick chorus effect
      const detune = (rng() * 4) - 2; 
      osc.frequency.value = (rootFreq * ratio) + detune;

      osc.connect(filter);
      osc.start();
      this.ambientOscillators.push(osc);
    });

    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    // Fade in over 3 seconds
    this.ambientGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 3);
  }

  private stopAmbientHum() {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
      const oscsToStop = [...this.ambientOscillators];
      this.ambientOscillators = [];
      setTimeout(() => {
        oscsToStop.forEach(osc => {
          try { osc.stop(); } catch(e) {}
          osc.disconnect();
        });
      }, 1100);
    }
  }

  public playPageTurn(roomId: string, page: number) {
    if (!this.ctx || !this.isEnabled || this.ctx.state === 'suspended') return;

    const rng = seedrandom(`${roomId}-${page}`);
    const time = this.ctx.currentTime;
    
    // LAYER 1: Deep thump — a pitch-dropping sine wave
    const thumpOsc = this.ctx.createOscillator();
    const thumpGain = this.ctx.createGain();
    thumpOsc.type = 'sine';
    thumpOsc.frequency.setValueAtTime(120, time);
    thumpOsc.frequency.exponentialRampToValueAtTime(35, time + 0.18);
    
    thumpGain.gain.setValueAtTime(0, time);
    thumpGain.gain.linearRampToValueAtTime(0.4, time + 0.015);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25);

    thumpOsc.connect(thumpGain);
    thumpGain.connect(this.ctx.destination);
    thumpOsc.start(time);
    thumpOsc.stop(time + 0.3);

    // LAYER 2: Soft parchment rustle — filtered noise
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
    noiseFilter.frequency.value = 2000 + (rng() * 500);
    noiseFilter.Q.value = 0.7;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0, time);
    noiseGain.gain.linearRampToValueAtTime(0.12, time + 0.02); 
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.25); 

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noiseSource.start(time);

    // LAYER 3: Gentle chime — satisfying tonal sparkle
    const chimeOsc = this.ctx.createOscillator();
    const chimeGain = this.ctx.createGain();
    chimeOsc.type = 'triangle';
    const chimeFreq = 520 + (rng() * 80);
    chimeOsc.frequency.setValueAtTime(chimeFreq, time + 0.02);
    chimeOsc.frequency.exponentialRampToValueAtTime(chimeFreq * 0.6, time + 0.4);
    
    chimeGain.gain.setValueAtTime(0, time);
    chimeGain.gain.linearRampToValueAtTime(0.06, time + 0.03);
    chimeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.45);

    chimeOsc.connect(chimeGain);
    chimeGain.connect(this.ctx.destination);
    chimeOsc.start(time);
    chimeOsc.stop(time + 0.5);
  }
}

// Lazy singleton — only created in the browser
export function getEngine(): SoundEngine {
  if (!engineInstance) {
    engineInstance = new SoundEngine();
  }
  return engineInstance;
}
