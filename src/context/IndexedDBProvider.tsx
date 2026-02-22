import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DB_NAME,
  DB_STORES,
  DB_VERSION,
  type RhythmBlockStore,
} from './IndexedDB.types';
import { IndexedDBContext } from './IndexedDBContext';

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function IndexedDBProvider({ children }: { children: ReactNode }) {
  const dbRef = useRef<IDBDatabase | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const initialize = useCallback(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.log('error loading database', request.error);
      setIsOpen(false);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      const tx = request.transaction;

      let store: IDBObjectStore;

      if (!db.objectStoreNames.contains(DB_STORES.workflows)) {
        store = db.createObjectStore(DB_STORES.workflows, {
          keyPath: 'id',
        });
      } else {
        store = tx!.objectStore(DB_STORES.workflows);
      }

      if (!store.indexNames.contains('by_createdAt')) {
        store.createIndex('by_createdAt', 'createdAt');
      }
      if (!store.indexNames.contains('by_name')) {
        store.createIndex('by_name', 'name');
      }
      if (!store.indexNames.contains('by_updatedAt')) {
        store.createIndex('by_updatedAt', 'updatedAt');
      }
    };

    request.onsuccess = () => {
      dbRef.current = request.result;

      dbRef.current.onversionchange = () => {
        dbRef.current?.close();
        dbRef.current = null;
        setIsOpen(false);
      };

      setIsOpen(true);
    };

    request.onblocked = () => {
      console.warn('IndexedDB open request blocked (another tab may be open)');
    };
  }, []);

  useEffect(() => {
    initialize();
    return () => {
      dbRef.current?.close();
      dbRef.current = null;
      setIsOpen(false);
    };
  }, [initialize]);

  const saveWorkflow = useCallback(async (workflow: RhythmBlockStore) => {
    try {
      const db = dbRef.current;
      if (!db) throw new Error('DB not initialized');

      const now = Date.now();

      workflow.updatedAt = now;

      const tx = db.transaction(DB_STORES.workflows, 'readwrite');
      tx.objectStore(DB_STORES.workflows).put(workflow);
      await transactionDone(tx);

      return {
        value: null,
        error: null,
      };
    } catch (error) {
      let err;
      if (error instanceof Error) {
        err = error;
      } else {
        err = new Error('failed to save workflow');
      }

      return {
        value: null,
        error: err,
      };
    }
  }, []);

  const getWorkflows = useCallback(async (count = 10) => {
    try {
      const db = dbRef.current;
      if (!db) throw new Error('DB not initialized');

      const tx = db.transaction(DB_STORES.workflows, 'readwrite');
      const req = tx.objectStore(DB_STORES.workflows).getAll(null, count);

      return (await requestToPromise<RhythmBlockStore[]>(req)) ?? [];
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error('failed to get all workflows');
    }
  }, []);

  const getWorkflowById = useCallback(async (id: string) => {
    try {
      const db = dbRef.current;
      if (!db) throw new Error('DB not initialized');

      const tx = db.transaction(DB_STORES.workflows, 'readwrite');
      const req = tx.objectStore(DB_STORES.workflows).get(id);

      return await requestToPromise<RhythmBlockStore>(req);
    } catch (error) {
      console.log(error);

      throw new Error('failed to get workflow by id');
    }
  }, []);

  const deleteWorkflowById = useCallback(async (id: string) => {
    try {
      const db = dbRef.current;
      if (!db) throw new Error('DB not initialized');

      const tx = db.transaction(DB_STORES.workflows, 'readwrite');
      const req = tx.objectStore(DB_STORES.workflows).delete(id);

      return await requestToPromise<undefined>(req);
    } catch (error) {
      console.log(error);

      throw new Error('failed to delete workflow by id');
    }
  }, []);

  const value = useMemo(
    () => ({
      saveWorkflow,
      isOpen,
      getWorkflows,
      getWorkflowById,
      deleteWorkflowById,
    }),
    [saveWorkflow, isOpen, getWorkflows, getWorkflowById, deleteWorkflowById],
  );

  return (
    <IndexedDBContext.Provider value={value}>
      {children}
    </IndexedDBContext.Provider>
  );
}
