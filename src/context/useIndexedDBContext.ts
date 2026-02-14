import { useContext } from 'react';
import { IndexedDBContext } from './IndexedDBContext';

export function useIndexedDBContext() {
  const ctx = useContext(IndexedDBContext);
  if (!ctx) throw new Error('useIndexedDBContext failed to initialize');
  return ctx;
}
