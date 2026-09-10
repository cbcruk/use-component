/**
 * PROTOTYPE evidence. Compiles only if the inference described in the
 * generator-action notes actually holds, so `pnpm typecheck` is the test.
 */
import { useComponent } from './use-component';
import { $ } from './action';

type IsAny<T> = 0 extends 1 & T ? true : false;

declare function fetchUser(id: string): Promise<{ name: string }>;

const api = useComponent({
  initial: { user: null as string | null, count: 0 },
  actions: (self) => ({
    // A generator member: the caller gets a promise, widened by cancellation.
    *load(id: string) {
      const user = yield* $(fetchUser(id));
      self.set({ user: user.name });
      return user.name;
    },
    // A plain member: untouched.
    reset: () => self.set({ count: 0 }),
  }),
  onMount: (self) => {
    // Driven inside `onMount` too, so the return value is a promise.
    const running: Promise<string | undefined> = self.load('1');
    void running;
  },
});

// The caller-facing shape.
export const loaded: Promise<string | undefined> = api.actions.load('1');
export const plain: void = api.actions.reset();

// Under `noImplicitAny` a bare `yield` is not a silent `any` but an error
// (TS7057), because the generator has no contextual or annotated type here.
// An unused `@ts-expect-error` is itself an error, so this asserts it.
export const strictness = useComponent({
  initial: { n: 0 },
  actions: () => ({
    *bare() {
      // @ts-expect-error TS7057
      const user = yield fetchUser('1');
      return user;
    },
  }),
});

// Consumers who leave `noImplicitAny` off get the silent version instead.
type IsAnyCheck = IsAny<any>;
export const silentElsewhere: IsAnyCheck = true;
