import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import type {
  UseComponentOptions,
  UseComponentReturn,
  SetState,
  ComponentContext,
  UpdateContext,
} from './types';
import { useForceUpdate } from './use-force-update';
import { usePrevious } from './use-previous';

/**
 * Modern hook-based reimplementation of @reach/component-component
 *
 * Provides a unified way to manage state, refs, and lifecycle events
 * in a single hook call. Useful for complex inline component logic.
 *
 * @example
 * ```tsx
 * function ColorGenerator() {
 *   const { state, setState } = useComponent({
 *     initialState: { hue: 0 },
 *     onMount: ({ setState }) => {
 *       // Fetch initial data, setup subscriptions, etc.
 *     },
 *     onUpdate: ({ state, prevState }) => {
 *       console.log('Hue changed from', prevState?.hue, 'to', state.hue);
 *     },
 *     updateDeps: [/* explicit deps *\/],
 *   });
 *
 *   return (
 *     <button onClick={() => setState({ hue: Math.random() * 360 })}>
 *       Generate Color
 *     </button>
 *   );
 * }
 * ```
 *
 * @example With refs
 * ```tsx
 * function Form() {
 *   const { refs, state, setState } = useComponent({
 *     getRefs: () => ({ input: React.createRef<HTMLInputElement>() }),
 *     initialState: { submitted: false },
 *   });
 *
 *   return (
 *     <form onSubmit={() => {
 *       console.log(refs.input.current?.value);
 *       setState({ submitted: true });
 *     }}>
 *       <input ref={refs.input} />
 *     </form>
 *   );
 * }
 * ```
 */
export function useComponent<
  S extends object = object,
  R extends object = object
>(options: UseComponentOptions<S, R> = {}): UseComponentReturn<S, R> {
  const {
    initialState,
    getInitialState,
    refs: initialRefs,
    getRefs,
    onMount,
    onUpdate,
    updateDeps,
    onUnmount,
    onBeforeUpdate,
  } = options;

  // Initialize state (lazy initialization supported)
  const [state, setStateInternal] = useState<S>(() => {
    if (getInitialState) {
      return getInitialState();
    }
    return (initialState ?? {}) as S;
  });

  // Initialize refs (only once, never re-computed)
  const refsRef = useRef<R | null>(null);
  if (refsRef.current === null) {
    refsRef.current = getRefs ? getRefs() : ((initialRefs ?? {}) as R);
  }
  const refs = refsRef.current;

  // Force update utility
  const forceUpdate = useForceUpdate();

  // Track previous state for onUpdate
  const prevState = usePrevious(state);

  // Create setState that merges like class component
  const setState: SetState<S> = useCallback((update) => {
    setStateInternal((prev) => {
      const partial = typeof update === 'function' ? update(prev) : update;
      return { ...prev, ...partial };
    });
  }, []);

  // Create context object
  const getContext = useCallback((): ComponentContext<S, R> => ({
    state,
    setState,
    refs,
    forceUpdate,
  }), [state, setState, refs, forceUpdate]);

  const getUpdateContext = useCallback((): UpdateContext<S, R> => ({
    ...getContext(),
    prevState,
  }), [getContext, prevState]);

  // Handle mount and unmount
  useEffect(() => {
    const ctx = getContext();
    const cleanup = onMount?.(ctx);

    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
      onUnmount?.({ state: ctx.state, refs: ctx.refs });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track if mounted for update detection
  const isMounted = useRef(false);

  // Handle beforeUpdate (synchronous, before DOM paint)
  useLayoutEffect(() => {
    if (isMounted.current && onBeforeUpdate) {
      onBeforeUpdate(getUpdateContext());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, updateDeps ?? [state]);

  // Handle update
  useEffect(() => {
    if (isMounted.current && onUpdate) {
      return onUpdate(getUpdateContext()) ?? undefined;
    }
    isMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, updateDeps ?? [state]);

  return {
    state,
    setState,
    refs,
    forceUpdate,
  };
}

/**
 * Simplified version for state-only use cases
 *
 * @example
 * ```tsx
 * const { state, setState } = useComponentState({ count: 0 });
 * ```
 */
export function useComponentState<S extends object>(
  initialState: S | (() => S)
): Pick<UseComponentReturn<S>, 'state' | 'setState'> {
  const [state, setStateInternal] = useState<S>(initialState);

  const setState: SetState<S> = useCallback((update) => {
    setStateInternal((prev) => {
      const partial = typeof update === 'function' ? update(prev) : update;
      return { ...prev, ...partial };
    });
  }, []);

  return { state, setState };
}

/**
 * Hook for managing mutable refs object
 *
 * @example
 * ```tsx
 * const refs = useComponentRefs(() => ({
 *   input: React.createRef<HTMLInputElement>(),
 *   container: null as HTMLDivElement | null,
 * }));
 * ```
 */
export function useComponentRefs<R extends object>(
  getRefs: () => R
): R {
  const refsRef = useRef<R | null>(null);
  if (refsRef.current === null) {
    refsRef.current = getRefs();
  }
  return refsRef.current;
}
