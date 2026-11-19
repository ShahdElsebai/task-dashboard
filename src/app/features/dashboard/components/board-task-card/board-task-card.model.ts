export type DueTone = 'overdue' | 'soon' | 'normal' | 'done';

export interface DueLabel {
  key: string;
  params: { count: number };
  tone: DueTone;
  icon: string;
}

export type ReorderStep = -1 | 1;
