/* eslint-disable @typescript-eslint/no-explicit-any */
import { UnionToIntersection } from 'type-fest';

// credit by: https://github.com/microsoft/TypeScript/issues/50379
// https://github.com/niieani/nesity/blob/main/packages/types/src/fromEntries.ts
// fromEntries is hard because:
// * Key in Iterable<[Key, any]> can be a union
// * T in Iterable<T> can be a union, usually related to mutation

type IfUnion<T, Yes, No> = true extends IsUnion<T> ? Yes : No;
type InferKeyOptionalityFromTupleType<Tuple extends readonly [PropertyKey, any]> =
  UnionToIntersection<
    Tuple extends [any, any] // IsMutableTuple
      ? { [K in Tuple[0]]?: any }
      : IfUnion<Tuple[0], { [K in Tuple[0]]?: any }, { [K in Tuple[0]]: any }>
  >;

type $Key = 0;
type $Value = 1;

/**
 * the implementation seems having some bad cases against complex type inference.
 * suspect that it is because 'keyof' will get string | number | symbol for Record
 */
export type ObjectFromEntries<
  // replace [...T[]] with T[]. If wrong, replace back with the original version in the credit link
  Tuples extends readonly (readonly [PropertyKey, any])[]
> = Tuples extends Tuples[number][]
  ? {
      [K in Tuples[number][$Key]]?: (readonly [K, Tuples[number][$Value]] & Tuples[number])[$Value];
    }
  : {
      [K in keyof InferKeyOptionalityFromTupleType<Tuples[number]>]: (readonly [
        K,
        Tuples[number][$Value]
      ] &
        Tuples[number])[$Value];
    };

export type ConstEntries<Keys extends string> = readonly (readonly [Keys, any])[];

// Alternative implemention. It doesn't handle union cases.
// Yet it's simpler, so that easier to modify to suit our special needs.
// credit by: https://dev.to/svehla/typescript-object-fromentries-389c
type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
type Cast<X, Y> = X extends Y ? X : Y;
export type FromEntriesWithoutUnion<T> = T extends [infer Key, any][]
  ? { [K in Cast<Key, string>]: Extract<ArrayElement<T>, [K, any]>[1] }
  : { [key in string]: any };
  

// credit by: https://stackoverflow.com/questions/53953814/typescript-check-if-a-type-is-a-union
type _IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;
/**
 * Check if T is a union and if T extends Bound.
 * @example
 * type A = IsUnion<'a' | 1> // true
 * type B = IsUnion<'a' | 1, 'a' | 1 | 2> // true
 * type C = IsUnion<Array<1 | 2>>; // false
 */
export type IsUnion<T, Bound = T> = [T] extends [Bound] ? _IsUnion<T> : false;