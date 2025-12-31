import { EventEmitter } from 'events';
import { type ConductorParams } from './conductor.types';
import { Rhythm } from './rhythm';

export class Conductor extends EventEmitter {
  static LOOK_AHEAD = 0.1;

  isRunning = false;
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

  get numberOfRhythms(): number {
    return this.rhythms.length;
  }

  private cleanFloat(value: number, threshold = 1e-12): number {
    const rounded = Math.round(value);
    return Math.abs(rounded - value) < threshold ? rounded : value;
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

  generateSubdivisionTable(r1: Rhythm, r2: Rhythm): number[] | undefined {
    const partial = this.cleanFloat(r1.beats / r2.poly);
    const beatPositionGrid = [1];
    for (let i = 0; i < r2.poly - 1; i++) {
      beatPositionGrid.push(beatPositionGrid[i] + partial);
    }

    return beatPositionGrid;
  }

  addRhythm(rhythm: Rhythm): void {
    const hasRhythm = this.rhythms.length === 1;
    rhythm.nextNote = 0;

    if (hasRhythm) {
      const anchor = this.rhythms[0];
      const currentBeat = anchor.beatTrack;
      const beatTable = this.generateSubdivisionTable(anchor, rhythm);
      if (!beatTable) return;

      let nextBeat = beatTable[0];
      let step = 0;

      for (let i = 0; i < beatTable.length; i++) {
        if (beatTable[i] > currentBeat) {
          nextBeat = beatTable[i];
          step = i;
          break;
        }
      }

      const spb = 60 / this.bpm;

      let deltaBeats = nextBeat - currentBeat;
      if (deltaBeats < 0) deltaBeats += rhythm.beats;

      const deltaSeconds = deltaBeats * spb;

      rhythm.nextNote = anchor.nextNote + deltaSeconds;

      rhythm.beatTrack = step + 1;
      rhythm.step = step;

      rhythm.killed = false;
    } else {
      rhythm.init(this.currentTime);
    }

    this.rhythms = [...this.rhythms, rhythm];
  }

  updateBeats(
    updatedBeatCount: number | null,
    updatedPolyBeatCount: number | null,
  ): void {
    for (const rhythm of this.rhythms) {
      rhythm.updateBeats(
        updatedBeatCount,
        updatedPolyBeatCount,
        this.isRunning,
      );
    }
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

  removeRhythm(index: number) {
    if (this.rhythms[index]) {
      this.rhythms = [
        ...this.rhythms.slice(0, index),
        ...this.rhythms.slice(index + 1),
      ];
    }
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

  updateBPM(bpm: number): void {
    const oldBpm = this.bpm;
    this.bpm = bpm;

    const now = this.currentTime;

    for (const rhythm of this.rhythms) {
      rhythm.applyTempoChange(oldBpm, bpm, now);
    }

    this.emit('updateBPM', this.bpm);
  }

  getRhythm(index: number): Rhythm {
    return this.rhythms[index];
  }
}
