import { useState, useRef, useEffect } from 'react';
import type {
  UseComponentOptions,
  ComponentApi,
  SetState,
  Self,
} from './types';
import { drive, isGeneratorFunction, type Driven } from './action';

/**
 * Holds a piece of state together with the methods that update it.
 *
 * The `actions` factory runs once, on the first render, and its methods keep
 * a stable identity from then on. They reach state through `self.state`,
 * which re-reads the latest committed value on every access, so a method
 * captured once never operates on a stale snapshot.
 *
 * Within a single tick `self.state` still reports the last commit, exactly
 * as class `this.state` does after `this.setState`. Use the functional form
 * of `self.set` when several updates have to accumulate before the next
 * render.
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
 * @example Several updates in one tick
 * ```tsx
 * // Sharing a local reference is how one action calls another; the
 * // functional updater is what makes the two increments accumulate.
 * useComponent({
 *   initial: { count: 0 },
 *   actions: (self) => {
 *     const inc = () => self.set((prev) => ({ count: prev.count + 1 }));
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

  // Always-current snapshot so `self.state` reads fresh (this is `this.state`).
  const stateRef = useRef(state);
  stateRef.current = state;

  // Build the controller and its actions exactly once, like a class body.
  const holder = useRef<{
    set: SetState<S>;
    actions: Driven<A>;
    self: Self<S> & Driven<A>;
  } | null>(null);

  // True between mount and unmount. Generator actions consult it before every
  // step, so an unmounted element simply stops being resumed.
  const alive = useRef(false);

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
    } as Self<S> & Driven<A>;

    const declared = (actionsFactory ? actionsFactory(self) : {}) as A;
    const actions = {} as Record<string, unknown>;
    for (const key of Object.keys(declared)) {
      const member = (declared as Record<string, unknown>)[key];
      actions[key] = isGeneratorFunction(member)
        ? (...args: never[]) => drive(member(...args), () => alive.current)
        : member;
    }
    Object.assign(self, actions);

    holder.current = { set, actions: actions as Driven<A>, self };
  }

  const { set, actions, self } = holder.current;

  const onMountRef = useRef(onMount);
  useEffect(() => {
    alive.current = true;
    const cleanup = onMountRef.current?.(self);
    return () => {
      alive.current = false;
      cleanup?.();
    };
    // Mount only, like componentDidMount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { state, set, actions };
}
