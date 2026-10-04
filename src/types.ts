import type { ReactNode } from 'react';

/**
 * Merges a patch into the current state, like `this.setState`.
 *
 * The merge is shallow: nested objects are replaced, not merged. Unlike
 * `this.setState`, the update is readable through {@link Self.state} as soon
 * as the call returns, so consecutive calls in one tick build on each other;
 * the rendered `state` catches up on the next render. The function form
 * receives that same latest state.
 *
 * A patch whose every value is already in state (compared with `Object.is`)
 * keeps the current state object and skips the re-render — unlike
 * `this.setState`, which always renders. The comparison is per key, not deep:
 * a new array or object with the same contents still counts as a change.
 */
export type SetState<S extends object> = (
  patch: Partial<S> | ((prev: S) => Partial<S>)
) => void;

/**
 * The explicit `this` passed to an {@link ActionsFactory}.
 *
 * Deliberately carries no action members. TypeScript infers the actions from
 * the factory's return value, and naming that type here would make the
 * inference circular and collapse it to `object`. To call one action from
 * another, capture it as a local and share the reference.
 */
export interface Self<S extends object> {
  /**
   * State with every `set` applied so far, including updates React has not
   * rendered yet.
   *
   * Re-read on every access, so an action captured once — an event handler, a
   * callback held by a memoized child — still reads current values. Inside a
   * pending `startTransition` it already reports the transition's values while
   * the screen still shows the old ones.
   */
  readonly state: S;
  /** Queues a state update ({@link SetState}). */
  set: SetState<S>;
}

/**
 * Builds the methods for one piece of state, once per component instance.
 *
 * Runs during the first render. The methods it returns keep the same
 * identity for the rest of the component's life, so they are safe to pass to
 * memoized children or to list in effect dependencies.
 */
export type ActionsFactory<S extends object, A extends object> = (
  self: Self<S>
) => A;

/**
 * What {@link useComponent} returns, and what {@link Component} hands to its
 * render function.
 */
export interface ComponentApi<S extends object, A extends object = object> {
  /** State as of the render that produced this object. */
  state: S;
  /** Updates state without going through a named action ({@link SetState}). */
  set: SetState<S>;
  /** The methods from the {@link ActionsFactory}. Stable across renders. */
  actions: A;
}

/**
 * Configures {@link useComponent} and {@link Component}.
 *
 * Every field is read on the first render only. Passing a different
 * `initial`, `actions`, or `onMount` later has no effect — the component
 * keeps the ones it started with, the way a class keeps its constructor.
 */
export interface UseComponentOptions<
  S extends object,
  A extends object = object
> {
  /**
   * State for the first render. Pass a function to build it lazily; it runs
   * once rather than on every render.
   */
  initial: S | (() => S);
  /** Factory for the methods, called once during the first render. */
  actions?: ActionsFactory<S, A>;
  /**
   * Runs after the first commit and never again, even when state changes.
   * Return a function to run on unmount.
   *
   * Cannot be `async`. Whatever it returns is registered as the cleanup, so a
   * promise would be invoked as one when the element unmounts. Start the
   * async work from a synchronous body and return a function that cancels it.
   *
   * React's StrictMode invokes it twice in development (mount, unmount,
   * mount), so anything it starts must be undone by the returned cleanup.
   */
  onMount?: (self: Self<S> & A) => void | (() => void);
}

/**
 * Configures {@link Component}: {@link UseComponentOptions} plus the render
 * function.
 */
export interface ComponentProps<S extends object, A extends object = object>
  extends UseComponentOptions<S, A> {
  /** Called on every render of this element with that render's state. */
  children: (api: ComponentApi<S, A>) => ReactNode;
}

/**
 * A reusable {@link UseComponentOptions} builder, made by
 * {@link defineComponent}.
 *
 * Calling it returns fresh options to hand to {@link useComponent} or spread
 * onto {@link Component}. Its arguments are read on the first render only,
 * like the options they build.
 */
export type ComponentDefinition<
  Args extends unknown[],
  S extends object,
  A extends object = object
> = (...args: Args) => UseComponentOptions<S, A>;
