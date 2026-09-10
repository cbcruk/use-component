import type { ReactNode } from 'react';
import type { ComponentProps } from './types';
import { useComponent } from './use-component';

/**
 * Runs {@link useComponent} at the point in JSX where this element is written.
 *
 * Goes anywhere an element goes — inside `.map()`, a conditional, a fragment —
 * which is where a hook call would be illegal. That makes it the way to give
 * one JSX node its own state without extracting a component to hold it.
 *
 * Each element owns its state independently of its siblings. React resets
 * that state whenever it remounts the element, so a list needs stable `key`s
 * for state to survive reordering.
 *
 * @example Local state per list row — no extracted component
 * ```tsx
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
 * @example Load on mount, cancelling if it unmounts first
 * ```tsx
 * <Component
 *   initial={{ user: null }}
 *   onMount={({ set }) => {
 *     const controller = new AbortController();
 *     fetchUser({ signal: controller.signal }).then((user) => set({ user }));
 *     return () => controller.abort();
 *   }}
 * >
 *   {({ state }) => (state.user ? <Profile user={state.user} /> : <Spinner />)}
 * </Component>
 * ```
 */
export function Component<S extends object, A extends object = object>({
  children,
  ...options
}: ComponentProps<S, A>): ReactNode {
  return children(useComponent<S, A>(options));
}
