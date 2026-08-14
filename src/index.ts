/**
 * Local state and the methods that update it, co-located at any point in JSX.
 *
 * {@link useComponent} is the hook form; {@link Component} is the same thing
 * as an element, so state can sit inside a `.map()` or a conditional where a
 * hook call is not allowed.
 *
 * ```tsx
 * import { Component } from 'use-component';
 *
 * {rows.map((row) => (
 *   <Component key={row.id} initial={{ open: false }}
 *     actions={(self) => ({ toggle: () => self.set({ open: !self.state.open }) })}
 *   >
 *     {({ state, actions }) => (
 *       <Row row={row} open={state.open} onToggle={actions.toggle} />
 *     )}
 *   </Component>
 * ))}
 * ```
 *
 * @packageDocumentation
 */

export { useComponent } from './use-component';
export { Component } from './component';

export { usePrevious, usePreviousDistinct } from './use-previous';
export { useForceUpdate } from './use-force-update';

export type {
  SetState,
  Self,
  ActionsFactory,
  ComponentApi,
  UseComponentOptions,
  ComponentProps,
} from './types';
