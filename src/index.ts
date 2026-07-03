// A class body you can drop anywhere in JSX.
export { useComponent } from './use-component';
export { Component } from './component';

// Pure utility hooks (no lifecycle emulation, no anti-patterns).
export { usePrevious, usePreviousDistinct } from './use-previous';
export { useForceUpdate } from './use-force-update';

// Types
export type {
  SetState,
  Self,
  ActionsFactory,
  ComponentApi,
  UseComponentOptions,
  ComponentProps,
} from './types';
