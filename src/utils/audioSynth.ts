// Web Audio API Ambient Sound Synthesizer for the Museum
class AmbientAudioController {
  private ctx: AudioContext | null = null;
  private currentType: string = 'none';
  private isPlaying: boolean = false;
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private intervalId: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public play(type: 'rain' | 'piano' | 'waves' | 'chimes' | 'night' | 'stream' | 'none', customUrl?: string) {
    this.stop();
    if (type === 'none') return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentType = type;
    this.isPlaying = true;

    if (customUrl) {
      // Audio element fallback for custom URLs
      try {
        const audio = new Audio(customUrl);
        audio.loop = true;
        audio.volume = 0.4;
        audio.play().catch(e => console.log('Custom audio autoplay prevented:', e));
        (this as any)._customAudio = audio;
        return;
      } catch (e) {
        console.warn('Custom audio playback failed, falling back to synth');
      }
    }

    switch (type) {
      case 'rain':
        this.startRain();
        break;
      case 'piano':
        this.startAmbientPiano();
        break;
      case 'waves':
        this.startOceanWaves();
        break;
      case 'chimes':
        this.startWindChimes();
        break;
      case 'night':
        this.startNightAmbience();
        break;
      case 'stream':
        this.startStream();
        break;
    }
  }

  public stop() {
    if ((this as any)._customAudio) {
      try {
        (this as any)._customAudio.pause();
        (this as any)._customAudio = null;
      } catch (e) {}
    }

    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.activeNodes.forEach(node => {
      try {
        if (typeof node === 'number') {
          window.clearTimeout(node);
        } else if ((node as any).stop) {
          (node as any).stop();
        } else if ((node as any).disconnect) {
          (node as any).disconnect();
        }
      } catch (e) {}
    });
    this.activeNodes = [];
    this.isPlaying = false;
    this.currentType = 'none';
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, vol)), this.ctx.currentTime);
    }
  }

  public getStatus() {
    return { isPlaying: this.isPlaying, type: this.currentType };
  }

  // --- Rain generator using filtered noise ---
  private startRain() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    this.activeNodes.push(whiteNoise, filter, gain);
  }

  // --- Ocean Waves generator using sweeping lowpass on noise ---
  private startOceanWaves() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 3;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, this.ctx.currentTime);
    filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // LFO for wave swelling
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8 sec wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    whiteNoise.start();
    lfo.start();
    this.activeNodes.push(whiteNoise, filter, lfo, lfoGain, gain);
  }

  // --- Ambient Piano generator playing gentle slow arpeggios ---
  private startAmbientPiano() {
    if (!this.ctx || !this.masterGain) return;
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 392.00], // G
    ];

    let chordIdx = 0;
    const playNote = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const currentChord = chords[chordIdx % chords.length];
      const freq = currentChord[Math.floor(Math.random() * currentChord.length)];
      
      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      noteGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      noteGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.8);

      osc.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 4.0);

      if (Math.random() > 0.6) chordIdx++;
    };

    playNote();
    this.intervalId = window.setInterval(playNote, 1800);
  }

  // --- Wind chimes generator ---
  private startWindChimes() {
    if (!this.ctx || !this.masterGain) return;
    const chimeFreqs = [587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];

    const ringChime = () => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, this.ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 4.0);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 4.2);
    };

    ringChime();
    this.intervalId = window.setInterval(() => {
      if (Math.random() > 0.3) ringChime();
    }, 2200);
  }

  // --- Night ambience ---
  private startNightAmbience() {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(4500, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(4, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    lfo.connect(lfoGain.gain);
    gain.gain.setValueAtTime(0.015, this.ctx.currentTime);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    lfo.start();
    this.activeNodes.push(osc, gain, lfo, lfoGain);
  }

  // --- Stream / Flowing Water ---
  private startStream() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start();
    this.activeNodes.push(noise, filter, gain);
  }
}

export const ambientAudio = new AmbientAudioController();
