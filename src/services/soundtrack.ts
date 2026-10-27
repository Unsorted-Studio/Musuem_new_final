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
      { bass: 138.59, notes: [207.65, 277.18, 329.63, 415.3], speed: 4200 },
      { bass: 110.0, notes: [164.81, 220.0, 277.18, 329.63], speed: 4200 },
      { bass: 92.5, notes: [138.59, 185.0, 220.0, 277.18], speed: 4200 },
      { bass: 123.47, notes: [185.0, 246.94, 277.18, 369.99], speed: 4200 },
    ],
    'chopin-nocturne': [
      { bass: 155.56, notes: [233.08, 311.13, 392.0, 466.16], speed: 3800 },
      { bass: 130.81, notes: [196.0, 261.63, 311.13, 392.0], speed: 3800 },
      { bass: 116.54, notes: [174.61, 233.08, 293.66, 349.23], speed: 3800 },
      { bass: 103.83, notes: [155.56, 207.65, 261.63, 311.13], speed: 3800 },
    ],
    'canon-in-d': [
      { bass: 146.83, notes: [220.0, 293.66, 369.99, 440.0], speed: 3600 },
      { bass: 98.0, notes: [146.83, 196.0, 246.94, 293.66], speed: 3600 },
      { bass: 110.0, notes: [164.81, 220.0, 261.63, 329.63], speed: 3600 },
      { bass: 82.41, notes: [123.47, 164.81, 207.65, 246.94], speed: 3600 },
      { bass: 87.31, notes: [130.81, 174.61, 220.0, 261.63], speed: 3600 },
      { bass: 73.42, notes: [110.0, 146.83, 185.0, 220.0], speed: 3600 },
    ],
    'moonlight-sonata': [
      { bass: 138.59, notes: [164.81, 220.0, 277.18, 329.63], speed: 4500 },
      { bass: 123.47, notes: [146.83, 196.0, 246.94, 293.66], speed: 4500 },
      { bass: 110.0, notes: [138.59, 174.61, 220.0, 277.18], speed: 4500 },
      { bass: 103.83, notes: [123.47, 164.81, 207.65, 246.94], speed: 4500 },
    ],
  };

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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

    if (customUrl && customUrl !== this.customAudioUrl) {
      this.customAudioUrl = customUrl;
      // Destroy old element so the new src is always used
      if (this.customAudio) {
        try {
          this.customAudio.pause();
          this.customAudio.src = '';
        } catch {}
        this.customAudio = null;
      }
    } else if (customUrl) {
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
          this.customAudio.crossOrigin = 'anonymous';
        }
        this.customAudio.volume = this.volume;
        this.customAudio.play().catch((err) => {
          console.warn('Custom audio play blocked or failed:', err);
        });
        return;
      } catch (err) {
        console.warn('Custom audio error, falling back to procedural:', err);
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
        const delay = i * 0.48 + Math.random() * 0.04;
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
            const highFreq =
              currentChord.notes[Math.floor(Math.random() * currentChord.notes.length)] * 2;
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
      try {
        this.customAudio.pause();
      } catch {}
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

  public setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    if (this.customAudio) {
      this.customAudio.volume = this.volume;
    }
  }

  private synthesizePianoNote(
    freq: number,
    volume: number,
    duration: number,
    type: OscillatorType = 'sine'
  ): void {
    if (!this.ctx || !this.masterGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    const now = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume * this.volume, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  public playInspectChime(): void {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this.synthesizePianoNote(freq, 0.15, 0.8, 'sine');
      }, i * 90);
    });
  }

  public playCameraSwitch(): void {
    this.ensureContext();
    this.synthesizePianoNote(440, 0.12, 0.4, 'triangle');
    setTimeout(() => this.synthesizePianoNote(554.37, 0.1, 0.5, 'sine'), 80);
  }
}

export const soundtrack = new RomanticSoundtrack();
