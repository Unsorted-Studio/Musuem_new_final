/**
 * Procedural and Custom Web Audio API romantic soundtrack.
 * Supports selectable romantic piano themes or admin-uploaded audio files/URLs.
 */

export interface TrackMetadata {
  id: string;
  title: string;
  composer: string;
  description: string;
}

export const SOUNDTRACK_OPTIONS: TrackMetadata[] = [
  {
    id: 'clair-de-lune',
    title: 'Clair de Lune',
    composer: 'Claude Debussy',
    description: 'Dreamy impressionist arpeggios in D-flat major, evoking moonlit romance.',
  },
  {
    id: 'chopin-nocturne',
    title: 'Nocturne Op. 9 No. 2',
    composer: 'Frédéric Chopin',
    description: 'Tender, intimate piano nocturne with lyrical romantic warmth.',
  },
  {
    id: 'canon-in-d',
    title: 'Canon in D Romance',
    composer: 'Johann Pachelbel',
    description: 'The timeless harmonic progression symbolizing everlasting love.',
  },
  {
    id: 'moonlight-sonata',
    title: 'Moonlight Sonata',
    composer: 'Ludwig van Beethoven',
    description: 'Gentle, meditative triplets in C-sharp minor with serene elegance.',
  },
  {
    id: 'custom',
    title: 'My Custom Song / Audio File',
    composer: 'Selected by Admin',
    description: 'Play your own uploaded couple song or external audio track.',
  },
];

class RomanticSoundtrack {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private intervalId: number | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.45;
  private noteIndex = 0;
  private currentTrackId = 'clair-de-lune';
  private customAudio: HTMLAudioElement | null = null;
  private customAudioUrl: string | null = null;

  // Track chord progressions
  private progressions: Record<string, Array<{ bass: number; notes: number[]; speed: number }>> = {
    'clair-de-lune': [
      { bass: 138.59, notes: [207.65, 277.18, 329.63, 415.30], speed: 4200 },
      { bass: 110.00, notes: [164.81, 220.00, 277.18, 329.63], speed: 4200 },
      { bass: 92.50, notes: [138.59, 185.00, 220.00, 277.18], speed: 4200 },
      { bass: 123.47, notes: [185.00, 246.94, 277.18, 369.99], speed: 4200 },
    ],
    'chopin-nocturne': [
      { bass: 155.56, notes: [233.08, 311.13, 392.00, 466.16], speed: 3800 },
      { bass: 130.81, notes: [196.00, 261.63, 311.13, 392.00], speed: 3800 },
      { bass: 116.54, notes: [174.61, 233.08, 293.66, 349.23], speed: 3800 },
      { bass: 103.83, notes: [155.56, 207.65, 261.63, 311.13], speed: 3800 },
    ],
    'canon-in-d': [
      { bass: 146.83, notes: [220.00, 293.66, 369.99, 440.00], speed: 3600 },
      { bass: 98.00, notes: [146.83, 196.00, 246.94, 293.66], speed: 3600 },
      { bass: 110.00, notes: [164.81, 220.00, 261.63, 329.63], speed: 3600 },
      { bass: 82.41, notes: [123.47, 164.81, 207.65, 246.94], speed: 3600 },
      { bass: 87.31, notes: [130.81, 174.61, 220.00, 261.63], speed: 3600 },
      { bass: 73.42, notes: [110.00, 146.83, 185.00, 220.00], speed: 3600 },
    ],
    'moonlight-sonata': [
      { bass: 138.59, notes: [164.81, 220.00, 277.18, 329.63], speed: 4500 },
      { bass: 123.47, notes: [146.83, 196.00, 246.94, 293.66], speed: 4500 },
      { bass: 110.00, notes: [138.59, 174.61, 220.00, 277.18], speed: 4500 },
      { bass: 103.83, notes: [123.47, 164.81, 207.65, 246.94], speed: 4500 },
    ],
  };

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setTrack(trackId: string, customUrl?: string): void {
    const wasPlaying = this.isPlaying;
    if (wasPlaying) this.pause();

    this.currentTrackId = trackId;
    if (customUrl) {
      this.customAudioUrl = customUrl;
    }

    if (wasPlaying) {
      this.play();
    }
  }

  public getCurrentTrackId(): string {
    return this.currentTrackId;
  }

  public play(): void {
    if (this.isPlaying) return;
    this.ensureContext();
    this.isPlaying = true;

    // Handle custom audio playback if selected
    if (this.currentTrackId === 'custom' && this.customAudioUrl) {
      try {
        if (!this.customAudio) {
          this.customAudio = new Audio(this.customAudioUrl);
          this.customAudio.loop = true;
        } else {
          this.customAudio.src = this.customAudioUrl;
        }
        this.customAudio.volume = this.volume;
        this.customAudio.play().catch(() => {});
        return;
      } catch {
        // Fallback to procedural
      }
    }

    // Procedural Piano Synthesis
    const chords = this.progressions[this.currentTrackId] || this.progressions['clair-de-lune'];

    let step = 0;
    const playNextBar = () => {
      if (!this.isPlaying) return;
      const currentChord = chords[this.noteIndex % chords.length];

      // Soft bass note
      this.synthesizePianoNote(currentChord.bass, 0.32, 3.4, 'sine');

      // Arpeggiate
      currentChord.notes.forEach((freq, i) => {
        const delay = (i * 0.48) + (Math.random() * 0.04);
        setTimeout(() => {
          if (this.isPlaying) {
            this.synthesizePianoNote(freq, 0.2, 2.6, 'triangle');
          }
        }, delay * 1000);
      });

      // Upper octave melody
      if (step % 2 === 1) {
        setTimeout(() => {
          if (this.isPlaying) {
            const highFreq = currentChord.notes[Math.floor(Math.random() * currentChord.notes.length)] * 2;
            this.synthesizePianoNote(highFreq, 0.12, 3.0, 'sine');
          }
        }, 1900);
      }

      this.noteIndex++;
      step++;
    };

    playNextBar();
    const intervalSpeed = chords[0]?.speed || 4000;
    this.intervalId = window.setInterval(playNextBar, intervalSpeed);
  }

  public pause(): void {
    this.isPlaying = false;
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.customAudio) {
      this.customAudio.pause();
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.customAudio) {
      this.customAudio.volume = this.volume;
    }
  }

  private synthesizePianoNote(freq: number, gainLevel: number, duration: number, type: OscillatorType = 'sine'): void {
    try {
      const ctx = this.ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(820, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + duration);

      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(gainLevel * this.volume, now + 0.09);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain || ctx.destination);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    } catch {}
  }

  public playInspectChime(): void {
    try {
      const ctx = this.ensureContext();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
        setTimeout(() => {
          this.synthesizePianoNote(freq, 0.16, 1.6, 'sine');
        }, idx * 90);
      });
    } catch {}
  }

  public playCameraSwitch(): void {
    try {
      const ctx = this.ensureContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.14);
      gain.gain.setValueAtTime(0.06 * this.volume, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {}
  }

  private lastStepTime = 0;
  public playFootstep(): void {
    const now = Date.now();
    if (now - this.lastStepTime < 380) return;
    this.lastStepTime = now;
    try {
      const ctx = this.ensureContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(75 + Math.random() * 15, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.07);
      gain.gain.setValueAtTime(0.03 * this.volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain || ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    } catch {}
  }
}

export const soundtrack = new RomanticSoundtrack();
