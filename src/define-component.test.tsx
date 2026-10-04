import { describe, it, expect } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { defineComponent } from './define-component';
import { useComponent } from './use-component';
import { Component } from './component';

const Counter = defineComponent((start: number) => ({
  initial: { count: start },
  actions: (self) => {
    const inc = () => self.set({ count: self.state.count + 1 });
    return { inc, double: () => { inc(); inc(); } };
  },
  onMount: (self) => self.inc(),
}));

describe('defineComponent', () => {
  it('builds options that useComponent runs as written inline', () => {
    const { result } = renderHook(() => useComponent(Counter(10)));
    expect(result.current.state.count).toBe(11);

    act(() => result.current.actions.double());
    expect(result.current.state.count).toBe(13);
  });

  it('reads its arguments on the first render only', () => {
    const { result, rerender } = renderHook(
      ({ start }) => useComponent(Counter(start)),
      { initialProps: { start: 0 } }
    );
    rerender({ start: 50 });
    expect(result.current.state.count).toBe(1);
  });

  it('gives each spread <Component> its own state', () => {
    const { getAllByRole } = render(
      <ul>
        {[0, 100].map((start) => (
          <Component key={start} {...Counter(start)}>
            {({ state, actions }) => (
              <li>
                <button onClick={actions.inc}>{state.count}</button>
              </li>
            )}
          </Component>
        ))}
      </ul>
    );

    const buttons = getAllByRole('button');
    act(() => buttons[0].click());
    expect(buttons.map((b) => b.textContent)).toEqual(['2', '101']);
  });

  it('infers state and actions without collapsing them', () => {
    const { result } = renderHook(() => useComponent(Counter(0)));
    const count: number = result.current.state.count;
    // Fails `pnpm typecheck` if `A` collapses to `object`.
    const double: () => void = result.current.actions.double;
    expect([typeof count, typeof double]).toEqual(['number', 'function']);
  });
});
