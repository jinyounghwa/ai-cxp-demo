// 경량 observable store — React 의존성 없음 (순수 로직, 테스트 가능)
export interface Store<T> {
  getState: () => T;
  setState: (patch: Partial<T> | ((prev: T) => Partial<T>)) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());

  return {
    getState: () => state,
    setState: (patch) => {
      const resolved = typeof patch === 'function' ? patch(state) : patch;
      state = { ...state, ...resolved };
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
  };
}

// 새 ID 생성 헬퍼
let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter}`;
}
