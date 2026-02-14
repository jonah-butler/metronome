import { type RhythmBlock } from './BuilderContext.types';

export const totalMeasures = (blocks: RhythmBlock[]): number => {
  return blocks
    .map((b) => b.measures)
    .reduce((a, b) => {
      return a + b;
    });
};

export const averageTempo = (blocks: RhythmBlock[]): number => {
  const tempos = blocks.map((b) => b.bpm);
  return Math.floor(tempos.reduce((a, b) => a + b) / tempos.length);
};

export const totalTime = (blocks: RhythmBlock[]): string => {
  const minutes = blocks.map((block) => {
    return (Number(block.beats.value) / block.bpm) * block.measures;
  });

  return minutes
    .reduce((a, b) => {
      return a + b;
    })
    .toFixed(2)
    .replace('.', ':');
};
