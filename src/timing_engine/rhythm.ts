import { type NotePlayer } from './oscillator';

type RhythmParams = {
  beats: number; // total beats in cycle (e.g. 4 for 4/4)
  subdivision: number; // fraction (1, 1/2, 1/3, etc.)
  sound: NotePlayer;
  bpm: number;
  poly?: number; // for polyrhythms, e.g. 3 over 4
};

export class Rhythm {
  private activeOscillators: OscillatorNode[] = [];

  startTime = 0;
  beatsElapsed = 0;
  nextNote = 0;

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

  init(currentTime: number): void {
    this.startTime = currentTime;
    this.beatsElapsed = 0;
    this.nextNote = currentTime;
  }

  advance(targetBpm: number, currentTime: number): void {
    const spb = this.spb(targetBpm);
    const step = spb * this.subdivision;

    this.nextNote = Math.max(this.nextNote + step, currentTime + step);
    this.bpm = targetBpm; // no gradual ramp here
  }

  play(): void {
    console.log('playing: ', this.nextNote);
    const osc = this.sound.play(this.nextNote);

    this.activeOscillators.push(osc);

    osc.onended = (): void => {
      this.activeOscillators = this.activeOscillators.filter((o) => o !== osc);
    };
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
