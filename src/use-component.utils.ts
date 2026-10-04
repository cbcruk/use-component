/**
 * Shallow-merges a patch into state, returning `prev` itself when every
 * patched key already holds an `Object.is`-equal value.
 */
export function mergePatch<S extends object>(prev: S, patch: Partial<S>): S {
  const changed = (Object.keys(patch) as (keyof S)[]).some(
    (key) => !Object.is(prev[key], patch[key])
  );
  return changed ? { ...prev, ...patch } : prev;
}
