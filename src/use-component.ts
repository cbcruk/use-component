import { useState, useRef, useEffect } from 'react';
import type {
  UseComponentOptions,
  ComponentApi,
  SetState,
  Self,
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
 * - `actions` → the methods, built once from a `(self) => ({...})` factory
 *
 * Inside the factory, `self` is the explicit `this`: `self.state` (always
 * fresh) and `self.set`. To have one action call another, capture it as a
 * local and share the reference.
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const { state, actions } = useComponent({
 *     initial: { count: 0 },
 *     actions: (self) => {
 *       const inc = () => self.set({ count: self.state.count + 1 });
 *       return {
 *         inc,
 *         reset: () => self.set({ count: 0 }),
 *         double: () => { inc(); inc(); },
 *       };
 *     },
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

  // Always-current snapshot so `self.state` reads fresh (this is `this.state`).
  const stateRef = useRef(state);
  stateRef.current = state;

  // Build the controller and its actions exactly once, like a class body.
  const holder = useRef<{
    set: SetState<S>;
    actions: A;
    self: Self<S> & A;
  } | null>(null);

  if (holder.current === null) {
    const set: SetState<S> = (patch) => {
      setStateRaw((prev) => {
        const next = typeof patch === 'function' ? patch(prev) : patch;
        return { ...prev, ...next };
      });
    };

    // `self` is the explicit `this`. Its `state` getter always returns the
    // latest state. Actions are merged in below so `onMount` can call them.
    const self = {
      get state() {
        return stateRef.current;
      },
      set,
    } as Self<S> & A;

    const actions = (actionsFactory ? actionsFactory(self) : {}) as A;
    Object.assign(self, actions);

    holder.current = { set, actions, self };
  }

  const { set, actions, self } = holder.current;

  const onMountRef = useRef(onMount);
  useEffect(() => {
    return onMountRef.current?.(self);
    // Mount only, like componentDidMount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, set, actions };
}
