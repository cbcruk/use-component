import { describe, it, expect, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { Component } from './component';

describe('<Component>', () => {
  it('passes { state, set, actions } to children', () => {
    const seen: string[] = [];
    render(
      <Component
        initial={{ count: 0 }}
        actions={(self) => ({ inc: () => self.set({ count: 1 }) })}
      >
        {(api) => {
          seen.push(...Object.keys(api).sort());
          return null;
        }}
      </Component>
    );
    expect(seen).toEqual(['actions', 'set', 'state']);
  });

  it('renders state and updates through an action', () => {
    const { getByRole } = render(
      <Component
        initial={{ count: 0 }}
        actions={(self) => ({ inc: () => self.set({ count: self.state.count + 1 }) })}
      >
        {({ state, actions }) => (
          <button onClick={actions.inc}>Count: {state.count}</button>
        )}
      </Component>
    );

    const button = getByRole('button');
    expect(button.textContent).toBe('Count: 0');

    act(() => button.click());
    expect(button.textContent).toBe('Count: 1');
  });

  it('supports actions composed via a shared local reference', () => {
    const { getByRole } = render(
      <Component
        initial={{ count: 0 }}
        actions={(self) => {
          const inc = () => self.set((prev) => ({ count: prev.count + 1 }));
          return {
            inc,
            double: () => {
              inc();
              inc();
            },
          };
        }}
      >
        {({ state, actions }) => (
          <button onClick={actions.double}>Count: {state.count}</button>
        )}
      </Component>
    );

    const button = getByRole('button');
    act(() => button.click());
    expect(button.textContent).toBe('Count: 2');
  });

  it('gives each instance in a .map() its own independent state', () => {
    const rows = ['a', 'b', 'c'];
    const { getAllByRole } = render(
      <ul>
        {rows.map((row) => (
          <Component
            key={row}
            initial={{ n: 0 }}
            actions={(self) => ({ bump: () => self.set({ n: self.state.n + 1 }) })}
          >
            {({ state, actions }) => (
              <li>
                <button onClick={actions.bump}>{`${row}:${state.n}`}</button>
              </li>
            )}
          </Component>
        ))}
      </ul>
    );

    const buttons = getAllByRole('button');
    // Bump only the middle instance twice.
    act(() => buttons[1].click());
    act(() => buttons[1].click());

    expect(buttons.map((b) => b.textContent)).toEqual(['a:0', 'b:2', 'c:0']);
  });

  it('runs onMount for the inline instance', () => {
    const onMount = vi.fn();
    render(
      <Component initial={{ ok: false }} onMount={onMount}>
        {({ state }) => <span>{String(state.ok)}</span>}
      </Component>
    );
    expect(onMount).toHaveBeenCalledTimes(1);
  });

  it('supports loading state on mount', () => {
    const { getByRole } = render(
      <Component
        initial={{ label: 'loading' }}
        onMount={({ set }) => set({ label: 'loaded' })}
      >
        {({ state }) => <button>{state.label}</button>}
      </Component>
    );
    expect(getByRole('button').textContent).toBe('loaded');
  });

  // The two below pin the async-load pattern the README and the `Component`
  // JSDoc document. An `async onMount` returns a promise, React registers it
  // as the cleanup, and unmounting fails with `destroy is not a function` —
  // so a regression to `async` breaks the second one outright.
  describe('loading asynchronously on mount', () => {
    function renderLoader(fetchUser: (options: { signal: AbortSignal }) => Promise<string>) {
      return render(
        <Component
          initial={{ user: null as string | null }}
          onMount={({ set }) => {
            const controller = new AbortController();
            fetchUser({ signal: controller.signal }).then((user) => set({ user }));
            return () => controller.abort();
          }}
        >
          {({ state }) => <button>{state.user ?? 'loading'}</button>}
        </Component>
      );
    }

    it('applies the result once the work settles', async () => {
      const { getByRole } = renderLoader(() => Promise.resolve('ada'));
      expect(getByRole('button').textContent).toBe('loading');

      await act(async () => {});
      expect(getByRole('button').textContent).toBe('ada');
    });

    it('aborts the work when it unmounts before the result arrives', async () => {
      let seen: AbortSignal | undefined;
      let settle!: (user: string) => void;

      const { getByRole, unmount } = renderLoader(({ signal }) => {
        seen = signal;
        return new Promise((resolve) => {
          settle = resolve;
        });
      });
      expect(getByRole('button').textContent).toBe('loading');
      expect(seen?.aborted).toBe(false);

      unmount();
      expect(seen?.aborted).toBe(true);

      // The late result must not reach a component that is already gone.
      await act(async () => settle('ada'));
    });
  });
});
