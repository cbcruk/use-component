import type { ReactNode } from 'react';

/**
 * State setter with class-like partial merge semantics.
 *
 * Mirrors `this.setState` — you pass a patch (or a function returning one)
 * and it is shallow-merged into the current state object.
 */
export type SetState<S extends object> = (
  patch: Partial<S> | ((prev: S) => Partial<S>)
) => void;

/**
 * Factory that builds the "methods" for a piece of inline state.
 *
 * Think of it as the method section of a class body: `set` is
 * `this.setState`, `get()` is `this.state`. Actions are created once and
 * always read fresh state through `get()`, so there are no stale closures.
 *
 * @example
 * ```tsx
 * (set, get) => ({
 *   inc:   () => set({ count: get().count + 1 }),
 *   reset: () => set({ count: 0 }),
 * })
 * ```
 */
export type ActionsFactory<S extends object, A extends object> = (
  set: SetState<S>,
  get: () => S
) => A;

/**
 * The value handed to `useComponent` callers and `<Component>` children.
 *
 * `state` are the fields, `actions` are the methods, `set` is the
 * escape hatch for one-off updates that don't warrant a named action.
 */
export interface ComponentApi<S extends object, A extends object = object> {
  /** Current state (the "fields"). */
  state: S;
  /** Partial-merge setter (`this.setState`). */
  set: SetState<S>;
  /** The methods produced by the `actions` factory. */
  actions: A;
}

/**
 * Options shared by `useComponent` and `<Component>`.
 */
export interface UseComponentOptions<
  S extends object,
  A extends object = object
> {
  /** Initial state. A function is treated as a lazy initializer. */
  initial: S | (() => S);
  /** Factory for the co-located methods. Runs once. */
  actions?: ActionsFactory<S, A>;
  /**
   * Runs once after mount (`componentDidMount`). May return a cleanup
   * function that runs on unmount. This is the only lifecycle hook —
   * update/before-update emulation is intentionally omitted.
   */
  onMount?: (api: ComponentApi<S, A>) => void | (() => void);
}

/**
 * Props for the `<Component>` render-props component.
 *
 * The one thing hooks cannot do: co-locate ephemeral state and its methods
 * at an arbitrary point in JSX — inside a `.map()` or a conditional — with
 * no extracted component.
 */
export interface ComponentProps<S extends object, A extends object = object>
  extends UseComponentOptions<S, A> {
  /** Render function receiving `{ state, set, actions }`. */
  children: (api: ComponentApi<S, A>) => ReactNode;
}
