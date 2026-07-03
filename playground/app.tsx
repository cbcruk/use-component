import { useComponent, Component } from '../src';

// useComponent — a class body as a hook.
function ColorGenerator() {
  const { state, actions } = useComponent({
    initial: { hue: 0 },
    actions: (set) => ({
      randomize: () => set({ hue: Math.random() * 360 }),
    }),
  });

  return (
    <section>
      <h3>useComponent — state + methods</h3>
      <button onClick={actions.randomize}>Generate Color</button>
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

// <Component> — local state per list row, no extracted component needed,
// even though hooks cannot be called inside a .map().
function TodoApp() {
  const { state, actions } = useComponent({
    initial: { todos: ['Learn use-component'], draft: '' },
    actions: (set, get) => ({
      setDraft: (draft: string) => set({ draft }),
      add: () => {
        const draft = get().draft.trim();
        if (!draft) return;
        set({ todos: [...get().todos, draft], draft: '' });
      },
      clear: () => set({ todos: [] }),
    }),
  });

  return (
    <section>
      <h3>useComponent + inline &lt;Component&gt; per row</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          actions.add();
        }}
      >
        <input
          value={state.draft}
          onChange={(e) => actions.setDraft(e.target.value)}
          placeholder="Add a todo..."
        />
        <button type="submit">Add</button>
      </form>
      <ul>
        {state.todos.map((todo, i) => (
          <Component
            key={i}
            initial={{ hue: (i * 57) % 360 }}
            actions={(set, get) => ({
              recolor: () => set({ hue: (get().hue + 47) % 360 }),
            })}
          >
            {({ state: s, actions: a }) => (
              <li style={{ color: `hsl(${s.hue}, 60%, 45%)` }}>
                <button onClick={a.recolor}>🎨</button> {todo}
              </li>
            )}
          </Component>
        ))}
      </ul>
      <button onClick={actions.clear}>Clear all</button>
    </section>
  );
}

export function App() {
  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        padding: 24,
        display: 'grid',
        gap: 24,
      }}
    >
      <h1>use-component playground</h1>
      <ColorGenerator />
      <TodoApp />
    </main>
  );
}
