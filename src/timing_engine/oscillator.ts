export interface NotePlayer {
  play(startTime: number, isFirst: boolean): OscillatorNode;
}

export class Oscillator implements NotePlayer {
  audioCtx: AudioContext;
  frequency: number;

  constructor(audioCtx: AudioContext, frequency: number) {
    this.audioCtx = audioCtx;
    this.frequency = frequency;
  }

  play(startTime: number, isFirst: boolean): OscillatorNode {
    const osc = this.audioCtx.createOscillator();
    osc.type = 'square';
    const gain = this.audioCtx.createGain();

    osc.frequency.setValueAtTime(this.frequency, startTime);

    if (isFirst) {
      osc.frequency.setValueAtTime(this.frequency + 200, startTime);
    } else {
      osc.frequency.setValueAtTime(this.frequency, startTime);
    }

    osc.connect(gain);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(1, startTime + 0.001);
    gain.gain.linearRampToValueAtTime(0, startTime + 0.05);

    osc.connect(this.audioCtx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.05);

    return osc;
  }
}
