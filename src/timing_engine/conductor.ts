import { Rhythm } from './rhythm';

type ConductorParams = {
  audioCtx: AudioContext;
  bpm: number;
};

export class Conductor {
  static LOOK_AHEAD = 0.4;

  private isRunning = false;
  private rhythms: Rhythm[] = [];

  audioCtx: AudioContext;
  bpm: number;

  constructor({ audioCtx, bpm }: ConductorParams) {
    this.audioCtx = audioCtx;
    this.bpm = bpm;
  }

  get currentTime(): number {
    return this.audioCtx.currentTime;
  }

  private schedule(): void {
    if (!this.isRunning) return;

    const lookAheadEnd = this.currentTime + Conductor.LOOK_AHEAD;

    for (const rhythm of this.rhythms) {
      while (rhythm.nextNote < lookAheadEnd) {
        rhythm.play();
        rhythm.advance(this.bpm, this.currentTime);
      }
    }

    requestAnimationFrame(() => this.schedule());
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

  update(bpm: number): void {
    this.bpm = bpm;
    // No direct call to rhythm.advance() here — let scheduler handle it with graceful ramp
  }
}
