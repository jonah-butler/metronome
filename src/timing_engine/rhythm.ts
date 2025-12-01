import { type NotePlayer } from './oscillator';

type RhythmParams = {
  beats: number; // cycle length (e.g. 4 for 4/4)
  subdivision: number; // fraction (1, 1/2, 1/3 etc)
  sound: NotePlayer;
  bpm: number;
  poly?: number; // for polyrhythms, e.g. 3 over 4
};

export class Rhythm {
  private activeOscillators: OscillatorNode[] = [];

  beats: number;
  subdivision: number;
  sound: NotePlayer;
  bpm: number;
  poly: number;

  constructor({ beats, subdivision, sound, bpm, poly }: RhythmParams) {
    this.beats = beats;
    this.subdivision = subdivision;
    this.sound = sound;
    this.bpm = bpm;
    this.poly = poly ?? beats;
  }

  private spb(bpm: number): number {
    return (this.beats * (60 / bpm)) / this.poly;
  }

  advance(smoothedBpm: number): void {
    const step = this.spb(smoothedBpm) * this.subdivision;
    this.nextNote += step;
  }

  scheduleNote(globalBeat: number, bpm: number, noteTime: number): void {
    const cycleLength = this.beats;
    const polyFactor = this.poly;

    // Figure out if this rhythm should play at this global beat
    // e.g. for 3 over 4, plays every (4/3)=1.333 global beats
    const stepLength = cycleLength / polyFactor;
    const relativeStep = globalBeat / stepLength;

    // Use tolerance to handle float math
    if (Math.abs(relativeStep - Math.round(relativeStep)) < 0.0001) {
      const osc = this.sound.play(noteTime);
      this.activeOscillators.push(osc);

      osc.onended = (): void => {
        this.activeOscillators = this.activeOscillators.filter(
          (o) => o !== osc,
        );
      };
    }
  }

  kill(): void {
    for (const osc of this.activeOscillators) {
      try {
        osc.stop();
      } catch (err) {
        console.warn('osc stop failed', err);
      }
    }
    this.activeOscillators = [];
  }
}
