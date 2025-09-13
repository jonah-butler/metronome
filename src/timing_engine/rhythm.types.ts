import { type NotePlayer } from './oscillator.types';

export type RhythmParams = {
  beats: number;
  subdivision: number;
  sound: NotePlayer;
  state: BeatState[];
  poly?: number;
};

export type BeatState = 0 | 1;
