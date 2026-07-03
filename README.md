# use-component

**JSX 아무 곳에나 떨어뜨리는 class body.**

React Hooks가 못 하는 단 하나 — *임의의 JSX 지점, 특히 `.map()`이나 조건부 안에서, 별도 컴포넌트를 추출하지 않고 지역 state를 co-locate 하기* — 를 위한 작은 라이브러리입니다.

```tsx
{rows.map((row) => (
  <Component
    key={row.id}
    initial={{ open: false }}
    actions={(set, get) => ({ toggle: () => set({ open: !get().open }) })}
  >
    {({ state, actions }) => (
      <Row row={row} open={state.open} onToggle={actions.toggle} />
    )}
  </Component>
))}
```

## 왜 이 라이브러리인가?

이 프로젝트는 [@reach/component-component](https://reach.tech/component-component/)의 Hooks 재해석에서 출발했지만, 목표를 다시 잡았습니다.

Hooks 시대에 "인라인 state/lifecycle을 훅으로 흉내내기"는 대부분 `useState`와 중복이고, `componentDidUpdate` 같은 lifecycle 흉내는 오히려 낡은 멘탈 모델을 다시 가르칩니다. 그래서 그 부분은 전부 걷어냈습니다.

대신 **훅이 끝내 못 하는 일 하나**에 집중합니다. 훅은 루프·조건부 안에서 호출할 수 없으니, 리스트 각 항목에 작은 지역 state를 붙이려면 반드시 컴포넌트를 새로 빼야 합니다. render props는 그 자리에서 됩니다.

그리고 여기에 한 가지 관점을 더합니다:

> **정리 안 된 훅 뭉치보다, 명확한 메서드로 묶인 class가 나을 때가 있다.**

그래서 state와 그 동작을 **한 덩어리 메서드(`actions`)** 로 묶습니다. 흩어진 `useState` / `useCallback` / `useEffect` 수프도 아니고, 컴포넌트를 새로 빼는 것도 아닌 — class의 *조직화* 는 취하고 lifecycle *안티패턴* 은 버린 형태입니다.

| | 대응하는 class 개념 |
| --- | --- |
| `state`   | 필드 (fields) |
| `actions` | 메서드 (methods) |
| `set`     | `this.setState` (부분 병합) |
| `get()`   | `this.state` (항상 최신) |

`actions`는 **한 번만** 생성되고, 최신 state는 `get()`으로 읽으므로 stale closure가 없습니다.

## 설치

```bash
npm install use-component
# or
pnpm add use-component
```

## API

### `useComponent(options)` — 훅 형태

이미 컴포넌트 안에 있고, state와 그 메서드를 한 덩어리로 묶고 싶을 때.

```tsx
import { useComponent } from 'use-component'

function Counter() {
  const { state, set, actions } = useComponent({
    initial: { count: 0 },
    actions: (set, get) => ({
      inc: () => set({ count: get().count + 1 }),
      reset: () => set({ count: 0 }),
    }),
  })

  return (
    <div>
      <button onClick={actions.inc}>Count: {state.count}</button>
      <button onClick={actions.reset}>Reset</button>
      {/* 이름 붙일 필요 없는 일회성 업데이트는 set으로 */}
      <button onClick={() => set({ count: 100 })}>Set 100</button>
    </div>
  )
}
```

**옵션**

| 옵션 | 설명 |
| --- | --- |
| `initial` | 초기 state. 함수를 넘기면 lazy 초기화. |
| `actions` | `(set, get) => ({ ...methods })`. state의 메서드들. 한 번만 생성. |
| `onMount` | 마운트 직후 1회 실행 (`componentDidMount`). cleanup 함수 반환 가능. |

> lifecycle은 `onMount` **하나뿐**입니다. `onUpdate`(componentDidUpdate) 흉내는 의도적으로 뺐습니다 — 대부분 event handler(= action)에서 처리하는 편이 명확하기 때문입니다. ("You Might Not Need an Effect")

### `<Component>` — render props 형태

훅을 호출할 수 없는 자리(`.map()`, 조건부 등)에 지역 state를 둘 때. 이게 이 라이브러리의 주인공입니다.

```tsx
import { Component } from 'use-component'

<Component
  initial={{ open: false }}
  actions={(set, get) => ({ toggle: () => set({ open: !get().open }) })}
>
  {({ state, actions }) => (
    <button onClick={actions.toggle}>
      {state.open ? '▼' : '▶'} details
    </button>
  )}
</Component>
```

`<Component>`는 `useComponent`를 render props로 감싼 것뿐입니다. props는 `useComponent`의 옵션과 동일하고, `children`은 `{ state, set, actions }`를 받는 함수입니다.

### 마운트 시 데이터 로딩

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

### 유틸 훅

인라인 state 패턴과 무관하게 순수하게 유용한 훅 몇 개를 함께 제공합니다.

```tsx
import { usePrevious, usePreviousDistinct, useForceUpdate } from 'use-component'

const prevCount = usePrevious(count)
const prevUser = usePreviousDistinct(user, (a, b) => a?.id === b?.id)
const forceUpdate = useForceUpdate()
```

## TypeScript

state(`S`)와 actions(`A`)가 모두 추론됩니다.

```tsx
const { state, actions } = useComponent({
  initial: { count: 0, name: '' },
  actions: (set, get) => ({
    inc: () => set({ count: get().count + 1 }),
  }),
})

state.count   // number
state.name    // string
actions.inc   // () => void
```

명시적으로 지정하려면:

```tsx
interface State { count: number }
interface Actions { inc: () => void }

useComponent<State, Actions>({
  initial: { count: 0 },
  actions: (set, get) => ({ inc: () => set({ count: get().count + 1 }) }),
})
```

## 설계 원칙

- **훅과 겹치지 않는 것만 한다** — 인라인 지역 state. 나머지는 React 기본 훅이 이미 잘 한다.
- **class의 조직화는 취하고, lifecycle 안티패턴은 버린다** — `state`/`actions`/`set`/`get`, 그리고 `onMount` 하나뿐.
- **작게 유지** — 코어는 `useComponent` + `<Component>` 둘. gzip 약 0.6KB.

## 이전 버전(향수 포팅)에서 넘어오기

`@reach/component-component` 스타일의 lifecycle emulation API(`onUpdate`, `onBeforeUpdate`, `updateDeps`, `useLifecycle`, `Effect`, `getRefs` 등)는 제거되었습니다.

| 예전 | 지금 |
| --- | --- |
| `initialState` | `initial` |
| `setState` (병합) | `set` (병합, 동일) |
| `onUpdate` / `onBeforeUpdate` / `updateDeps` | 제거 — event handler(action)에서 처리 |
| `getRefs` / `refs` | 제거 — 필요하면 컴포넌트 추출 |
| `Effect`, `useUpdate`, `useLifecycle` | 제거 |
| render props: `<Component>{fn}</Component>` | 동일하게 유지 (주인공으로 승격) |
