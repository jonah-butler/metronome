import { EventEmitter } from 'events';
import { type NotePlayer } from './oscillator';

type RhythmParams = {
  beats: number;
  subdivision: number;
  sound: NotePlayer;
  bpm: number;
  poly?: number;
};

export class Rhythm extends EventEmitter {
  private killed = true;
  private activeOscillators: OscillatorNode[] = [];

  bpm: number;
  poly: number;
  beats: number;
  sound: NotePlayer;
  nextNote = 0;
  beatTrack: number;
  subdivision: number;

  constructor({ beats, subdivision, sound, bpm, poly }: RhythmParams) {
    super();
    this.beats = beats;
    this.subdivision = subdivision;
    this.sound = sound;
    this.bpm = bpm;
    this.poly = poly ?? beats;
    this.beatTrack = 1;
  }

  private spb(bpm: number): number {
    return (this.beats * (60 / bpm)) / this.poly;
  }

  private cleanFloat(value: number, threshold = 1e-15): number {
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

    // let rawValue: number;
    // console.log(beatSource + 1 - this.subdivision);
    // if (
    //   this.beatTrack <= beatSource
    //   // this.beatTrack <= beatSource + 1 - this.subdivision
    // ) {
    //   rawValue = (this.beatTrack % (beatSource + 1)) + 1 * this.subdivision;
    // } else {
    //   rawValue = (this.beatTrack % beatSource) + 1 * this.subdivision;
    // }
    const rawValue = (this.beatTrack % beatSource) + 1 * this.subdivision;
    this.beatTrack = this.cleanFloat(rawValue);
  }

  private get isBeatOne(): boolean {
    return this.beatTrack === 1;
  }

  init(currentTime: number): void {
    this.nextNote = currentTime;
    this.killed = false;
  }

  advance(targetBpm: number, currentTime: number): void {
    const spb = this.spb(targetBpm);
    const step = spb * this.subdivision;

    this.nextNote = Math.max(this.nextNote + step, currentTime + step);
    this.bpm = targetBpm;

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
    this.emit('beatChange', 1);
    this.activeOscillators = [];
  }
}
