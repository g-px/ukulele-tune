import type { en } from "./en";

/** Turn the literal types of `as const` copy into plain strings so other locales can differ. */
type Widen<T> = T extends string
  ? string
  : T extends boolean
    ? boolean
    : T extends (...args: infer A) => infer R
      ? (...args: A) => Widen<R>
      : T extends readonly (infer U)[]
        ? readonly Widen<U>[]
        : T extends object
          ? { readonly [K in keyof T]: Widen<T[K]> }
          : T;

export type Strings = Widen<typeof en>;
