import { TaskDto, TaskStatus, UserDto } from '@core/dto';
import { isTaskOverdue } from '@core/utils';

import { TeamMember } from './team.model';

/**
 * Each user's workload: open, completed and overdue tasks and completion rate.
 *
 * @param users Everyone who can be assigned tasks; users without tasks are kept with zeros.
 * @param tasks All tasks.
 * @param today The date overdue is measured against; injectable for tests.
 * @return One entry per user, busiest (most open tasks) first, then by name.
 */
export function toTeamMembers(
  users: readonly UserDto[],
  tasks: readonly TaskDto[],
  today: Date = new Date()
): TeamMember[] {
  return users
    .map((user: UserDto): TeamMember => {
      const mine: TaskDto[] = tasks.filter((t: TaskDto) => t.assignee.id === user.id);
      const completed: number = mine.filter((t: TaskDto) => t.status === TaskStatus.Done).length;
      return {
        user,
        total: mine.length,
        open: mine.length - completed,
        completed,
        overdue: mine.filter((t: TaskDto) => isTaskOverdue(t, today)).length,
        completionRate: mine.length ? Math.round((completed / mine.length) * 100) : 0,
      };
    })
    .sort((a: TeamMember, b: TeamMember) => b.open - a.open || a.user.name.localeCompare(b.user.name));
}
