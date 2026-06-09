// Main hooks
export { useComponent, useComponentState, useComponentRefs } from './use-component';

// Lifecycle hooks
export {
  useMount,
  useUnmount,
  useUpdate,
  useBeforeUpdate,
  useLifecycle,
} from './use-lifecycle';

// Utility hooks
export { usePrevious, usePreviousDistinct } from './use-previous';
export { useForceUpdate } from './use-force-update';

// Render props components (legacy/compatibility)
export { Component, Effect } from './component';

// Types
export type {
  ComponentContext,
  UpdateContext,
  SetState,
  ShouldUpdateArgs,
  UseComponentOptions,
  UseComponentReturn,
  UseLifecycleOptions,
  ComponentProps,
  EffectProps,
} from './types';
