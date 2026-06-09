import { createRef } from 'react';
import {
  useComponent,
  useComponentState,
  useUpdate,
  Component,
  Effect,
} from '../src';

function ColorGenerator() {
  const { state, setState } = useComponent<{ hue: number }>({
    initialState: { hue: 0 },
  });

  return (
    <section>
      <h3>useComponent — state</h3>
      <button onClick={() => setState({ hue: Math.random() * 360 })}>
        Generate Color
      </button>
      <div
        style={{
          width: 100,
          height: 100,
          marginTop: 8,
          borderRadius: 8,
          background: `hsl(${state.hue}, 50%, 50%)`,
        }}
      />
    </section>
  );
}

function TodoItem({ todo }: { todo: string }) {
  const { state, setState } = useComponentState({ hue: Math.random() * 360 });

  return (
    <li style={{ color: `hsl(${state.hue}, 50%, 50%)` }}>
      <button onClick={() => setState({ hue: Math.random() * 360 })}>🎨</button>{' '}
      {todo}
    </li>
  );
}

function TodoApp() {
  const { state, setState, refs } = useComponent<
    { todos: string[] },
    { input: React.RefObject<HTMLInputElement | null> }
  >({
    getRefs: () => ({ input: createRef<HTMLInputElement>() }),
    getInitialState: () => ({ todos: ['Learn use-component'] }),
  });

  useUpdate(() => {
    document.title = `${state.todos.length} Todos`;
  }, [state.todos.length]);

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const input = refs.input.current;
    if (input?.value) {
      setState({ todos: [...state.todos, input.value] });
      input.value = '';
    }
  };

  return (
    <section>
      <h3>useComponent — refs + lifecycle</h3>
      <form onSubmit={addTodo}>
        <input ref={refs.input} placeholder="Add a todo..." />
        <button type="submit">Add</button>
      </form>
      <ul>
        {state.todos.map((todo, i) => (
          <TodoItem key={i} todo={todo} />
        ))}
      </ul>
      <button onClick={() => setState({ todos: [] })}>Clear all</button>
    </section>
  );
}

function RenderPropsDemo() {
  return (
    <section>
      <h3>Component — render props (legacy)</h3>
      <Component initialState={{ count: 0 }}>
        {({ state, setState }) => (
          <button onClick={() => setState({ count: state.count + 1 })}>
            Count: {state.count}
          </button>
        )}
      </Component>
      <Effect onMount={() => console.log('Effect mounted')} />
    </section>
  );
}

export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 24, display: 'grid', gap: 24 }}>
      <h1>use-component playground</h1>
      <ColorGenerator />
      <TodoApp />
      <RenderPropsDemo />
    </main>
  );
}
