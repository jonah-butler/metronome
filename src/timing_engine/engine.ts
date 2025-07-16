import { type NotePlayer, Oscillator } from './oscillator';

export type SchedulerParams = {
  audioCtx: AudioContext;
  subdivision: number;
  secondsPerBeat: number;
  sound: NotePlayer;
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

export class Scheduler {
  static LOOK_AHEAD = 0.1;
  static DEFAULT_SUBDIVISION = Subdivisions.base;
  static DEFAULT_SECONDS_PER_BEAT = 1;

  // generates defaults for a base scheduler
  static schedulerDefaults(): SchedulerParams {
    const audioCtx = new AudioContext();

    return {
      audioCtx,
      subdivision: Scheduler.DEFAULT_SUBDIVISION,
      secondsPerBeat: Scheduler.DEFAULT_SECONDS_PER_BEAT,
      sound: new Oscillator(audioCtx, 1000),
    } as SchedulerParams;
  }

  /**
   *
   * @param beats antecedent rhythm
   * @param beatsPerSecond the tempo
   * @param polyrhythm the desired consequent rhythm
   * @returns <number>
   *
   * The Scheduler uses the beatsPerSecond value to schedule
   * notes to the oscillator. This functions returns that float
   * provided by the root Scheduler values.
   */
  static calculateBeatsPerSecond(
    beats: number,
    beatsPerSecond: number,
    polyrhythm: number,
  ): number {
    return (beats * beatsPerSecond) / polyrhythm;
  }

  /**
   *
   * @param denominator
   * @returns <number>
   *  either bpm or secondsPerBeat
   *
   */
  static bpmAndSPB(denominator: number): number {
    return 60 / denominator;
  }

  private beats = 0;
  private nextNote = 0;
  private isRunning = false;
  private beatsPerMeasure = 4;
  private activeOscillators: OscillatorNode[] = [];

  // constructor
  audioCtx: AudioContext;
  subdivision: number;
  secondsPerBeat: number;
  sound: NotePlayer;

  constructor({
    audioCtx,
    subdivision,
    secondsPerBeat,
    sound,
  }: SchedulerParams) {
    this.audioCtx = audioCtx;
    this.subdivision = subdivision ?? 1;
    this.secondsPerBeat = secondsPerBeat ?? 1;
    this.sound = sound;
    console.log(this.secondsPerBeat);
  }

  get currentTime(): number {
    return this.audioCtx.currentTime;
  }

  get numOfBeats(): number {
    return this.beatsPerMeasure * Math.round(1 / this.subdivision);
  }

  get beatsPerQuarter(): number {
    return Math.round(this.secondsPerBeat / this.subdivision);
  }

  private schedule(): void {
    if (!this.isRunning) return;
    console.log('next note: ', this.secondsPerBeat * this.subdivision);

    while (this.nextNote < this.currentTime + Scheduler.LOOK_AHEAD) {
      this.scheduleNote();
      this.nextNote += this.secondsPerBeat * this.subdivision;
    }

    if (this.isRunning) {
      requestAnimationFrame((): void => this.schedule());
    }
  }

  private scheduleNote(): void {
    const osc = this.sound.play(this.nextNote);

    this.activeOscillators.push(osc);

    osc.onended = () => {
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };

    if (this.beats === this.numOfBeats - 1) {
      this.beats = 0;
    } else {
      this.beats += 1;
    }
  }

  start(): boolean {
    this.nextNote = this.currentTime;
    this.isRunning = true;
    this.schedule();

    return this.isRunning;
  }

  stop(): boolean {
    this.isRunning = false;
    this.beats = 0;
    this.nextNote = 0;

    for (const osc of this.activeOscillators) {
      osc.stop();
    }

    this.activeOscillators = [];

    return this.isRunning;
  }

  updateSPB(spb: number): void {
    this.secondsPerBeat = spb;
  }
}
