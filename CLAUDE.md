# use-component

Local state and the methods that update it, co-located at any point in JSX —
including inside `.map()` and conditionals, where a hook call is illegal. Two
exports carry the library: `useComponent` (the hook) and `Component` (the same
thing as an element).

## Commands

The repo uses pnpm.

| | |
| --- | --- |
| `pnpm test` | Vitest on jsdom; `pnpm test:watch` to iterate |
| `pnpm typecheck` | `tsc --noEmit` over `src`, `playground`, and the tests |
| `pnpm build` | typecheck, then the Vite library build into `dist/` |
| `pnpm dev` | the playground |

Type inference is part of the public contract here, so `pnpm typecheck` is a
real test rather than a formality — see the first constraint below.

## Documentation

Fix JSDoc in the same commit as the signature it describes. A doc that has
quietly become false costs more than one that is missing.

For how to write it, use the `documenting-typescript` skill.

## Design constraints

Two decisions are easy to undo by accident:

- **`Self` must not name the action type `A`.** TypeScript infers the actions
  from the factory's return value; naming that type in the parameter makes the
  inference circular and silently collapses `A` to `object`. `NoInfer` does not
  rescue it. That is why one action calls another through a shared local
  reference rather than through `self`. `pnpm typecheck` catches a regression.
- **`onMount` is the only lifecycle hook.** Update-phase emulation
  (`onUpdate`, `onBeforeUpdate`, dependency arrays) was removed deliberately;
  side effects belong in the caller's own `useEffect`.
