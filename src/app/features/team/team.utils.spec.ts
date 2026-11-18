import { TaskStatus, UserDto } from '../../core/dto';
import { TEST_USER, makeTask } from '../dashboard/services/dashboard.test-helpers';
import { TeamMember } from './team.model';
import { toTeamMembers } from './team.utils';

describe('toTeamMembers', () => {
  const amy: UserDto = { ...TEST_USER, id: 'amy', name: 'Amy' };
  const bob: UserDto = { ...TEST_USER, id: 'bob', name: 'Bob' };
  const idle: UserDto = { ...TEST_USER, id: 'zed', name: 'Zed' };
  const today: Date = new Date(2026, 10, 18);

  const tasks = [
    makeTask('1', TaskStatus.Todo, 1000, { assignee: bob, dueDate: '2026-11-01' }),
    makeTask('2', TaskStatus.InProgress, 1000, { assignee: bob }),
    makeTask('3', TaskStatus.Done, 1000, { assignee: bob, dueDate: '2026-11-01' }),
    makeTask('4', TaskStatus.Done, 2000, { assignee: amy }),
  ];

  it('counts open, completed and overdue tasks per user', () => {
    const bobRow: TeamMember | undefined = toTeamMembers([amy, bob], tasks, today).find(
      (m: TeamMember) => m.user.id === 'bob'
    );
    expect(bobRow).toMatchObject({ total: 3, open: 2, completed: 1, overdue: 1, completionRate: 33 });
  });

  it('keeps users without tasks', () => {
    const zed: TeamMember | undefined = toTeamMembers([idle], tasks, today)[0];
    expect(zed).toMatchObject({ total: 0, open: 0, completionRate: 0 });
  });

  it('lists the busiest first, then by name', () => {
    expect(toTeamMembers([idle, amy, bob], tasks, today).map((m: TeamMember) => m.user.name)).toEqual([
      'Bob',
      'Amy',
      'Zed',
    ]);
  });
});
