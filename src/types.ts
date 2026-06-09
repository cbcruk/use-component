import type { ReactNode, DependencyList } from 'react';

/**
 * Context passed to lifecycle callbacks and render functions
 */
export interface ComponentContext<S extends object, R extends object = object> {
  /** Current state */
  state: S;
  /** Update state (like class component setState) */
  setState: SetState<S>;
  /** Refs object */
  refs: R;
  /** Force re-render */
  forceUpdate: () => void;
}

/**
 * Extended context for update lifecycle
 */
export interface UpdateContext<S extends object, R extends object = object>
  extends ComponentContext<S, R> {
  prevState: S | undefined;
}

/**
 * SetState function signature
 */
export type SetState<S extends object> = (
  update: Partial<S> | ((prev: S) => Partial<S>)
) => void;

/**
 * ShouldUpdate function signature
 */
export interface ShouldUpdateArgs<S extends object> {
  state: S;
  nextState: S;
}

/**
 * useComponent hook options
 */
export interface UseComponentOptions<S extends object, R extends object = object> {
  /** Initial state object */
  initialState?: S;
  /** Lazy initial state function (prevents recomputation on re-render) */
  getInitialState?: () => S;
  /** Initial refs object */
  refs?: R;
  /** Lazy refs initialization */
  getRefs?: () => R;
  /** Called after mount */
  onMount?: (ctx: ComponentContext<S, R>) => void | (() => void);
  /** Called after every update */
  onUpdate?: (ctx: UpdateContext<S, R>) => void | (() => void);
  /** Dependencies for onUpdate (if not provided, runs on every render) */
  updateDeps?: DependencyList;
  /** Called before unmount */
  onUnmount?: (ctx: Omit<ComponentContext<S, R>, 'setState' | 'forceUpdate'>) => void;
  /** Called synchronously before DOM mutations (like getSnapshotBeforeUpdate) */
  onBeforeUpdate?: (ctx: UpdateContext<S, R>) => void;
}

/**
 * useComponent hook return value
 */
export interface UseComponentReturn<S extends object, R extends object = object> {
  state: S;
  setState: SetState<S>;
  refs: R;
  forceUpdate: () => void;
}

/**
 * Lifecycle hook options
 */
export interface UseLifecycleOptions<R extends object = object> {
  refs?: R;
  onMount?: (refs: R) => void | (() => void);
  onUnmount?: (refs: R) => void;
}

/**
 * Render props component props (legacy API support)
 */
export interface ComponentProps<S extends object, R extends object = object>
  extends UseComponentOptions<S, R> {
  /** Render prop */
  children?: ReactNode | ((ctx: ComponentContext<S, R>) => ReactNode);
  /** Alternative render prop */
  render?: (ctx: ComponentContext<S, R>) => ReactNode;
}

/**
 * Effect Component props for side effects only
 */
export interface EffectProps {
  /** Called on mount */
  onMount?: () => void | (() => void);
  /** Called on update (with optional deps) */
  onUpdate?: () => void | (() => void);
  /** Dependencies for update effect */
  deps?: DependencyList;
}
