import type { ComponentDefinition, UseComponentOptions } from './types';

/**
 * Declares state and its actions once, apart from JSX, for reuse across
 * {@link useComponent} calls and {@link Component} elements.
 *
 * Returns `build` unchanged. It exists only to give `self` its type: written
 * as a plain function, the `actions` factory's parameter would be an implicit
 * `any`. Each call of the definition is still a separate instance — nothing
 * is shared between the components that use it.
 *
 * `build` runs on every render, but only the first call's options are used,
 * so its arguments behave like constructor arguments.
 *
 * @example Reused by the hook and by the element
 * ```tsx
 * import { Component, defineComponent, useComponent } from 'use-component';
 *
 * const Disclosure = defineComponent((initialOpen: boolean) => ({
 *   initial: { open: initialOpen },
 *   actions: (self) => ({ toggle: () => self.set({ open: !self.state.open }) }),
 * }));
 *
 * function Panel() {
 *   const { state, actions } = useComponent(Disclosure(true));
 *   // ...
 * }
 *
 * {rows.map((row) => (
 *   <Component key={row.id} {...Disclosure(false)}>
 *     {({ state, actions }) => <Row row={row} open={state.open} onToggle={actions.toggle} />}
 *   </Component>
 * ))}
 * ```
 */
export function defineComponent<
  Args extends unknown[],
  S extends object,
  A extends object = object
>(build: (...args: Args) => UseComponentOptions<S, A>): ComponentDefinition<Args, S, A> {
  return build;
}
