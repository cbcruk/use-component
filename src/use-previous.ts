import { useRef, useEffect } from 'react';

/**
 * Hook to track the previous value of a variable
 *
 * @example
 * ```tsx
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   const prevCount = usePrevious(count);
 *
 *   return (
 *     <div>
 *       Current: {count}, Previous: {prevCount}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * Hook to track the previous value with a custom comparison
 * Only updates the "previous" value when the comparison returns false
 *
 * @example
 * ```tsx
 * const prevUser = usePreviousDistinct(user, (prev, curr) => prev?.id === curr?.id);
 * ```
 */
export function usePreviousDistinct<T>(
  value: T,
  compare: (prev: T | undefined, curr: T) => boolean = Object.is
): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  const prevRef = useRef<T | undefined>(undefined);

  if (!compare(ref.current, value)) {
    prevRef.current = ref.current;
    ref.current = value;
  }

  return prevRef.current;
}
