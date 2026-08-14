# use-component

Inline local state and its methods, placed anywhere in JSX — including inside `.map()` or conditionals, where hooks cannot be called.

**[cbcruk.github.io/use-component](https://cbcruk.github.io/use-component/)** — live demo and API reference.

```tsx
{rows.map((row) => (
  <Component
    key={row.id}
    initial={{ open: false }}
    actions={(self) => ({ toggle: () => self.set({ open: !self.state.open }) })}
  >
    {({ state, actions }) => (
      <Row row={row} open={state.open} onToggle={actions.toggle} />
    )}
  </Component>
))}
```

State and behavior are grouped like a class body. The `actions` factory
receives `self` — the explicit `this`:

| | Class equivalent |
| --- | --- |
| `state`      | fields |
| `actions`    | methods |
| `self.set`   | `this.setState` (shallow partial merge) |
| `self.state` | `this.state` (always current) |

`actions` are created once and read fresh state through `self.state`, so there are no stale closures.

## Install

```bash
npm install use-component
# or
pnpm add use-component
```

## API

### `useComponent(options)`

Groups state with its methods in a single hook.

```tsx
import { useComponent } from 'use-component'

function Counter() {
  const { state, set, actions } = useComponent({
    initial: { count: 0 },
    actions: (self) => ({
      inc: () => self.set({ count: self.state.count + 1 }),
      reset: () => self.set({ count: 0 }),
    }),
  })

  return (
    <div>
      <button onClick={actions.inc}>Count: {state.count}</button>
      <button onClick={actions.reset}>Reset</button>
      <button onClick={() => set({ count: 100 })}>Set 100</button>
    </div>
  )
}
```

**Returns** `{ state, set, actions }`

| | |
| --- | --- |
| `state`   | current state |
| `set`     | partial-merge setter, for one-off updates that don't need a named action |
| `actions` | the methods from the `actions` factory |

**Options**

| Option | Description |
| --- | --- |
| `initial` | Initial state. A function is treated as a lazy initializer. |
| `actions` | `(self) => ({ ...methods })`. Built once. `self` has `state` (fresh) and `set`. |
| `onMount` | Runs once after mount (`componentDidMount`). Receives `self` with actions merged in, so it may call them. May return a cleanup function. |

**Composing actions.** To have one action call another, capture it as a local
and share the reference — no `this`, no stale closures:

```tsx
actions: (self) => {
  const inc = () => self.set((prev) => ({ count: prev.count + 1 }))
  return {
    inc,
    double: () => { inc(); inc() }, // two updates in one tick → +2
  }
}
```

> `self.state` is fresh across events, but — like class `this.state` — it is
> not updated synchronously within the same tick. For several updates in one
> tick, use the functional updater `self.set((prev) => ...)` as above.

### `<Component>`

Render-props form of `useComponent`, for placing state where a hook cannot be called (inside `.map()`, conditionals, etc.).

```tsx
import { Component } from 'use-component'

<Component
  initial={{ open: false }}
  actions={(self) => ({ toggle: () => self.set({ open: !self.state.open }) })}
>
  {({ state, actions }) => (
    <button onClick={actions.toggle}>{state.open ? '▼' : '▶'} details</button>
  )}
</Component>
```

Props are the same as `useComponent`'s options. `children` is a function receiving `{ state, set, actions }`.

### Loading on mount

```tsx
<Component
  initial={{ user: null }}
  onMount={async ({ set }) => {
    set({ user: await fetchUser() })
  }}
>
  {({ state }) => (state.user ? <Profile user={state.user} /> : <Spinner />)}
</Component>
```

### Utility hooks

```tsx
import { usePrevious, usePreviousDistinct, useForceUpdate } from 'use-component'

const prevCount = usePrevious(count)
const prevUser = usePreviousDistinct(user, (a, b) => a?.id === b?.id)
const forceUpdate = useForceUpdate()
```

| Hook | Description |
| --- | --- |
| `usePrevious(value)` | Previous value from the last render. |
| `usePreviousDistinct(value, compare?)` | Previous value, updated only when `compare` returns `false`. |
| `useForceUpdate()` | Returns a function that forces a re-render. |

## TypeScript

`state` (`S`) and `actions` (`A`) are inferred:

```tsx
const { state, actions } = useComponent({
  initial: { count: 0, name: '' },
  actions: (self) => ({
    inc: () => self.set({ count: self.state.count + 1 }),
  }),
})

state.count   // number
state.name    // string
actions.inc   // () => void
```

Or specify explicitly:

```tsx
interface State { count: number }
interface Actions { inc: () => void }

useComponent<State, Actions>({
  initial: { count: 0 },
  actions: (self) => ({ inc: () => self.set({ count: self.state.count + 1 }) }),
})
```

## Exports

| Export | Kind |
| --- | --- |
| `useComponent` | hook |
| `Component` | render-props component |
| `usePrevious`, `usePreviousDistinct`, `useForceUpdate` | utility hooks |
| `SetState`, `Self`, `ActionsFactory`, `ComponentApi`, `UseComponentOptions`, `ComponentProps` | types |

## License

MIT
