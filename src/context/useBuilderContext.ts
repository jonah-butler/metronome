import { useContext } from 'react';
import { RhythmBuilderContext } from './BuilderContext';

export function useRhythmBuilderContext() {
  const ctx = useContext(RhythmBuilderContext);
  if (!ctx) throw new Error('use RhythmBuilderContext is null');
  return ctx;
}
