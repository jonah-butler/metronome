import type { DropdownOptions } from '../components/Dropdown';
import { beatCountData } from '../data';
import { type BeatState } from '../timing_engine/rhythm.types';
import { Subdivisions } from '../timing_engine/types';

export const getSubdivision = (subdivisionKey: string): number => {
  return Subdivisions[subdivisionKey as keyof typeof Subdivisions];
};

const FOUR_BEATS = beatCountData[3];

export const getBeatCount = (beats: number): DropdownOptions => {
  return beatCountData.find((b) => b.value === beats.toString()) || FOUR_BEATS;
};

export const getBeatState = (
  beats: number,
  subdivisionKey: string | number,
): BeatState[] => {
  let subdivision: number;
  if (typeof subdivisionKey === 'string') {
    subdivision = getSubdivision(subdivisionKey);
  } else {
    subdivision = subdivisionKey;
  }

  return new Array(beats / subdivision).fill(1);
};
