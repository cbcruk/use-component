/**
 * PROTOTYPE. Generator-driven actions, for evaluation only. Not exported from
 * the package entry.
 *
 * An `async` action cannot be stopped once it is running: `await` hands
 * control to the microtask queue and nothing gets it back. A generator hands
 * control to whoever calls `next`, so the library decides whether the next
 * step runs at all. Cancellation stops being a signal the action has to
 * cooperate with and becomes the absence of a resume.
 */

/**
 * Awaits `promise` from inside a generator action while keeping its type.
 *
 * A bare `yield` is typed by the generator's single `TNext` parameter, so it
 * degrades to `any`. Delegating with `yield*` types the result per call site.
 *
 * ```ts
 * const user = yield* $(fetchUser(id)); // typed
 * const user = yield fetchUser(id);     // any
 * ```
 */
export function* $<T>(promise: Promise<T>): Generator<Promise<T>, T, unknown> {
  return (yield promise) as T;
}

/** What a generator action is allowed to be. */
export type ActionGenerator<R> = Generator<Promise<unknown>, R, never>;

/**
 * Rewrites the generator members of an actions object into the promise-
 * returning functions callers actually get.
 *
 * The result is `undefined` when the action was cancelled, which is why the
 * return type is widened rather than left as `R`.
 */
export type Driven<A> = {
  [K in keyof A]: A[K] extends (...args: infer P) => Generator<any, infer R, any>
    ? (...args: P) => Promise<R | undefined>
    : A[K];
};

const GENERATOR_TAG = '[object GeneratorFunction]';

/**
 * Whether `value` is a generator function.
 *
 * Reads the built-in tag rather than comparing constructors, so it holds
 * across realms. Down-compiling generators to ES5 erases the tag; this
 * library targets ES2020, where it survives.
 */
export function isGeneratorFunction(
  value: unknown
): value is (...args: never[]) => ActionGenerator<unknown> {
  return (
    typeof value === 'function' &&
    Object.prototype.toString.call(value) === GENERATOR_TAG
  );
}

/**
 * Runs a generator to completion, one step per settled promise, for as long
 * as `alive` keeps returning true.
 *
 * When it stops, the generator is closed with `return()` rather than
 * abandoned, so a `finally` block inside the action still runs. The promise
 * resolves with `undefined` in that case; a throw inside the action rejects
 * it.
 */
export function drive<R>(
  generator: ActionGenerator<R>,
  alive: () => boolean
): Promise<R | undefined> {
  return new Promise<R | undefined>((resolve, reject) => {
    const settle = (step: () => IteratorResult<Promise<unknown>, R>) => {
      if (!alive()) {
        generator.return(undefined as R);
        resolve(undefined);
        return;
      }

      let result: IteratorResult<Promise<unknown>, R>;
      try {
        result = step();
      } catch (error) {
        reject(error);
        return;
      }

      if (result.done) {
        resolve(result.value);
        return;
      }

      Promise.resolve(result.value).then(
        (value) => settle(() => generator.next(value as never)),
        (error) => settle(() => generator.throw(error))
      );
    };

    settle(() => generator.next(undefined as never));
  });
}
