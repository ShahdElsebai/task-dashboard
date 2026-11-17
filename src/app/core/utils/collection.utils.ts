import type { Identifiable } from '../dto/shared.dto';

export function replaceById<T extends Identifiable>(items: readonly T[], id: string, next: T): T[] {
  return items.map((item: T) => (item.id === id ? next : item));
}

export function removeById<T extends Identifiable>(items: readonly T[], id: string): T[] {
  return items.filter((item: T) => item.id !== id);
}

/** Shallow-merges `changes` into the items whose id is in the map. */
export function patchById<T extends Identifiable>(items: readonly T[], changes: ReadonlyMap<string, Partial<T>>): T[] {
  return items.map((item: T) => {
    const patch: Partial<T> | undefined = changes.get(item.id);
    return patch ? { ...item, ...patch } : item;
  });
}

/**
 * Puts back earlier versions of some items: replaces the ones still present
 * and re-appends the ones that were removed. Used to roll back optimistic updates.
 */
export function restoreById<T extends Identifiable>(items: readonly T[], previous: readonly T[]): T[] {
  const byId: Map<string, T> = new Map<string, T>(previous.map((item: T) => [item.id, item]));
  const restored: T[] = items.map((item: T) => byId.get(item.id) ?? item);
  const missing: T[] = previous.filter((p: T) => !items.some((item: T) => item.id === p.id));
  return [...restored, ...missing];
}

export function tempId(): string {
  return `tmp-${crypto.randomUUID()}`;
}
