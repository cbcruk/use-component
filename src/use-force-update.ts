import { useReducer, useCallback } from 'react';

/**
 * Returns a function that re-renders the calling component on demand.
 *
 * The returned function keeps the same identity for the component's life, so
 * it is safe in dependency arrays. Each call schedules a render even though
 * no state changed — reach for it only when what the component displays lives
 * outside React, such as a mutable ref or an external store with no
 * subscription of its own.
 *
 * @example
 * ```tsx
 * const items = useRef<string[]>([]);
 * const forceUpdate = useForceUpdate();
 *
 * const add = (item: string) => {
 *   items.current.push(item); // mutation React cannot observe
 *   forceUpdate();
 * };
 * ```
 */
export function useForceUpdate(): () => void {
  const [, dispatch] = useReducer((x: number) => x + 1, 0);
  return useCallback(() => dispatch(), []);
}
