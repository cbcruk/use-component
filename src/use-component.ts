import { useState, useRef, useEffect } from 'react';
import type {
  UseComponentOptions,
  ComponentApi,
  SetState,
  Self,
} from './types';
import { mergePatch } from './use-component.utils';

/**
 * Holds a piece of state together with the methods that update it.
 *
 * The `actions` factory runs once, on the first render, and its methods keep
 * a stable identity from then on. They reach state through `self.state`,
 * which reflects every `self.set` made so far, so a method captured once
 * never operates on a stale snapshot and consecutive updates in one tick
 * build on each other.
 *
 * `self.state` therefore runs ahead of the render: it changes as soon as
 * `set` is called, while the returned `state` changes when React renders.
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const { state, actions } = useComponent({
 *     initial: { count: 0 },
 *     actions: (self) => ({
 *       inc: () => self.set({ count: self.state.count + 1 }),
 *       reset: () => self.set({ count: 0 }),
 *     }),
 *   });
 *
 *   return <button onClick={actions.inc}>Count: {state.count}</button>;
 * }
 * ```
 *
 * @example One action calling another
 * ```tsx
 * // Sharing a local reference is how one action calls another. Each call
 * // reads the update the previous one made.
 * useComponent({
 *   initial: { count: 0 },
 *   actions: (self) => {
 *     const inc = () => self.set({ count: self.state.count + 1 });
 *     return { inc, double: () => { inc(); inc(); } }; // +2
 *   },
 * });
 * ```
 */
export function useComponent<
  S extends object,
  A extends object = object
>(options: UseComponentOptions<S, A>): ComponentApi<S, A> {
  const { initial, actions: actionsFactory, onMount } = options;

  const [state, setStateRaw] = useState<S>(initial);

  // Every queued update, applied eagerly in `set`; never written during render.
  const stateRef = useRef(state);

  // Build the controller and its actions exactly once, like a class body.
  const holder = useRef<{
    set: SetState<S>;
    actions: A;
    self: Self<S> & A;
  } | null>(null);

  if (holder.current === null) {
    const set: SetState<S> = (patch) => {
      const latest = stateRef.current;
      const next = typeof patch === 'function' ? patch(latest) : patch;
      const merged = mergePatch(latest, next);
      if (merged === latest) return;
      stateRef.current = merged;
      // Queue the patch rather than `merged`, so a render in an urgent lane
      // does not pick up values set inside a still-pending transition.
      setStateRaw((prev) => mergePatch(prev, next));
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
