/**
 * Helpers for reading untrusted objects safely.
 *
 * Every object that enters the gateway is first copied into a null-prototype
 * snapshot of its own enumerable properties. This gives three guarantees:
 *  1. Inherited properties (for example from a polluted Object.prototype) are invisible.
 *  2. Each property is read exactly once, so a getter cannot return one value
 *     when checked and another when used (time-of-check vs time-of-use).
 *  3. Later code never touches the caller's object again.
 */

export type Snapshot = Record<string, unknown>;

/** True only for object literals and null-prototype objects (not arrays, Dates, Maps, class instances). */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Copies the own enumerable string-keyed properties of a plain object.
 * Keys listed in `skipKeys` are not read at all (their getters never run).
 * Returns null if the value is not a plain object.
 */
export function snapshotOwn(
  value: unknown,
  skipKeys: readonly string[] = [],
): Snapshot | null {
  if (!isPlainObject(value)) {
    return null;
  }
  const copy: Snapshot = Object.create(null) as Snapshot;
  for (const key of Object.keys(value)) {
    if (!skipKeys.includes(key)) {
      copy[key] = value[key];
    }
  }
  return copy;
}

/** Reads an own property only, ignoring anything inherited through the prototype chain. */
export function getOwn(container: Snapshot, key: string): unknown {
  return Object.hasOwn(container, key) ? container[key] : undefined;
}
