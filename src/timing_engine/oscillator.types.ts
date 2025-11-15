export interface NotePlayer {
  play(
    startTime: number,
    isFirstNote: boolean,
    isSubdividedNote: boolean,
  ): OscillatorNode;
  updateFrequency(frequency: number): void;
}
