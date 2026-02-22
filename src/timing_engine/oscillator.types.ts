export interface NotePlayer {
  play(
    startTime: number,
    isFirstNote: boolean,
    isSubdividedNote: boolean,
    // output: AudioNode | null,
  ): OscillatorNode;
  setupBuffer(): void;
  updateFrequency(frequency: number): void;
  updateFrequencyData(data: FrequencyData): void;
}

export type FrequencyData = {
  frequency: number;
  beatOneOffset: number;
  subdividedOffset: number;
  gain: number;
};
