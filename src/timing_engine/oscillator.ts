import { type FrequencyData, type NotePlayer } from './oscillator.types';

export class Oscillator implements NotePlayer {
  private bufferSize = 0;
  private buffer: AudioBuffer | null = null;
  private bufferData: Float32Array<ArrayBuffer> | null = null;

  audioCtx: AudioContext;
  frequency: number;
  beatOneOffset: number;
  subdividedOffset: number;
  gain: number;
  // rampedValue: number;
  // filter: BiquadFilterType;

  constructor(
    audioCtx: AudioContext,
    frequency: number,
    beatOneOffset: number,
    subdividedOffset: number,
    gain: number,
    // rampedValue?: number,
    // filter?: BiquadFilterType,
  ) {
    this.audioCtx = audioCtx;
    this.frequency = frequency;
    this.beatOneOffset = beatOneOffset;
    this.subdividedOffset = subdividedOffset;
    this.gain = gain;
    // this.rampedValue = rampedValue ?? 0.2;
    // this.filter = filter ?? 'highpass';

    // setup buffer
  }

  // connect eventually
  setupBuffer() {
    this.bufferSize = this.audioCtx.sampleRate * 0.1;
    this.buffer = this.audioCtx.createBuffer(
      1,
      this.bufferSize,
      this.audioCtx.sampleRate,
    );
    this.bufferData = this.buffer.getChannelData(0);
    for (let i = 0; i < this.bufferSize; i++) {
      this.bufferData[i] = Math.random() * 2 - 1;
    }
  }

  play(
    startTime: number,
    isFirstNote: boolean,
    isSubdividedNote: boolean,
  ): OscillatorNode {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';

    // compute base frequency
    let freq = this.frequency;
    if (isFirstNote) freq = freq * this.calculateInterval(this.beatOneOffset);
    else if (isSubdividedNote) {
      const interval = this.calculateInterval(this.subdividedOffset);
      console.log(interval);
      if (this.subdividedOffset <= 0) {
        freq = freq / interval;
      } else {
        freq = freq * interval;
      }
    }

    osc.frequency.setValueAtTime(freq, startTime);

    // connect chain properly
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    // avoid negative time scheduling
    const safeStart = Math.max(0, startTime - 0.005);

    gain.gain.setValueAtTime(0.01, safeStart);
    gain.gain.exponentialRampToValueAtTime(this.gain, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.045);

    osc.start(startTime);
    osc.stop(startTime + 0.05);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    return osc;
  }

  updateFrequency(frequency: number): void {
    this.frequency = frequency;
  }

  calculateInterval(range: number): number {
    switch (range) {
      case -5:
        return 2;
      case -4:
        return 3 / 2;
      case -3:
        return 3 / 2;
      case -2:
        return 4 / 3;
      case -1:
        return 5 / 4;
      case 0:
        return 6 / 5;
      case 1:
        return 1;
      case 2:
        return 6 / 5;
      case 3:
        return 5 / 4;
      case 4:
        return 4 / 3;
      case 5:
        return 3 / 2;
      case 6:
        return 2;
      default:
        return 1;
    }
  }

  updateFrequencyData(data: FrequencyData): void {
    this.frequency = data.frequency;
    this.beatOneOffset = data.beatOneOffset;
    this.subdividedOffset = data.subdividedOffset;
    this.gain = data.gain;
  }
}
