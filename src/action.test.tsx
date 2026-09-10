import { describe, expect, it, afterEach } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { StrictMode } from 'react';
import { Component } from './component';
import { $ } from './action';

afterEach(cleanup);

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('generator actions (prototype)', () => {
  it('applies state once the awaited work settles', async () => {
    const gate = deferred<string>();

    const { getByRole } = render(
      <Component
        initial={{ user: null as string | null }}
        actions={(self) => ({
          *load() {
            const user = yield* $(gate.promise);
            self.set({ user });
          },
        })}
      >
        {({ state, actions }) => (
          <button onClick={() => actions.load()}>{state.user ?? 'idle'}</button>
        )}
      </Component>
    );

    act(() => getByRole('button').click());
    expect(getByRole('button').textContent).toBe('idle');

    await act(async () => gate.resolve('ada'));
    expect(getByRole('button').textContent).toBe('ada');
  });

  it('stops at the next step after unmount, running the action’s finally', async () => {
    const gate = deferred<string>();
    const steps: string[] = [];

    const { getByRole, unmount } = render(
      <Component
        initial={{ user: null as string | null }}
        actions={(self) => ({
          *load() {
            try {
              steps.push('start');
              const user = yield* $(gate.promise);
              steps.push('resumed');
              self.set({ user });
            } finally {
              steps.push('finally');
            }
          },
        })}
      >
        {({ state, actions }) => (
          <button onClick={() => actions.load()}>{state.user ?? 'idle'}</button>
        )}
      </Component>
    );

    act(() => getByRole('button').click());
    expect(steps).toEqual(['start']);

    unmount();
    await act(async () => gate.resolve('ada'));

    // No AbortSignal, no cancellation flag in the action. It was simply not
    // resumed, and `return()` still unwound its `finally`.
    expect(steps).toEqual(['start', 'finally']);
  });

  it('cancels only the row that unmounted', async () => {
    const gates = { a: deferred<string>(), b: deferred<string>() };
    const resumed: string[] = [];

    function Table({ ids }: { ids: Array<'a' | 'b'> }) {
      return (
        <ul>
          {ids.map((id) => (
            <Component
              key={id}
              initial={{ user: null as string | null }}
              actions={(self) => ({
                *load() {
                  const user = yield* $(gates[id].promise);
                  resumed.push(id);
                  self.set({ user });
                },
              })}
            >
              {({ state, actions }) => (
                <li>
                  <button data-testid={id} onClick={() => actions.load()}>
                    {state.user ?? 'idle'}
                  </button>
                </li>
              )}
            </Component>
          ))}
        </ul>
      );
    }

    const { getByTestId, rerender } = render(<Table ids={['a', 'b']} />);
    act(() => getByTestId('a').click());
    act(() => getByTestId('b').click());

    rerender(<Table ids={['b']} />);
    await act(async () => {
      gates.a.resolve('gone');
      gates.b.resolve('ada');
    });

    expect(resumed).toEqual(['b']);
    expect(getByTestId('b').textContent).toBe('ada');
  });

  it('rejects when the action throws', async () => {
    const gate = deferred<string>();
    let load!: () => Promise<void | undefined>;

    render(
      <Component
        initial={{ user: null as string | null }}
        actions={() => ({
          *load() {
            yield* $(gate.promise);
          },
        })}
      >
        {({ actions }) => {
          load = actions.load;
          return <span />;
        }}
      </Component>
    );

    let caught: unknown;
    const running = load().catch((error: unknown) => {
      caught = error;
    });

    await act(async () => {
      gate.reject(new Error('boom'));
      await running;
    });

    expect((caught as Error).message).toBe('boom');
  });

  it('still runs after StrictMode’s mount, unmount, mount', async () => {
    const gate = deferred<string>();

    const { getByRole } = render(
      <StrictMode>
        <Component
          initial={{ user: null as string | null }}
          actions={(self) => ({
            *load() {
              const user = yield* $(gate.promise);
              self.set({ user });
            },
          })}
        >
          {({ state, actions }) => (
            <button onClick={() => actions.load()}>{state.user ?? 'idle'}</button>
          )}
        </Component>
      </StrictMode>
    );

    act(() => getByRole('button').click());
    await act(async () => gate.resolve('ada'));

    expect(getByRole('button').textContent).toBe('ada');
  });

  // React's snapshot semantics are not repaired by the generator. Whether a
  // resumed step sees its own write depends on whether a commit happened to
  // land in between, which is exactly the hazard the functional updater
  // exists for.
  describe('reads after a step', () => {
    it('sees its own write when the step waits for a real task', async () => {
      const gate = deferred<void>();
      let seen: number | undefined;

      const { getByRole } = render(
        <Component
          initial={{ count: 0 }}
          actions={(self) => ({
            *bump() {
              self.set({ count: self.state.count + 1 });
              yield* $(gate.promise);
              seen = self.state.count;
            },
          })}
        >
          {({ state, actions }) => (
            <button onClick={() => actions.bump()}>{state.count}</button>
          )}
        </Component>
      );

      act(() => getByRole('button').click());
      await act(async () => gate.resolve());

      expect(seen).toBe(1);
    });

    it('reads a stale value when the step settles before the commit', async () => {
      let seen: number | undefined;
      let bump!: () => Promise<void | undefined>;

      render(
        <Component
          initial={{ count: 0 }}
          actions={(self) => ({
            *bump() {
              self.set({ count: self.state.count + 1 });
              yield* $(Promise.resolve());
              seen = self.state.count;
            },
          })}
        >
          {({ actions }) => {
            bump = actions.bump;
            return <span />;
          }}
        </Component>
      );

      await act(async () => {
        void bump();
      });

      expect(seen).toBe(0);
    });
  });
});
