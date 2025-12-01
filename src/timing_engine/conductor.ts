import { Rhythm } from './rhythm';

type ConductorParams = {
  audioCtx: AudioContext;
  bpm: number;
};

export class Conductor {
  static LOOK_AHEAD = 0.4;

  private isRunning = false;
  private rhythms: Rhythm[] = [];
  private smoothedBpm: number;
  private targetBpm: number;

  private globalBeatCount = 0;
  private startTime = 0;

  audioCtx: AudioContext;
  bpm: number;

  constructor({ audioCtx, bpm }: ConductorParams) {
    this.audioCtx = audioCtx;
    this.bpm = bpm;
    this.smoothedBpm = bpm;
    this.targetBpm = bpm;
  }

  get currentTime(): number {
    return this.audioCtx.currentTime;
  }

  addRhythm(...rhythms: Rhythm[]): void {
    this.rhythms = [...this.rhythms, ...rhythms];
  }

  start(): boolean {
    this.startTime = this.currentTime;
    this.globalBeatCount = 0;

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
    this.targetBpm = bpm;
  }

  private schedule(): void {
    if (!this.isRunning) return;

    this.smoothedBpm += (this.targetBpm - this.smoothedBpm) * 0.3;

    const lookAheadEnd = this.currentTime + Conductor.LOOK_AHEAD;

    for (const rhythm of this.rhythms) {
      while (rhythm.nextNote < lookAheadEnd) {
        rhythm.play();
        rhythm.advance(this.smoothedBpm); // unified smoothed bpm
      }
    }

    if (this.isRunning) {
      requestAnimationFrame(() => this.schedule());
    }
  }
}
