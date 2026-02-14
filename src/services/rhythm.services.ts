import { v4 as uuidv4 } from 'uuid';
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

export const sanitizeOption = (option: DropdownOptions) => {
  const clonedOption = { ...option };
  delete clonedOption.icon;
  return clonedOption;
};

export const generateUUID = (): string => {
  const crypto = window.crypto;
  if (window.crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return uuidv4();
};
