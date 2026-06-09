import { useEffect, useLayoutEffect, useRef, type DependencyList, type EffectCallback } from 'react';

/**
 * Hook that runs only on mount (like componentDidMount)
 *
 * @example
 * ```tsx
 * useMount(() => {
 *   console.log('Component mounted');
 *   return () => console.log('Component will unmount');
 * });
 * ```
 */
export function useMount(callback: EffectCallback): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(callback, []);
}

/**
 * Hook that runs only on unmount (like componentWillUnmount)
 *
 * @example
 * ```tsx
 * useUnmount(() => {
 *   console.log('Cleaning up...');
 * });
 * ```
 */
export function useUnmount(callback: () => void): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => callbackRef.current();
  }, []);
}

/**
 * Hook that runs on updates but NOT on mount (like componentDidUpdate)
 *
 * @example
 * ```tsx
 * const [count, setCount] = useState(0);
 *
 * useUpdate(() => {
 *   console.log('Count changed to:', count);
 * }, [count]);
 * ```
 */
export function useUpdate(callback: () => void | (() => void), deps?: DependencyList): void {
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current) {
      return callback();
    }
    isMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Hook that runs synchronously before DOM mutations (like getSnapshotBeforeUpdate)
 * Useful for capturing scroll position before updates
 *
 * @example
 * ```tsx
 * useBeforeUpdate(() => {
 *   // Capture scroll position before DOM updates
 *   savedScrollPosition.current = container.scrollTop;
 * }, [items]);
 * ```
 */
export function useBeforeUpdate(callback: () => void, deps?: DependencyList): void {
  const isMounted = useRef(false);

  useLayoutEffect(() => {
    if (isMounted.current) {
      callback();
    }
    isMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Combined lifecycle hook for all lifecycle events
 *
 * @example
 * ```tsx
 * useLifecycle({
 *   onMount: () => console.log('Mounted'),
 *   onUpdate: () => console.log('Updated'),
 *   onUnmount: () => console.log('Will unmount'),
 *   deps: [someValue]
 * });
 * ```
 */
export function useLifecycle(options: {
  onMount?: () => void | (() => void);
  onUpdate?: () => void | (() => void);
  onUnmount?: () => void;
  deps?: DependencyList;
}): void {
  const { onMount, onUpdate, onUnmount, deps } = options;

  // Handle mount
  useEffect(() => {
    const cleanup = onMount?.();
    return () => {
      if (typeof cleanup === 'function') {
        cleanup();
      }
      onUnmount?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle update
  const isMounted = useRef(false);
  useEffect(() => {
    if (isMounted.current && onUpdate) {
      return onUpdate();
    }
    isMounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
