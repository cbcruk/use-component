import { describe, it, expect, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { Component } from './component';

describe('<Component>', () => {
  it('passes { state, set, actions } to children', () => {
    const seen: string[] = [];
    render(
      <Component
        initial={{ count: 0 }}
        actions={(set) => ({ inc: () => set({ count: 1 }) })}
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
        actions={(set, get) => ({ inc: () => set({ count: get().count + 1 }) })}
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

  it('gives each instance in a .map() its own independent state', () => {
    const rows = ['a', 'b', 'c'];
    const { getAllByRole } = render(
      <ul>
        {rows.map((row) => (
          <Component
            key={row}
            initial={{ n: 0 }}
            actions={(set, get) => ({ bump: () => set({ n: get().n + 1 }) })}
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
});
