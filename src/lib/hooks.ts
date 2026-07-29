import { useSyncExternalStore } from 'react';
import type { Store } from './store';

// React 바인딩 (store.ts는 React 의존성이 없어 순수 로직/테스트가 가능함)
export function useStore<T extends object, S>(
  store: Store<T>,
  selector: (state: T) => S
): S {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState())
  );
}
