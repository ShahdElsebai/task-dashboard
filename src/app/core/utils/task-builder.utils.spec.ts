import { TaskPriority, TaskStatus } from '../dto/enum.dto';
import { TaskDto } from '../dto/task.dto';
import { UserDto } from '../dto/user.dto';
import { EMPTY_FILTERS } from '../models/task-filters.model';
import {
  buildCreateTaskDto,
  buildUpdateTaskDto,
  computeStats,
  filterTasks,
  hasActiveFilters,
  planTaskMove,
} from './task-builder.utils';

const user: UserDto = { id: 'u1', name: 'John', avatar: 'JD', email: 'j@x.com' };
const other: UserDto = { id: 'u2', name: 'Sara', avatar: 'SS', email: 's@x.com' };
const now: string = '2026-11-17T10:00:00.000Z';

const task = (id: string, status: TaskStatus, position: number, extra: Partial<TaskDto> = {}): TaskDto => ({
  id,
  title: id,
  description: '',
  status,
  priority: TaskPriority.Medium,
  dueDate: '2099-01-01',
  completedAt: null,
  assignee: user,
  position,
  tags: [],
  createdAt: now,
  updatedAt: now,
  ...extra,
});

describe('task builders', () => {
  it('buildCreateTaskDto trims text and tags and stamps dates', () => {
    const dto = buildCreateTaskDto(
      {
        title: ' A ',
        description: ' d ',
        status: TaskStatus.Done,
        priority: TaskPriority.Low,
        dueDate: '2099-01-01',
        assigneeId: 'u1',
        tags: [' x ', ''],
      },
      user,
      3000,
      now
    );
    expect(dto).toMatchObject({ title: 'A', description: 'd', tags: ['x'], position: 3000, completedAt: now });
    expect(dto.createdAt).toBe(now);
  });

  describe('buildUpdateTaskDto', () => {
    const current: TaskDto = task('t', TaskStatus.Todo, 1000);
    const endPosition = (): number => 5000;

    it('includes only changed fields plus updatedAt', () => {
      expect(buildUpdateTaskDto(current, { priority: TaskPriority.High }, { endPosition, now })).toEqual({
        priority: 'high',
        updatedAt: now,
      });
    });

    it('a status change sets completedAt and moves to the end of the new column', () => {
      expect(buildUpdateTaskDto(current, { status: TaskStatus.Done }, { endPosition, now })).toMatchObject({
        status: 'done',
        completedAt: now,
        position: 5000,
      });
    });

    it('ignores an unchanged status and assignee', () => {
      const dto = buildUpdateTaskDto(current, { status: TaskStatus.Todo }, { assignee: user, endPosition, now });
      expect(dto).toEqual({ updatedAt: now });
    });

    it('sets a new assignee', () => {
      expect(buildUpdateTaskDto(current, {}, { assignee: other, endPosition, now }).assignee).toBe(other);
    });
  });

  it('planTaskMove puts status and completedAt only on the moved task', () => {
    const moved: TaskDto = task('m', TaskStatus.Todo, 1000);
    const column: TaskDto[] = [task('a', TaskStatus.Done, 1000), task('b', TaskStatus.Done, 1001)];
    expect(planTaskMove(moved, column, TaskStatus.Done, 1, now)).toEqual([
      { id: 'm', changes: { position: 2000, status: 'done', completedAt: now, updatedAt: now } },
      { id: 'b', changes: { position: 3000 } },
    ]);
  });

  it('filterTasks and hasActiveFilters', () => {
    const tasks: TaskDto[] = [task('a', TaskStatus.Todo, 1), task('b', TaskStatus.Done, 1, { assignee: other })];
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, assigneeId: 'u2' }).map((t: TaskDto) => t.id)).toEqual(['b']);
    expect(filterTasks(tasks, { ...EMPTY_FILTERS, status: TaskStatus.Todo }).map((t: TaskDto) => t.id)).toEqual(['a']);
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: ' ' })).toBe(false);
  });

  it('computeStats counts by status and overdue', () => {
    const stats = computeStats(
      [
        task('a', TaskStatus.Todo, 1, { dueDate: '2000-01-01' }),
        task('b', TaskStatus.InProgress, 1),
        task('c', TaskStatus.Done, 1, { dueDate: '2000-01-01' }),
      ],
      new Date(2026, 10, 17)
    );
    expect(stats).toEqual({ total: 3, todo: 1, inProgress: 1, completed: 1, overdue: 1 });
  });
});
