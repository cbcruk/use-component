# use-component

Modern hooks-based reimplementation of [@reach/component-component](https://reach.tech/component-component/).

React Hooks 시대에 맞게 재해석한 인라인 state, refs, lifecycle 관리 라이브러리입니다.

## 왜 이 라이브러리인가?

원본 `@reach/component-component`는 Hooks 이전 시대에 class component의 기능을 render props로 사용할 수 있게 해주는 유용한 라이브러리였습니다. 하지만 현대 React에서는:

1. **Hooks가 기본** - 더 이상 class component 패턴을 흉내낼 필요가 없습니다
2. **더 나은 타입 안전성** - TypeScript first로 설계
3. **더 세분화된 API** - 필요한 기능만 import해서 사용
4. **하위 호환성** - 기존 render props 패턴도 지원

## 설치

```bash
npm install use-component
# or
yarn add use-component
# or
pnpm add use-component
```

## 빠른 시작

### Hooks API (권장)

```tsx
import { useComponent } from 'use-component'

function ColorGenerator() {
  const { state, setState } = useComponent({
    initialState: { hue: 0 },
  })

  return (
    <div>
      <button onClick={() => setState({ hue: Math.random() * 360 })}>
        Generate Color
      </button>
      <div
        style={{
          width: 100,
          height: 100,
          background: `hsl(${state.hue}, 50%, 50%)`,
        }}
      />
    </div>
  )
}
```

### Render Props API (레거시 호환)

```tsx
import { Component } from 'use-component'

function ColorGenerator() {
  return (
    <Component initialState={{ hue: 0 }}>
      {({ state, setState }) => (
        <div>
          <button onClick={() => setState({ hue: Math.random() * 360 })}>
            Generate Color
          </button>
          <div
            style={{
              width: 100,
              height: 100,
              background: `hsl(${state.hue}, 50%, 50%)`,
            }}
          />
        </div>
      )}
    </Component>
  )
}
```

## API Reference

### `useComponent<S, R>(options)`

메인 훅. state, refs, lifecycle을 통합 관리합니다.

```tsx
const { state, setState, refs, forceUpdate } = useComponent({
  // State 초기화 (둘 중 하나 선택)
  initialState: { count: 0 },
  getInitialState: () => ({ count: 0 }), // lazy initialization

  // Refs 초기화 (둘 중 하나 선택)
  refs: { input: null },
  getRefs: () => ({ input: React.createRef() }), // lazy initialization

  // Lifecycle callbacks
  onMount: (ctx) => {
    console.log('Mounted with state:', ctx.state)
    // cleanup 함수 반환 가능
    return () => console.log('Cleanup on unmount')
  },

  onUpdate: (ctx) => {
    console.log('Updated. Prev:', ctx.prevState, 'Current:', ctx.state)
  },
  updateDeps: [
    /* deps */
  ], // 지정하지 않으면 state 변경 시마다 호출

  onUnmount: (ctx) => {
    console.log('Will unmount')
  },

  onBeforeUpdate: (ctx) => {
    // useLayoutEffect timing (DOM paint 전)
    // scroll position 저장 등에 유용
  },
})
```

### `useComponentState<S>(initialState)`

state만 필요할 때 사용하는 간소화된 훅.

```tsx
const { state, setState } = useComponentState({ count: 0 })

// class component의 setState처럼 부분 업데이트
setState({ count: 1 })
setState((prev) => ({ count: prev.count + 1 }))
```

### `useComponentRefs<R>(getRefs)`

refs만 필요할 때 사용하는 훅.

```tsx
const refs = useComponentRefs(() => ({
  input: React.createRef<HTMLInputElement>(),
  container: null as HTMLDivElement | null,
}))
```

### Lifecycle Hooks

개별 lifecycle 이벤트용 훅들:

```tsx
import {
  useMount,
  useUnmount,
  useUpdate,
  useBeforeUpdate,
  useLifecycle,
} from 'use-component'

// componentDidMount
useMount(() => {
  console.log('Mounted')
  return () => console.log('Cleanup')
})

// componentWillUnmount
useUnmount(() => {
  console.log('Will unmount')
})

// componentDidUpdate (mount 시에는 실행 안 됨)
useUpdate(() => {
  console.log('Updated')
}, [dep1, dep2])

// getSnapshotBeforeUpdate와 유사
useBeforeUpdate(() => {
  // DOM paint 전에 실행
}, [dep1, dep2])

// 통합 버전
useLifecycle({
  onMount: () => console.log('Mounted'),
  onUpdate: () => console.log('Updated'),
  onUnmount: () => console.log('Unmounted'),
  deps: [dep1, dep2],
})
```

### Utility Hooks

```tsx
import { usePrevious, usePreviousDistinct, useForceUpdate } from 'use-component'

// 이전 값 추적
const prevCount = usePrevious(count)

// 조건부 이전 값 (변경되었을 때만 업데이트)
const prevUser = usePreviousDistinct(
  user,
  (prev, curr) => prev?.id === curr?.id,
)

// 강제 리렌더
const forceUpdate = useForceUpdate()
```

### Render Props Components

```tsx
import { Component, Effect } from 'use-component';

// 전체 기능
<Component
  initialState={{ data: null }}
  onMount={async ({ setState }) => {
    const data = await fetchData();
    setState({ data });
  }}
>
  {({ state }) => <DataView data={state.data} />}
</Component>

// Side effect만 필요할 때
<Effect
  onMount={() => { document.title = 'Hello'; }}
  onUpdate={() => { document.title = `Count: ${count}`; }}
  deps={[count]}
/>
```

## 실전 예제

### Data Fetching

```tsx
function UserProfile({ userId }: { userId: string }) {
  const { state, setState } = useComponent({
    initialState: { user: null, loading: true, error: null },
    onMount: async ({ setState }) => {
      try {
        const user = await fetchUser(userId)
        setState({ user, loading: false })
      } catch (error) {
        setState({ error, loading: false })
      }
    },
  })

  if (state.loading) return <Spinner />
  if (state.error) return <Error error={state.error} />
  return <UserCard user={state.user} />
}
```

### Form with Refs

```tsx
function SearchForm() {
  const { refs, state, setState } = useComponent({
    getRefs: () => ({ input: React.createRef<HTMLInputElement>() }),
    initialState: { results: [] },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const query = refs.input.current?.value
    if (query) {
      const results = await search(query)
      setState({ results })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input ref={refs.input} placeholder="Search..." />
      <button type="submit">Search</button>
      <ResultsList results={state.results} />
    </form>
  )
}
```

### Scroll Position Restoration

```tsx
function MessageList({ messages }: { messages: Message[] }) {
  const { refs } = useComponent({
    getRefs: () => ({
      container: React.createRef<HTMLDivElement>(),
      scrollHeight: 0,
    }),
    onBeforeUpdate: ({ refs }) => {
      // DOM 업데이트 전 scroll height 저장
      if (refs.container.current) {
        refs.scrollHeight = refs.container.current.scrollHeight
      }
    },
    onUpdate: ({ refs }) => {
      // DOM 업데이트 후 scroll position 조정
      if (refs.container.current) {
        const newScrollHeight = refs.container.current.scrollHeight
        refs.container.current.scrollTop += newScrollHeight - refs.scrollHeight
      }
    },
    updateDeps: [messages],
  })

  return (
    <div ref={refs.container} style={{ overflow: 'auto', height: 400 }}>
      {messages.map((msg) => (
        <MessageItem key={msg.id} message={msg} />
      ))}
    </div>
  )
}
```

### Todo App (원본 예제 재현)

```tsx
function TodoApp() {
  const { state, setState, refs } = useComponent({
    getRefs: () => ({ input: React.createRef<HTMLInputElement>() }),
    getInitialState: () => ({ todos: ['Learn use-component'] }),
  })

  // Document title 업데이트
  useUpdate(() => {
    document.title = `${state.todos.length} Todos`
  }, [state.todos.length])

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault()
    const input = refs.input.current
    if (input?.value) {
      setState({ todos: [...state.todos, input.value] })
      input.value = ''
    }
  }

  return (
    <div>
      <h4>Todo List</h4>
      <form onSubmit={addTodo}>
        <input ref={refs.input} />
        <button type="submit">Add</button>
      </form>
      <ul>
        {state.todos.map((todo, i) => (
          <TodoItem key={i} todo={todo} />
        ))}
      </ul>
      <button onClick={() => setState({ todos: [] })}>Clear all</button>
    </div>
  )
}

function TodoItem({ todo }: { todo: string }) {
  const { state, setState } = useComponentState({
    hue: Math.random() * 360,
  })

  return (
    <li style={{ color: `hsl(${state.hue}, 50%, 50%)` }}>
      <button onClick={() => setState({ hue: Math.random() * 360 })}>🎨</button>
      {todo}
    </li>
  )
}
```

## TypeScript

모든 API가 완전한 타입을 지원합니다:

```tsx
interface MyState {
  count: number
  name: string
}

interface MyRefs {
  input: React.RefObject<HTMLInputElement>
  timer: number | null
}

const { state, setState, refs } = useComponent<MyState, MyRefs>({
  initialState: { count: 0, name: '' },
  getRefs: () => ({ input: React.createRef(), timer: null }),
})

// state와 refs가 완전히 타입 추론됨
state.count // number
refs.input.current // HTMLInputElement | null
```

## 원본 @reach/component-component와의 차이점

| Feature                   | Original     | use-component                  |
| ------------------------- | ------------ | ------------------------------ |
| API Style                 | Render Props | Hooks (primary) + Render Props |
| TypeScript                | Limited      | Full support                   |
| Bundle Size               | ~2KB         | ~1KB                           |
| Tree Shaking              | ❌           | ✅                             |
| React Version             | 16.3+        | 18+                            |
| `shouldUpdate`            | ✅           | Use `React.memo` instead       |
| `getSnapshotBeforeUpdate` | ✅           | `onBeforeUpdate`               |
