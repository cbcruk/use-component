import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import type {
  UseComponentOptions,
  ComponentApi,
  SetState,
} from './types';

/**
 * A class body you can drop anywhere — as a hook.
 *
 * Groups a piece of state with its methods, the way a class groups fields
 * with methods, but without the class and without scattering `useState` /
 * `useCallback` across the component body:
 *
 * - `state`   → the fields
 * - `set`     → `this.setState` (shallow partial merge)
 * - `actions` → the methods, built once, reading fresh state via `get()`
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const { state, actions } = useComponent({
 *     initial: { count: 0 },
 *     actions: (set, get) => ({
 *       inc:   () => set({ count: get().count + 1 }),
 *       reset: () => set({ count: 0 }),
 *     }),
 *   });
 *
 *   return <button onClick={actions.inc}>Count: {state.count}</button>;
 * }
 * ```
 */
export function useComponent<
  S extends object,
  A extends object = object
>(options: UseComponentOptions<S, A>): ComponentApi<S, A> {
  const { initial, actions: actionsFactory, onMount } = options;

  const [state, setStateRaw] = useState<S>(initial);

  // Always-current snapshot so actions can read fresh state without
  // closing over it (this is `this.state`).
  const stateRef = useRef(state);
  stateRef.current = state;

  // `this.setState` — shallow partial merge.
  const set = useCallback<SetState<S>>((patch) => {
    setStateRaw((prev) => {
      const next = typeof patch === 'function' ? patch(prev) : patch;
      return { ...prev, ...next };
    });
  }, []);

  const get = useCallback(() => stateRef.current, []);

  // Methods are built once, like a class body. The initial factory is
  // captured on purpose — `set`/`get` are stable, so the methods stay
  // valid for the component's whole life.
  const actions = useMemo<A>(
    () => (actionsFactory ? actionsFactory(set, get) : ({} as A)),
    [set, get] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const onMountRef = useRef(onMount);
  useEffect(() => {
    return onMountRef.current?.({ state: stateRef.current, set, actions });
    // Mount only, like componentDidMount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, set, actions };
}
