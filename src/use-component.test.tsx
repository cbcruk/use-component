import { describe, it, expect, vi } from 'vitest';
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

  it('composes actions via a shared local reference', () => {
    const { result } = renderHook(() =>
      useComponent({
        initial: { count: 0 },
        actions: (self) => {
          // Functional updater so multiple updates in one tick accumulate,
          // just like class this.setState(prev => ...).
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
