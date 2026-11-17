import type { Identifiable } from '../dto/shared.dto';
import type { TaskDto } from '../dto/task.dto';

/** Gap between neighbouring positions. Keep in sync with `mock-api/build-db.cjs`. */
export const POSITION_GAP: number = 1000;

/** A position change to send to the API. */
export interface PositionUpdate {
  id: string;
  position: number;
}

type Sortable = Pick<TaskDto, 'id' | 'position'>;
type Positioned = Pick<TaskDto, 'position'>;

/**
 * Returns an integer position strictly between two neighbours, or `null`
 * when there is no integer left between them (time to rebalance).
 *
 * - no neighbours  → 1000 (0 + gap)
 * - only `before`  → before + 1000 (dropped at the end)
 * - only `after`   → after / 2     (dropped at the start)
 * - both           → midpoint
 *
 * Each halving uses up the gap, so roughly 10 moves into the same slot
 * (1000 → 500 → 250 …) are possible before a rebalance is needed.
 */
export function positionBetween(before: number | null, after: number | null): number | null {
  if (after === null) return (before ?? 0) + POSITION_GAP;

  const low: number = before ?? 0;
  const mid: number = Math.floor((low + after) / 2);
  return mid > low && mid < after ? mid : null;
}

/** Spreads positions evenly again: 1000, 2000, 3000, … in the given order. */
export function rebalance(items: readonly Identifiable[]): PositionUpdate[] {
  return items.map((item: Identifiable, index: number) => ({ id: item.id, position: (index + 1) * POSITION_GAP }));
}

/**
 * Works out which positions must change to move an item to `toIndex`
 * inside `siblings`.
 *
 * Usually returns one update (the moved item). Only when its new neighbours
 * have no gap left does it rebalance the whole list and return an update for
 * every item whose position actually changed.
 *
 * @param siblings Items of the target list, sorted by position. May include the moved item.
 * @param movedId  Id of the item being moved.
 * @param toIndex  Index in the target list after the move (0 = first).
 */
export function planMove(siblings: readonly Sortable[], movedId: string, toIndex: number): PositionUpdate[] {
  const others: Sortable[] = siblings.filter((item: Sortable) => item.id !== movedId);
  const index: number = Math.max(0, Math.min(toIndex, others.length));
  const before: number | null = index > 0 ? others[index - 1].position : null;
  const after: number | null = index < others.length ? others[index].position : null;

  const position: number | null = positionBetween(before, after);
  if (position !== null) return [{ id: movedId, position }];

  const ordered: Identifiable[] = [...others.slice(0, index), { id: movedId }, ...others.slice(index)];
  const current: Map<string, number> = new Map<string, number>(
    siblings.map((item: Sortable) => [item.id, item.position])
  );
  return rebalance(ordered).filter((update: PositionUpdate) => current.get(update.id) !== update.position);
}

/** Next position for an item appended at the end. */
export function positionAfterLast(items: readonly Positioned[]): number {
  const last: number = items.reduce((max: number, item: Positioned) => Math.max(max, item.position), 0);
  return last + POSITION_GAP;
}

/** Sorts by position without mutating the input. */
export function byPosition<T extends Positioned>(items: readonly T[]): T[] {
  return [...items].sort((a: T, b: T) => a.position - b.position);
}

/**
 * Converts a drop index in a filtered view into an index in the full list.
 *
 * When filters hide some tasks, the UI only knows the visible neighbours.
 * We place the item right before the visible item it was dropped on, or
 * right after the last visible item when dropped at the end, so hidden
 * tasks keep their relative order.
 *
 * @param full         All items of the list, sorted, without the moved item.
 * @param visible      The items the user sees, sorted, without the moved item.
 * @param visibleIndex Drop index within `visible`.
 */
export function toFullIndex(
  full: readonly Identifiable[],
  visible: readonly Identifiable[],
  visibleIndex: number
): number {
  if (visible.length === 0) return full.length;
  const ids: string[] = full.map((item: Identifiable) => item.id);
  if (visibleIndex < visible.length) {
    const at: number = ids.indexOf(visible[Math.max(0, visibleIndex)].id);
    return at === -1 ? full.length : at;
  }
  const last: number = ids.indexOf(visible[visible.length - 1].id);
  return last === -1 ? full.length : last + 1;
}
