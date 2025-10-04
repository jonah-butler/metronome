import { type NotePlayer } from './oscillator.types';

export class Oscillator implements NotePlayer {
  audioCtx: AudioContext;
  frequency: number;

  constructor(audioCtx: AudioContext, frequency: number) {
    this.audioCtx = audioCtx;
    this.frequency = frequency;
  }

  play(
    startTime: number,
    isFirstNote: boolean,
    isSubdividedNote: boolean,
  ): OscillatorNode {
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    // compute base frequency
    let freq = this.frequency;
    if (isFirstNote) freq += 200;
    else if (isSubdividedNote) freq -= 50;

    osc.frequency.setValueAtTime(freq, startTime);

    // connect chain properly
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    // avoid negative time scheduling
    const safeStart = Math.max(0, startTime - 0.005);

    gain.gain.setValueAtTime(0.001, safeStart);
    gain.gain.exponentialRampToValueAtTime(1, startTime + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.045);

    osc.start(startTime);
    osc.stop(startTime + 0.05);

    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };

    return osc;
  }
}
