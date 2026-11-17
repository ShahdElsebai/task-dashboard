import { Identifiable } from '../dto/shared.dto';
import { TaskDto } from '../dto/task.dto';

// Keep in sync with mock-api/build-db.cjs.
export const POSITION_GAP: number = 1000;

export interface PositionUpdate {
  id: string;
  position: number;
}

type Sortable = Pick<TaskDto, 'id' | 'position'>;
type Positioned = Pick<TaskDto, 'position'>;

export function positionBetween(before: number | null, after: number | null): number | null {
  if (after === null) return (before ?? 0) + POSITION_GAP;

  const low: number = before ?? 0;
  const mid: number = Math.floor((low + after) / 2);
  return mid > low && mid < after ? mid : null;
}

export function rebalance(items: readonly Identifiable[]): PositionUpdate[] {
  return items.map((item: Identifiable, index: number) => ({ id: item.id, position: (index + 1) * POSITION_GAP }));
}

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

export function positionAfterLast(items: readonly Positioned[]): number {
  const last: number = items.reduce((max: number, item: Positioned) => Math.max(max, item.position), 0);
  return last + POSITION_GAP;
}

export function byPosition<T extends Positioned>(items: readonly T[]): T[] {
  return [...items].sort((a: T, b: T) => a.position - b.position);
}

// Drops before the visible item at visibleIndex (or after the last one), so hidden items keep their order.
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
