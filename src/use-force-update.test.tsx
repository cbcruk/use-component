import { describe, it, expect } from 'vitest';
import { act, render } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { useForceUpdate } from './use-force-update';

describe('useForceUpdate', () => {
  it('returns a stable function across renders', () => {
    const { result, rerender } = renderHook(() => useForceUpdate());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it('triggers a re-render when called', () => {
    let renderCount = 0;
    function Probe() {
      const forceUpdate = useForceUpdate();
      renderCount++;
      return <button onClick={forceUpdate}>render</button>;
    }

    const { getByRole } = render(<Probe />);
    expect(renderCount).toBe(1);

    act(() => getByRole('button').click());
    expect(renderCount).toBe(2);
  });
});
