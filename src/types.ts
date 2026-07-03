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
 * The explicit `this` handed to the `actions` factory.
 *
 * `state` is a live getter — always the latest state, like a class's
 * `this.state` — so actions never close over a stale snapshot. `set` is the
 * partial-merge setter (`this.setState`).
 *
 * To have one action call another, capture it as a local and share the
 * reference — no `this` and no stale closures:
 *
 * ```tsx
 * actions: (self) => {
 *   const inc = () => self.set({ count: self.state.count + 1 });
 *   return { inc, double: () => { inc(); inc(); } };
 * }
 * ```
 */
export interface Self<S extends object> {
  /** Current state (always fresh — `this.state`). */
  readonly state: S;
  /** Partial-merge setter (`this.setState`). */
  set: SetState<S>;
}

/**
 * Factory that builds the methods for a piece of inline state.
 *
 * Receives {@link Self} and returns the methods. It runs once; the methods
 * stay valid for the component's whole life. Keeping `self` free of the
 * action type is what lets TypeScript infer the actions from the returned
 * object without an explicit annotation.
 */
export type ActionsFactory<S extends object, A extends object> = (
  self: Self<S>
) => A;

/**
 * The value handed to `useComponent` callers and `<Component>` children.
 *
 * `state` are the fields, `actions` are the methods, `set` is the escape
 * hatch for one-off updates that don't warrant a named action.
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
  /** Factory for the co-located methods. Runs once, receives `self`. */
  actions?: ActionsFactory<S, A>;
  /**
   * Runs once after mount (`componentDidMount`). Receives `self` with the
   * actions merged in, so it may call them (e.g. `onMount: (self) =>
   * self.load()`). May return a cleanup function that runs on unmount. This
   * is the only lifecycle hook — update/before-update emulation is omitted.
   */
  onMount?: (self: Self<S> & A) => void | (() => void);
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
