import { EventEmitter } from 'events';
import { type NotePlayer } from './oscillator.types';
import { type BeatState, type RhythmParams } from './rhythm.types';

export class Rhythm extends EventEmitter {
  private killed = true;
  private step: number = 0;
  private activeOscillators: OscillatorNode[] = [];
  private pendingSubdivision: number | null = null;

  poly: number;
  beats: number;
  sound: NotePlayer;
  nextNote = 0;
  beatTrack: number;
  subdivision: number;
  state: BeatState[];

  constructor({ beats, subdivision, sound, poly, state }: RhythmParams) {
    super();
    this.beats = beats;
    this.subdivision = subdivision;
    this.sound = sound;
    this.poly = poly ?? beats;
    this.beatTrack = 1;
    this.state = state;
  }

  private spb(bpm: number): number {
    console.log((this.beats * (60 / bpm)) / this.poly);
    return (this.beats * (60 / bpm)) / this.poly;
  }

  private toTicksPerBeat(sub: number): number {
    // If sub < 1, it's a duration factor (e.g., 0.5 for eighths) -> invert it.
    // If sub >= 1, assume it's a count (e.g., 2 for eighths) -> use as-is.
    return sub < 1 ? 1 / sub : sub;
  }

  // private totalBeats(): number {
  //   return this.beats / this.subdivision;
  // }

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
    // console.log('************');
    // console.log('subdivision: ', this.subdivision);
    const beatSource = this.beats !== this.poly ? this.poly : this.beats;

    const totalSteps = Math.round(beatSource / this.subdivision);

    // IGNORE FOR NOW
    if (this.pendingSubdivision) {
      // console.log('beat track in pending: ', this.beatTrack);
      // console.log('pending sub: ', this.pendingSubdivision);
      // console.log(this.beatTrack / this.pendingSubdivision);

      const convertedSteps =
        Math.floor(this.beatTrack) / this.pendingSubdivision -
        1 / this.pendingSubdivision;
      // console.log('converted: ', convertedSteps);

      this.step = convertedSteps;

      this.subdivision = this.pendingSubdivision;

      this.beatTrack = this.cleanFloat(this.step * this.subdivision + 1);
      // console.log('adjusted beat track', this.beatTrack);

      this.pendingSubdivision = null;
      return;
    }

    this.step = (this.step + 1) % totalSteps;
    // console.log('step: ', this.step);

    this.beatTrack = this.cleanFloat(this.step * this.subdivision + 1);
    // console.log('beat track: ', this.beatTrack);
  }

  private get isBeatOne(): boolean {
    return this.beatTrack === 1;
  }

  private get currentBeat(): number {
    return Math.round((this.beatTrack - 1) / this.subdivision) + 1;
  }

  init(currentTime: number): void {
    this.nextNote = currentTime;
    this.killed = false;
    this.step = 0;
    this.beatTrack = 1;
  }

  advance(targetBpm: number, currentTime: number): void {
    const secondsPerBeat = 60 / targetBpm;

    // Normalize subdivision into "ticks per beat"
    const ticksPerBeat = this.toTicksPerBeat(this.subdivision);

    // This rhythm’s beat length vs the bar (handles polyrhythms)
    const rhythmBeatScale = this.beats / this.poly;

    // One tick duration in seconds
    const step = secondsPerBeat * rhythmBeatScale * (1 / ticksPerBeat);

    if (this.nextNote <= currentTime) {
      const stepsLate = Math.floor((currentTime - this.nextNote) / step) + 1;
      this.nextNote += stepsLate * step;
      for (let i = 0; i < stepsLate; i++) this.trackBeat();
    } else {
      this.nextNote += step;
      this.trackBeat();
    }
  }

  play(bpm: number): void {
    const tempBeat = this.beatTrack;
    console.log('playing beat: ', tempBeat);

    if (this.state[this.currentBeat - 1]) {
      const osc = this.sound.play(
        this.nextNote,
        this.isBeatOne,
        this.isSubdividedNote,
      );

      this.activeOscillators.push(osc);

      osc.onended = (): void => {
        if (!this.killed) {
          this.emit('beatChange', tempBeat);
          this.emit('bpm', bpm);
        }

        this.activeOscillators = this.activeOscillators.filter(
          (o) => o !== osc,
        );
      };
    } else {
      this.emit('beatChange', tempBeat);
      this.emit('bpm', bpm);
    }
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

  updateState(index: number, state: BeatState): void {
    this.state[index] = state;
  }

  resetState(state: BeatState[]): void {
    this.state = state;
  }

  setSubdivision(subdivision: number): void {
    this.pendingSubdivision = subdivision;
    // this.subdivision = subdivision;
  }
}
