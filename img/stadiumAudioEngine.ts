/**
 * Authentic Restrained Ambient Stadium & Potrero Soundscape Engine
 * Powered by Web Audio API — zero external files, 100% reliable in any sandbox.
 * Features:
 * - Rosario dusk evening wind in the grass (filtered pink noise with gentle sinusoidal waver)
 * - Subtle nighttime potrero crickets / summer air atmosphere
 * - Warm transformer electrical hum & power swell when floodlights switch on (approx 3.2s - 5.0s)
 * - Restrained acoustic space resonance (no dialogue, no synthetic music, pure documentary ambiance)
 */

class StadiumAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private isMuted = false;
  private masterGain: GainNode | null = null;
  private userVolume = 0.55;

  // Nodes for wind
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windSource: AudioBufferSourceNode | null = null;

  // Nodes for crickets/atmosphere
  private cricketsGain: GainNode | null = null;
  private cricketsOsc1: OscillatorNode | null = null;
  private cricketsOsc2: OscillatorNode | null = null;

  // Nodes for floodlight hum
  private floodlightGain: GainNode | null = null;
  private humOsc1: OscillatorNode | null = null;
  private humOsc2: OscillatorNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.userVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public start() {
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isPlaying) return;

    const t = this.ctx.currentTime;

    // 1. Rosario evening breeze across grass
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
      b6 = white * 0.115926;
    }

    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'lowpass';
    this.windFilter.frequency.setValueAtTime(320, t);
    this.windFilter.Q.setValueAtTime(2.5, t);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.001, t);
    this.windGain.gain.exponentialRampToValueAtTime(0.28, t + 1.2);

    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    this.windSource.start(t);

    // 2. Subtle night potrero air (gentle nocturnal crickets/insects)
    this.cricketsOsc1 = this.ctx.createOscillator();
    this.cricketsOsc2 = this.ctx.createOscillator();
    this.cricketsGain = this.ctx.createGain();

    this.cricketsOsc1.type = 'sine';
    this.cricketsOsc1.frequency.setValueAtTime(4600, t);
    this.cricketsOsc2.type = 'sine';
    this.cricketsOsc2.frequency.setValueAtTime(4850, t);

    // Modulate cricket gain with subtle slow pulse
    this.cricketsGain.gain.setValueAtTime(0.001, t);
    this.cricketsGain.gain.exponentialRampToValueAtTime(0.012, t + 1.5);

    this.cricketsOsc1.connect(this.cricketsGain);
    this.cricketsOsc2.connect(this.cricketsGain);
    this.cricketsGain.connect(this.masterGain);

    this.cricketsOsc1.start(t);
    this.cricketsOsc2.start(t);

    // 3. Floodlights electrical transformer resonance & warm hum
    this.humOsc1 = this.ctx.createOscillator();
    this.humOsc2 = this.ctx.createOscillator();
    this.floodlightGain = this.ctx.createGain();

    this.humOsc1.type = 'sawtooth';
    this.humOsc1.frequency.setValueAtTime(50, t); // 50 Hz power grid hum (standard in Argentina)
    this.humOsc2.type = 'sine';
    this.humOsc2.frequency.setValueAtTime(100, t); // 100 Hz first harmonic

    const humFilter = this.ctx.createBiquadFilter();
    humFilter.type = 'lowpass';
    humFilter.frequency.setValueAtTime(180, t);

    this.floodlightGain.gain.setValueAtTime(0.0, t);

    this.humOsc1.connect(humFilter);
    this.humOsc2.connect(humFilter);
    humFilter.connect(this.floodlightGain);
    this.floodlightGain.connect(this.masterGain);

    this.humOsc1.start(t);
    this.humOsc2.start(t);

    this.isPlaying = true;
  }

  /**
   * Synchronize ambient sound with the video timeline (0 - 14 seconds)
   * Specifically swells the electrical floodlight hum when the lights warm up!
   */
  public syncWithTimeline(currentTime: number, _duration: number) {
    if (!this.ctx || !this.isPlaying || !this.floodlightGain || !this.windFilter) return;

    const t = this.ctx.currentTime;

    // Wind subtle modulation
    const windTargetFreq = 280 + Math.sin(currentTime * 0.8) * 90;
    this.windFilter.frequency.setTargetAtTime(windTargetFreq, t, 0.2);

    // Floodlight hum: starts coming on at t = 2.8s, peaks at 5.5s, stays gentle through pro stadium
    let humTarget = 0;
    if (currentTime >= 2.8 && currentTime < 13.5) {
      if (currentTime < 4.2) {
        // Turning on flare swell
        humTarget = 0.08 * ((currentTime - 2.8) / 1.4);
      } else if (currentTime < 8.5) {
        // Settling into steady hum
        humTarget = 0.045;
      } else {
        // Larger stadium lights
        humTarget = 0.06;
      }
    } else {
      // Loop transition back to quiet dusk
      humTarget = 0.005;
    }

    this.floodlightGain.gain.setTargetAtTime(humTarget, t, 0.15);
  }

  public stop() {
    if (!this.isPlaying) return;
    try {
      this.windSource?.stop();
      this.cricketsOsc1?.stop();
      this.cricketsOsc2?.stop();
      this.humOsc1?.stop();
      this.humOsc2?.stop();
    } catch {
      // Ignore if already stopped
    }
    this.isPlaying = false;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(muted ? 0 : this.userVolume, t, 0.05);
  }

  public getMuted() {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.userVolume = Math.max(0, Math.min(1, vol));
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    this.masterGain.gain.setTargetAtTime(this.userVolume, this.ctx.currentTime, 0.05);
  }

  public getVolume() {
    return this.userVolume;
  }
}

export const stadiumAudio = new StadiumAudioEngine();
