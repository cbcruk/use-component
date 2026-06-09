import { useEffect, type ReactNode } from 'react';
import type { ComponentProps, EffectProps } from './types';
import { useComponent } from './use-component';

/**
 * Render props component for inline state and lifecycle management
 *
 * This provides backward compatibility with @reach/component-component
 * while using modern hooks internally.
 *
 * @example Basic state
 * ```tsx
 * <Component initialState={{ count: 0 }}>
 *   {({ state, setState }) => (
 *     <button onClick={() => setState({ count: state.count + 1 })}>
 *       Count: {state.count}
 *     </button>
 *   )}
 * </Component>
 * ```
 *
 * @example With lifecycle
 * ```tsx
 * <Component
 *   initialState={{ data: null }}
 *   onMount={async ({ setState }) => {
 *     const data = await fetchData();
 *     setState({ data });
 *   }}
 * >
 *   {({ state }) => state.data ? <DataView data={state.data} /> : <Loading />}
 * </Component>
 * ```
 *
 * @example With refs
 * ```tsx
 * <Component getRefs={() => ({ input: React.createRef() })}>
 *   {({ refs }) => (
 *     <form onSubmit={() => alert(refs.input.current?.value)}>
 *       <input ref={refs.input} />
 *       <button type="submit">Submit</button>
 *     </form>
 *   )}
 * </Component>
 * ```
 */
export function Component<S extends object = object, R extends object = object>({
  children,
  render,
  ...options
}: ComponentProps<S, R>): ReactNode {
  const ctx = useComponent<S, R>(options);

  // Support both children and render prop
  const renderFn = render ?? children;

  if (typeof renderFn === 'function') {
    return renderFn(ctx);
  }

  // If children is not a function, render as-is
  return renderFn ?? null;
}

/**
 * Lightweight component for side effects only (no state/refs)
 *
 * Useful for inline effects without creating a separate component
 *
 * @example Update document title
 * ```tsx
 * <Effect onMount={() => { document.title = 'New Title'; }} />
 * ```
 *
 * @example With dependencies
 * ```tsx
 * <Effect
 *   onUpdate={() => { document.title = `Count: ${count}`; }}
 *   deps={[count]}
 * />
 * ```
 */
export function Effect({ onMount, onUpdate, deps }: EffectProps): null {
  // Mount effect
  useEffect(() => {
    return onMount?.() ?? undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update effect
  useEffect(() => {
    return onUpdate?.() ?? undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return null;
}
