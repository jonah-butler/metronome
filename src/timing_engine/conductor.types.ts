import type { RhythmBlock } from '../context/BuilderContext.types';

export interface Conductor {
  on(event: 'workflowBlock', listener: (data: WorkflowEmit) => void): this;
}

export type ConductorParams = {
  audioCtx: AudioContext;
  bpm: number;
  workflow?: RhythmBlock[];
};

export type WorkflowEmit = {
  id: string;
  index: number;
  bpm: number;
  measures: number;
  beats: number;
};
