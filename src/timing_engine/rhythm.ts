import { EventEmitter } from 'events';
import { type NotePlayer } from './oscillator.types';
import { type RhythmParams } from './rhythm.types';

export class Rhythm extends EventEmitter {
  private killed = true;
  private step: number = 0;
  private activeOscillators: OscillatorNode[] = [];

  poly: number;
  beats: number;
  sound: NotePlayer;
  nextNote = 0;
  beatTrack: number;
  subdivision: number;

  constructor({ beats, subdivision, sound, poly }: RhythmParams) {
    super();
    this.beats = beats;
    this.subdivision = subdivision;
    this.sound = sound;
    this.poly = poly ?? beats;
    this.beatTrack = 1;
  }

  private spb(bpm: number): number {
    return (this.beats * (60 / bpm)) / this.poly;
  }

  private cleanFloat(value: number, threshold = 1e-12): number {
    const rounded = Math.round(value);
    return Math.abs(rounded - value) < threshold ? rounded : value;
  }

  private isFloat(value: number): boolean {
    return !Number.isInteger(value);
  }

  private get isSubdividedNote(): boolean {
    return this.isFloat(this.beatTrack);
  }

  private trackBeat(): void {
    const beatSource = this.beats !== this.poly ? this.poly : this.beats;

    const totalSteps = Math.round(beatSource / this.subdivision);

    this.step = (this.step + 1) % totalSteps;

    this.beatTrack = this.cleanFloat(this.step * this.subdivision + 1);
  }

  private get isBeatOne(): boolean {
    return this.beatTrack === 1;
  }

  init(currentTime: number): void {
    this.nextNote = currentTime;
    this.killed = false;
    this.step = 0;
    this.beatTrack = 1;
  }

  advance(targetBpm: number, currentTime: number): void {
    const spb = this.spb(targetBpm);
    const step = spb * this.subdivision;

    this.nextNote = Math.max(this.nextNote + step, currentTime + step);

    this.trackBeat();
  }

  play(): void {
    const tempBeat = this.beatTrack;

    const osc = this.sound.play(
      this.nextNote,
      this.isBeatOne,
      this.isSubdividedNote,
    );

    this.activeOscillators.push(osc);

    osc.onended = (): void => {
      if (!this.killed) {
        this.emit('beatChange', tempBeat);
      }

      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
  }

  kill(): void {
    this.killed = true;

    for (const osc of this.activeOscillators) {
      osc.stop();
    }

    this.beatTrack = 1;
    this.step = 0;
    this.emit('beatChange', 1);
    this.activeOscillators = [];
  }
}
