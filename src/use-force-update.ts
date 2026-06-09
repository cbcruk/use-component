import { useReducer, useCallback } from 'react';

/**
 * Hook to force a component re-render
 *
 * @example
 * ```tsx
 * function Component() {
 *   const forceUpdate = useForceUpdate();
 *
 *   return (
 *     <button onClick={forceUpdate}>
 *       Force Update (renders: {Math.random()})
 *     </button>
 *   );
 * }
 * ```
 */
export function useForceUpdate(): () => void {
  const [, dispatch] = useReducer((x: number) => x + 1, 0);
  return useCallback(() => dispatch(), []);
}
