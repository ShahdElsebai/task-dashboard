export type DueTone = 'overdue' | 'soon' | 'normal' | 'done';

export interface DueLabel {
  key: string;
  params: { count: number };
  tone: DueTone;
  icon: string;
}

/** -1 moves the card up one place in its column, 1 moves it down. */
export type ReorderStep = -1 | 1;
