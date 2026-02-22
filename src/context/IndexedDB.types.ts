import { type GenericResponse } from '../types';
import { type RhythmBlock } from './BuilderContext.types';

export const DB_VERSION = 3;
export const DB_NAME = 'metronome';

export const DB_STORES = {
  workflows: 'WORKFLOWS',
};

// Workflow Store
export type RhythmBlockStore = {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  blocks: RhythmBlock[];
};

export type SaveWorkflowResponse = GenericResponse<null>;
