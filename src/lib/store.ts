import { useSyncExternalStore } from 'react';
import { readJSON, writeJSON } from './storage';

/** Petit store persistant (localStorage) partagé entre onglets. */
export function createPersistentStore<T>(key: string, initial: T, sanitize: (v: unknown) => T = (v) => v as T) {
  let state: T = sanitize(readJSON<unknown>(key, initial));
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === key) {
        state = sanitize(readJSON<unknown>(key, initial));
        emit();
      }
    });
  }

  return {
    get: () => state,
    set(next: T | ((prev: T) => T)) {
      state = typeof next === 'function' ? (next as (p: T) => T)(state) : next;
      writeJSON(key, state);
      emit();
    },
    subscribe(l: () => void) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    use(): T {
      return useSyncExternalStore(this.subscribe, this.get, this.get);
    },
  };
}
