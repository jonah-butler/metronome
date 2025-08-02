import { type NotePlayer } from './oscillator.types';

export type RhythmParams = {
  beats: number;
  subdivision: number;
  sound: NotePlayer;
  poly?: number;
};
