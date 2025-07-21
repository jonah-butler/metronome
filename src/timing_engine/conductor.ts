import { EventEmitter } from 'events';
import { Rhythm } from './rhythm';

type ConductorParams = {
  audioCtx: AudioContext;
  bpm: number;
};

export const Subdivisions = {
  base: 1,
  duplet: 1 / 2,
  triplet: 1 / 3,
  quadruplet: 1 / 4,
  quintuplet: 1 / 5,
  sextuplet: 1 / 6,
  septuplet: 1 / 7,
  octuplet: 1 / 8,
  nonuplet: 1 / 9,
  decuplet: 1 / 10,
};

export class Conductor extends EventEmitter {
  static LOOK_AHEAD = 0.1;

  private isRunning = false;
  private rhythms: Rhythm[] = [];

  audioCtx: AudioContext;
  bpm: number;

  constructor({ audioCtx, bpm }: ConductorParams) {
    super();
    this.audioCtx = audioCtx;
    this.bpm = bpm;
  }

  private get currentTime(): number {
    return this.audioCtx.currentTime;
  }

  private schedule(): void {
    if (!this.isRunning) return;

    for (const rhythm of this.rhythms) {
      if (rhythm.nextNote < this.currentTime + Conductor.LOOK_AHEAD) {
        rhythm.play();
        rhythm.advance(this.bpm, this.currentTime);
      }
    }

    if (this.isRunning) {
      requestAnimationFrame(() => this.schedule());
    }
  }

  addRhythm(...rhythms: Rhythm[]): void {
    this.rhythms = [...this.rhythms, ...rhythms];
  }

  removeRhythms(): void {
    if (this.isRunning) {
      this.stop();
    }

    for (const rhythm of this.rhythms) {
      rhythm.removeAllListeners();
    }
    this.rhythms = [];
  }

  start(): boolean {
    const firstNoteTime = this.currentTime;
    for (const rhythm of this.rhythms) {
      rhythm.init(this.currentTime);

      rhythm.play();
      rhythm.advance(this.bpm, this.currentTime);
    }

    this.isRunning = true;
    this.schedule();

    setTimeout(
      () => {
        this.emit('isRunning', this.isRunning);
      },
      (this.currentTime - firstNoteTime) * 1000,
    );
    return this.isRunning;
  }

  stop(): boolean {
    this.isRunning = false;
    for (const rhythm of this.rhythms) {
      rhythm.kill();
    }

    this.emit('isRunning', this.isRunning);
    return this.isRunning;
  }

  update(bpm: number): boolean {
    if (!this.isRunning) {
      this.bpm = bpm;
    } else {
      this.stop();
      this.bpm = bpm;
      this.start();
    }
    return this.isRunning;
  }
}
