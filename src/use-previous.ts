import { useRef, useEffect } from 'react';

/**
 * Returns the value this component saw on its previous render.
 *
 * `undefined` on the first render, since there is no previous one. The stored
 * value advances after every commit, so two renders carrying the same value
 * make the result equal to the current one.
 *
 * @example
 * ```tsx
 * const prevCount = usePrevious(count);
 * const grew = prevCount !== undefined && count > prevCount;
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
 * Returns the last value that differed from the current one.
 *
 * Unlike {@link usePrevious}, renders that leave the value unchanged also
 * leave the result unchanged, so it survives re-renders caused by unrelated
 * state. The comparison runs during render rather than after commit.
 *
 * @param compare Returns `true` when the two values count as the same — the
 * opposite polarity of a "did it change" predicate.
 *
 * @example
 * ```tsx
 * // Advances only when the id changes, not on every new user object.
 * const prevUser = usePreviousDistinct(user, (prev, curr) => prev?.id === curr.id);
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
