import { createContext } from 'react';
import {
  type RhythmBlockStore,
  type SaveWorkflowResponse,
} from './IndexedDB.types';

export type IndexedDBContextType = {
  isOpen: boolean;
  saveWorkflow: (blocks: RhythmBlockStore) => Promise<SaveWorkflowResponse>;
  getWorkflows: (count?: number) => Promise<RhythmBlockStore[]>;
  getWorkflowById: (id: string) => Promise<RhythmBlockStore>;
  deleteWorkflowById: (id: string) => Promise<undefined>;
};

export const IndexedDBContext = createContext<IndexedDBContextType | null>(
  null,
);
