import type { ReactNode } from 'react';
import type { ComponentProps } from './types';
import { useComponent } from './use-component';

/**
 * Inline state and its methods, placed at an arbitrary point in JSX.
 *
 * This is the one thing hooks cannot do: co-locate ephemeral state with a
 * single JSX node — inside a `.map()` or a conditional — without extracting
 * a named component and prop-drilling into it.
 *
 * It reads like a class body dropped in place: `state` are the fields,
 * `actions` are the methods, `set` is `this.setState`.
 *
 * @example Local state per list row — no extracted component
 * ```tsx
 * {rows.map((row) => (
 *   <Component key={row.id} initial={{ open: false }}
 *     actions={(set, get) => ({ toggle: () => set({ open: !get().open }) })}
 *   >
 *     {({ state, actions }) => (
 *       <Row row={row} open={state.open} onToggle={actions.toggle} />
 *     )}
 *   </Component>
 * ))}
 * ```
 *
 * @example Load on mount
 * ```tsx
 * <Component
 *   initial={{ user: null }}
 *   onMount={async ({ set }) => set({ user: await fetchUser() })}
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
