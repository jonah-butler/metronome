import { EventEmitter } from 'events';
import { type NotePlayer } from './oscillator.types';
import { type BeatState, type RhythmParams } from './rhythm.types';

export class Rhythm extends EventEmitter {
  private killed = true;
  private step: number = 0;
  activeOscillators: OscillatorNode[] = [];
  private pendingSubdivision: number | null = null;
  private lastBpmVersionEmitted = -1; // <- new

  poly: number; // optional poly beats defaults to [beats] value if undefined
  beats: number; // num of beats in a measure
  sound: NotePlayer; // instanceof NotePlayer(osciallator)
  nextNote = 0; // the look ahead in absolute time in relation to the atomic clock
  beatTrack: number; // tracks total num of beats - for UI
  subdivision: number; // current subdivision
  state: BeatState[]; // current BeatState for determining if a note should be played or not

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
    return (this.beats * (60 / bpm)) / this.poly;
  }

  get isPolyrhythm(): boolean {
    return this.beats !== this.poly;
  }

  private toTicksPerBeat(sub: number): number {
    return sub < 1 ? 1 / sub : sub;
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

  private generateBeatTable(): number[] {
    if (!this.pendingSubdivision) return [];

    let beatIndex = 1;
    const beatGrid = [];

    const beatSource = this.beats !== this.poly ? this.poly : this.beats;
    const totalSteps = Math.round(beatSource / this.pendingSubdivision);

    while (beatIndex <= totalSteps) {
      let beat: number;
      if (beatGrid.length === 0) {
        beat = beatIndex;
      } else {
        beat = beatGrid[beatGrid.length - 1];
        // works but idk if i like this
        beat = this.cleanFloat((beat += this.pendingSubdivision));
      }

      beatGrid.push(beat);
      beatIndex++;
    }

    return beatGrid;
  }

  private getNextValidBeat(beatGrid: number[]): { step: number; beat: number } {
    let validBeat = 1;
    let index = 0;
    for (const beat of beatGrid) {
      if (validBeat <= this.beatTrack) {
        validBeat = beat;
      }

      if (validBeat > this.beatTrack) {
        // console.log(this.beatTrack);
        break;
      }

      index++;
    }

    return { step: index, beat: validBeat };
  }

  private trackBeat(): void {
    const beatSource = this.beats !== this.poly ? this.poly : this.beats;
    const totalSteps = Math.round(beatSource / this.subdivision);

    if (this.pendingSubdivision) {
      const beatTable = this.generateBeatTable();
      const nextBeatData = this.getNextValidBeat(beatTable);

      this.step = nextBeatData.step;
      this.subdivision = this.pendingSubdivision;
      this.beatTrack = nextBeatData.beat;
      this.pendingSubdivision = null;
      return;
    }

    this.step = (this.step + 1) % totalSteps;
    this.beatTrack = this.cleanFloat(this.step * this.subdivision + 1);
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

  private beatSource(): number {
    return this.beats !== this.poly ? this.poly : this.beats;
  }

  advance(targetBpm: number, currentTime: number): void {
    const secondsPerBeat = 60 / targetBpm;
    const rhythmBeatScale = this.beats / this.poly;

    if (this.pendingSubdivision) {
      const toTpb = this.toTicksPerBeat(this.pendingSubdivision);

      const phi = this.beatTrack - 1;

      const k = Math.ceil(phi * toTpb);

      const totalStepsNew = this.beatSource() * toTpb;
      this.step = k % totalStepsNew;
      this.subdivision = this.pendingSubdivision;
      this.beatTrack = this.cleanFloat(k / toTpb + 1);
      this.pendingSubdivision = null;

      const deltaBeats = k / toTpb - phi;
      const deltaTime = deltaBeats * secondsPerBeat * rhythmBeatScale;

      const anchor = Math.max(currentTime, this.nextNote);
      this.nextNote = anchor + deltaTime;
    }

    const tpb = this.toTicksPerBeat(this.subdivision);
    const tickSeconds = (secondsPerBeat * rhythmBeatScale) / tpb;

    if (this.nextNote <= currentTime) {
      const stepsLate =
        Math.floor((currentTime - this.nextNote) / tickSeconds) + 1;
      this.nextNote += stepsLate * tickSeconds;
      for (let i = 0; i < stepsLate; i++) this.trackBeat();
    } else {
      this.nextNote += tickSeconds;
      this.trackBeat();
    }
  }

  applyTempoChange(oldBpm: number, newBpm: number, currentTime: number): void {
    // If this note is already due or in the past, let advance() handle catching up.
    if (this.nextNote <= currentTime) return;

    const oldSecondsPerBeat = 60 / oldBpm;
    const newSecondsPerBeat = 60 / newBpm;

    const rhythmBeatScale = this.beats / this.poly; // same scale you use in advance()
    const tpb = this.toTicksPerBeat(this.subdivision); // ticks per beat based on subdivision

    const oldTickSeconds = (oldSecondsPerBeat * rhythmBeatScale) / tpb;
    const newTickSeconds = (newSecondsPerBeat * rhythmBeatScale) / tpb;

    // How much of the *current* tick is left under the old tempo?
    const remainingOld = this.nextNote - currentTime;
    const fractionRemaining = remainingOld / oldTickSeconds;

    // Preserve phase: same fraction of the new tick’s duration
    const remainingNew = fractionRemaining * newTickSeconds;

    this.nextNote = currentTime + remainingNew;
  }

  play(): void {
    const tempBeat = this.beatTrack;

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
        }

        this.activeOscillators = this.activeOscillators.filter(
          (o) => o !== osc,
        );
      };
    } else {
      this.emit('beatChange', tempBeat);
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
    console.log('updating sub');
    this.pendingSubdivision = subdivision;
    // this.subdivision = subdivision;
  }

  updateFrequency(frequency: number): void {
    this.sound.updateFrequency(frequency);
  }
}
