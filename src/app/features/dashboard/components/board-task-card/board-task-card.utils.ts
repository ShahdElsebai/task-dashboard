import { TaskDto, TaskStatus } from '@core/dto';
import { daysBetween, parseDateOnly } from '@core/utils';

import { DUE_SOON_DAYS } from './board-task-card.config';
import { DueLabel, DueTone } from './board-task-card.model';

export function dueLabel(
  task: Pick<TaskDto, 'status' | 'dueDate' | 'completedAt'>,
  today: Date = new Date()
): DueLabel {
  if (task.status === TaskStatus.Done) return completedLabel(task.completedAt ?? null, today);

  const days: number = daysBetween(today, parseDateOnly(task.dueDate));
  if (days < 0) {
    const count: number = -days;
    return {
      key: count === 1 ? 'due.overdueOne' : 'due.overdueMany',
      params: { count },
      tone: 'overdue',
      icon: 'pi pi-exclamation-triangle',
    };
  }
  const tone: DueTone = days <= DUE_SOON_DAYS ? 'soon' : 'normal';
  const key: string = days === 0 ? 'due.today' : days === 1 ? 'due.tomorrow' : 'due.inDays';
  return { key, params: { count: days }, tone, icon: 'pi pi-calendar' };
}

function completedLabel(completedAt: string | null, today: Date): DueLabel {
  const base: Omit<DueLabel, 'key' | 'params'> = { tone: 'done', icon: 'pi pi-check-circle' };
  if (!completedAt) return { ...base, key: 'due.completed', params: { count: 0 } };

  const daysAgo: number = Math.max(0, daysBetween(new Date(completedAt), today));
  if (daysAgo === 0) return { ...base, key: 'due.completedToday', params: { count: 0 } };
  if (daysAgo === 1) return { ...base, key: 'due.completedYesterday', params: { count: 1 } };
  return { ...base, key: 'due.completedDaysAgo', params: { count: daysAgo } };
}
