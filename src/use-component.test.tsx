import { describe, it, expect, vi } from 'vitest';
import { StrictMode, startTransition } from 'react';
import { act, render, renderHook } from '@testing-library/react';
import { useComponent } from './use-component';

describe('useComponent — state', () => {
  it('uses an object as initial state', () => {
    const { result } = renderHook(() =>
      useComponent({ initial: { count: 0, name: 'a' } })
    );
    expect(result.current.state).toEqual({ count: 0, name: 'a' });
  });

  it('treats a function initial as a lazy initializer, called once', () => {
    const factory = vi.fn(() => ({ count: 7 }));
    const { result, rerender } = renderHook(() =>
      useComponent({ initial: factory })
    );

    expect(result.current.state).toEqual({ count: 7 });
    rerender();
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe('useComponent — set', () => {
  it('shallow-merges a partial patch (like this.setState)', () => {
    const { result } = renderHook(() =>
      useComponent({ initial: { count: 0, name: 'a' } })
    );

    act(() => result.current.set({ count: 1 }));

    expect(result.current.state).toEqual({ count: 1, name: 'a' });
  });

  it('accepts a function updater receiving previous state', () => {
    const { result } = renderHook(() =>
      useComponent({ initial: { count: 10 } })
    );

    act(() => result.current.set((prev) => ({ count: prev.count + 5 })));

    expect(result.current.state.count).toBe(15);
  });

  it('skips the re-render when a patch changes nothing', () => {
    let renders = 0;
    const { result } = renderHook(() => {
      renders++;
      return useComponent({ initial: { count: 0, name: 'a' } });
    });
    const before = result.current.state;
    renders = 0;

    act(() => result.current.set({ count: 0 }));
    act(() => result.current.set((prev) => ({ name: prev.name })));
    act(() => result.current.set({}));

    expect(renders).toBe(0);
    expect(result.current.state).toBe(before);
  });

  it('compares patched values with Object.is, not deep equality', () => {
    const { result } = renderHook(() =>
      useComponent({ initial: { tags: ['a'], ratio: NaN } })
    );
    const before = result.current.state;

    act(() => result.current.set({ ratio: NaN }));
    expect(result.current.state).toBe(before);

    act(() => result.current.set({ tags: ['a'] }));
    expect(result.current.state).not.toBe(before);
  });

  it('has a stable identity across renders', () => {
    const { result, rerender } = renderHook(() =>
      useComponent({ initial: { count: 0 } })
    );
    const first = result.current.set;
    rerender();
    expect(result.current.set).toBe(first);
  });
});

describe('useComponent — actions', () => {
  it('exposes methods built from the factory', () => {
    const { result } = renderHook(() =>
      useComponent({
        initial: { count: 0 },
        actions: (self) => ({
          inc: () => self.set({ count: self.state.count + 1 }),
          reset: () => self.set({ count: 0 }),
        }),
      })
    );

    act(() => result.current.actions.inc());
    expect(result.current.state.count).toBe(1);

    act(() => result.current.actions.reset());
    expect(result.current.state.count).toBe(0);
  });

  it('reads fresh state through self.state — no stale closures', () => {
    const { result } = renderHook(() =>
      useComponent({
        initial: { count: 0 },
        actions: (self) => ({
          inc: () => self.set({ count: self.state.count + 1 }),
        }),
      })
    );

    // Capture the action reference once, then call it repeatedly.
    const inc = result.current.actions.inc;
    act(() => inc());
    act(() => inc());
    act(() => inc());

    expect(result.current.state.count).toBe(3);
  });

  it('updates self.state synchronously, before the next render', () => {
    const seen: number[] = [];
    const { result } = renderHook(() =>
      useComponent({
        initial: { count: 0 },
        actions: (self) => ({
          inc: () => {
            self.set({ count: self.state.count + 1 });
            seen.push(self.state.count);
          },
        }),
      })
    );

    act(() => result.current.actions.inc());
    expect(seen).toEqual([1]);
  });

  it('accumulates object patches read from self.state within one tick', () => {
    const { result } = renderHook(() =>
      useComponent({
        initial: { count: 0 },
        actions: (self) => {
          const inc = () => self.set({ count: self.state.count + 1 });
          return { inc, double: () => { inc(); inc(); } };
        },
      })
    );

    act(() => result.current.actions.double());
    expect(result.current.state.count).toBe(2);
  });

  it('keeps self.state in step with rendered state under StrictMode', () => {
    let read = -1;
    const { result } = renderHook(
      () =>
        useComponent({
          initial: { count: 0 },
          actions: (self) => ({
            inc: () => self.set({ count: self.state.count + 1 }),
            read: () => { read = self.state.count; },
          }),
        }),
      { wrapper: StrictMode }
    );

    act(() => result.current.actions.inc());
    act(() => result.current.actions.inc());
    act(() => result.current.actions.read());

    expect(result.current.state.count).toBe(2);
    expect(read).toBe(2);
  });

  it('keeps a pending transition out of an urgent render', () => {
    const renders: { a: number; b: number }[] = [];
    let api!: ReturnType<typeof useComponent<{ a: number; b: number }>>;
    function Probe() {
      api = useComponent({ initial: { a: 0, b: 0 } });
      renders.push(api.state);
      return null;
    }
    render(<Probe />);
    renders.length = 0;

    act(() => {
      startTransition(() => api.set({ a: 1 }));
      api.set({ b: 1 });
    });

    expect(renders[0]).toEqual({ a: 0, b: 1 });
    expect(renders.at(-1)).toEqual({ a: 1, b: 1 });
  });

  it('composes actions via a shared local reference', () => {
    const { result } = renderHook(() =>
      useComponent({
        initial: { count: 0 },
        actions: (self) => {
          const inc = () => self.set((prev) => ({ count: prev.count + 1 }));
          return {
            inc,
            double: () => {
              inc();
              inc();
            },
          };
        },
      })
    );

    act(() => result.current.actions.double());
    expect(result.current.state.count).toBe(2);
  });

  it('batches synchronous set calls within one action', () => {
    const { result } = renderHook(() =>
      useComponent({
        initial: { count: 0 },
        actions: (self) => ({
          incTwice: () => {
            self.set({ count: self.state.count + 1 });
            self.set((prev) => ({ count: prev.count + 1 }));
          },
        }),
      })
    );

    act(() => result.current.actions.incTwice());
    expect(result.current.state.count).toBe(2);
  });

  it('survives being detached from the actions object (no this-binding footgun)', () => {
    const { result } = renderHook(() =>
      useComponent({
        initial: { count: 0 },
        actions: (self) => ({
          inc: () => self.set({ count: self.state.count + 1 }),
        }),
      })
    );

    // Destructure and call standalone — self is closed over, not `this`.
    const { inc } = result.current.actions;
    act(() => inc());
    expect(result.current.state.count).toBe(1);
  });

  it('keeps a stable actions identity across renders', () => {
    const { result, rerender } = renderHook(() =>
      useComponent({
        initial: { count: 0 },
        actions: (self) => ({ noop: () => self.set({ count: 0 }) }),
      })
    );
    const first = result.current.actions;
    rerender();
    expect(result.current.actions).toBe(first);
  });

  it('defaults actions to an empty object when no factory is given', () => {
    const { result } = renderHook(() => useComponent({ initial: { count: 0 } }));
    expect(result.current.actions).toEqual({});
  });
});

describe('useComponent — onMount', () => {
  it('runs once after mount and not on re-render', () => {
    const onMount = vi.fn();
    const { rerender } = renderHook(() =>
      useComponent({ initial: { count: 0 }, onMount })
    );

    expect(onMount).toHaveBeenCalledTimes(1);
    rerender();
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('receives self, so it can call an action', () => {
    const { result } = renderHook(() =>
      useComponent({
        initial: { ready: false },
        actions: (self) => ({ markReady: () => self.set({ ready: true }) }),
        onMount: (self) => self.markReady(),
      })
    );
    expect(result.current.state.ready).toBe(true);
  });

  it('runs the returned cleanup on unmount', () => {
    const cleanup = vi.fn();
    const { unmount } = renderHook(() =>
      useComponent({ initial: { count: 0 }, onMount: () => cleanup })
    );

    expect(cleanup).not.toHaveBeenCalled();
    unmount();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});

describe('useComponent — rendering', () => {
  it('re-renders the consumer when state changes', () => {
    const renders: number[] = [];
    function Counter() {
      const { state, actions } = useComponent({
        initial: { count: 0 },
        actions: (self) => ({ inc: () => self.set({ count: self.state.count + 1 }) }),
      });
      renders.push(state.count);
      return <button onClick={actions.inc}>{state.count}</button>;
    }

    const { getByRole } = render(<Counter />);
    const button = getByRole('button');
    expect(button.textContent).toBe('0');

    act(() => button.click());
    expect(button.textContent).toBe('1');
    expect(renders).toEqual([0, 1]);
  });
});
