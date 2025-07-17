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
  quintuplets: 1 / 5,
  sextuplet: 1 / 6,
  septuplet: 1 / 7,
  octuplet: 1 / 8,
  nonuplet: 1 / 9,
  decuplet: 1 / 10,
};

export class Conductor {
  static LOOK_AHEAD = 0.2;

  private isRunning = false;
  private rhythms: Rhythm[] = [];

  audioCtx: AudioContext;
  bpm: number;

  constructor({ audioCtx, bpm }: ConductorParams) {
    this.audioCtx = audioCtx;
    this.bpm = bpm;
  }

  private get currentTime(): number {
    return this.audioCtx.currentTime;
  }

  private schedule(): void {
    if (!this.isRunning) return;

    for (const rhythm of this.rhythms) {
      while (rhythm.nextNote < this.currentTime + Conductor.LOOK_AHEAD) {
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

  start(): boolean {
    const currentTime = this.currentTime;
    for (const rhythm of this.rhythms) {
      rhythm.init(currentTime);
    }

    this.isRunning = true;
    this.schedule();
    return this.isRunning;
  }

  stop(): boolean {
    this.isRunning = false;
    for (const rhythm of this.rhythms) {
      rhythm.kill();
    }

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
