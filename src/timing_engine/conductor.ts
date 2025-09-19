import { EventEmitter } from 'events';
import { type ConductorParams } from './conductor.types';
import { Rhythm } from './rhythm';

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

  async start(): Promise<boolean> {
    for (const rhythm of this.rhythms) {
      await this.audioCtx.resume();
      rhythm.init(this.currentTime);
    }

    this.isRunning = true;
    this.schedule();

    this.emit('isRunning', this.isRunning);
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

  getRhythm(index: number): Rhythm {
    return this.rhythms[index];
  }
}
