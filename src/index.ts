// entries.ts
import { ValueOf } from 'type-fest';

import type { ConstEntries, ObjectFromEntries } from './typings';

type EnumValue = number | string;

type EnumItem<E extends Record<string, EnumValue>> = [keyof E, ValueOf<E>, string | undefined];

type StringKeys<T> = Exclude<keyof T, number | symbol>;

const EnumItemIndex = Object.freeze({
  NAME: 0,
  VALUE: 1,
  ALIAS: 2,
});

const findMapEntry = <K, V>(m: Map<K, V>, predicate: (v: V) => boolean): [K, V] | undefined  => {
    return Object.entries(m).find(([_, v]) => predicate(v)) as [K, V];
}

/**
 * create an enum able to be looped through, with alias if needed.
 */
export class IterableEnum<
  E extends Record<string, EnumValue>
  // Keys extends string = StringKeys<E>
> {
  // really love Map's property to preserve keys' order!
  private readonly _map: Map<ValueOf<E>, EnumItem<E>>;

  constructor(enumObj: E, enumAlias?: Record<keyof E, string>, order?: ValueOf<E>[]) {
    this._map = new Map();
    const valKeyMap = new Map(
      Object.entries(enumObj).map(([key, val]) => [val as ValueOf<E>, key as StringKeys<E>])
    );
    const orderedValSet = new Set([...(order ?? []), ...(Object.values(enumObj) as ValueOf<E>[])]);
    for (const val of orderedValSet) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const key = valKeyMap.get(val)!;
      this._map.set(val, [key, val, enumAlias?.[key]]);
    }
  }

  /**
   * @param options DON't use the same value for different keys or the same key for different values.
   */
  static createEnum<
    const Options extends ConstEntries<string>,
    E extends ObjectFromEntries<Options> = ObjectFromEntries<Options>
  >(options: Options, enumAlias?: Record<keyof E, string>): E & IterableEnum<E>;
  /**
   * @param enumObj DON't use the same value for different keys or the same key for different values.
   * @param order should contain all enum values. undefined behavior for missing values.
   */
  static createEnum<E extends Record<string, EnumValue>, Keys extends string = StringKeys<E>>(
    enumObj: E,
    enumAlias?: Record<keyof E, string>,
    order?: ValueOf<E>[]
  ): E & IterableEnum<E>;
  // TODO: accept ts native enum as argument.
  // static createFromTsEnum<Keys extends string, TsEnum extends Record<string, EnumValue>>  (
  //   tsEnum: TsEnum,
  //   enumAlias?: Record<Keys, string>
  // ): E & IterableEnum<Keys, E>;
  static createEnum(...args: any[]) {
    if (args.length === 1 || (args.length === 2 && Array.isArray(args[0]))) {
      const [options, enumAlias] = args;
      const enumObj = Object.fromEntries(options);
      const order = options.map(([_key, val]: any) => val);
      return Object.assign(new IterableEnum(enumObj, enumAlias, order), enumObj);
    } else if (args.length === 3 || (args.length === 2 && !Array.isArray(args[0]))) {
      const [enumObj, enumAlias, order] = args;
      return Object.assign(new IterableEnum(enumObj, enumAlias, order), enumObj);
    }
    throw new Error('The arguments are improper');
  }

  getName(value?: ValueOf<E>) {
    if (value === undefined) {
      return undefined;
    }
    return this._map.get(value)?.[EnumItemIndex.NAME];
  }

  getAlias(value?: ValueOf<E>) {
    if (value === undefined) {
      return undefined;
    }
    return this._map.get(value)?.[EnumItemIndex.ALIAS];
  }

  getValueByName(name?: keyof E) {
    if (name === undefined) {
      return undefined;
    }
    const item = findMapEntry(this._map, (v) => v[EnumItemIndex.NAME] === name)?.[1];
    return item?.[EnumItemIndex.VALUE];
  }

  getAliasByName(name?: keyof E) {
    if (name === undefined) {
      return undefined;
    }
    const item = findMapEntry(this._map, (v) => v[EnumItemIndex.NAME] === name)?.[1];
    return item?.[EnumItemIndex.ALIAS];
  }

  getValueByAlias(alias?: string) {
    if (alias === undefined) {
      return undefined;
    }
    const item = findMapEntry(this._map, (v) => v[EnumItemIndex.ALIAS] === alias)?.[1];
    return item?.[EnumItemIndex.VALUE];
  }

  getDataSource(vals?: ValueOf<E>[]) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return vals ? vals.map((key) => this._map.get(key)!) : [...this._map.values()];
  }

  getSelectOptions(vals?: ValueOf<E>[]) {
    return this.getDataSource(vals).map((item) => ({
      label: item?.[2],
      value: item?.[1],
    }));
  }
}

/**
 * retrieve enum type from IterableEnum
 * @example
 * const weekEntries = [
 *  ['Sunday', 0],
 *  ['Monday', 1]
 * ] as const;
 * const weekEnum = IterableEnum.createEnum(weekEntries);
 * type Week = EnumType<typeof weekEnum>; // 0 | 1
 */
export type EnumType<T> = T extends IterableEnum<infer E> & infer E
  ? ValueOf<E>
  : T extends Record<string, EnumValue>
  ? ValueOf<T>
  : T;

export default IterableEnum;