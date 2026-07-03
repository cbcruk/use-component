import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePrevious, usePreviousDistinct } from './use-previous';

describe('usePrevious', () => {
  it('is undefined on the first render', () => {
    const { result } = renderHook(() => usePrevious(1));
    expect(result.current).toBeUndefined();
  });

  it('returns the value from the previous render', () => {
    const { result, rerender } = renderHook(({ v }) => usePrevious(v), {
      initialProps: { v: 1 },
    });

    rerender({ v: 2 });
    expect(result.current).toBe(1);

    rerender({ v: 3 });
    expect(result.current).toBe(2);
  });
});

describe('usePreviousDistinct', () => {
  it('updates the previous value only when it actually changes', () => {
    const { result, rerender } = renderHook(({ v }) => usePreviousDistinct(v), {
      initialProps: { v: 1 },
    });

    // Same value re-render: previous stays undefined.
    rerender({ v: 1 });
    expect(result.current).toBeUndefined();

    rerender({ v: 2 });
    expect(result.current).toBe(1);

    // Repeated same value: previous still reflects the last distinct one.
    rerender({ v: 2 });
    expect(result.current).toBe(1);
  });

  it('honors a custom comparison function', () => {
    const compare = (
      a: { id: number } | undefined,
      b: { id: number }
    ) => a?.id === b.id;

    const { result, rerender } = renderHook(
      ({ v }) => usePreviousDistinct(v, compare),
      { initialProps: { v: { id: 1, label: 'a' } } }
    );

    // Different object identity but same id -> treated as unchanged.
    rerender({ v: { id: 1, label: 'b' } });
    expect(result.current).toBeUndefined();

    rerender({ v: { id: 2, label: 'c' } });
    expect(result.current).toEqual({ id: 1, label: 'a' });
  });
});
