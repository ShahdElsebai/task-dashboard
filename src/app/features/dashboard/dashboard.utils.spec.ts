import { TaskPriority, TaskStatus, TaskDto, UserDto } from '../../core/dto';
import { EMPTY_FILTERS } from './dashboard.config';
import {
  buildCreateTaskDto,
  buildUpdateTaskDto,
  byPosition,
  completedAtFor,
  computeStats,
  filterTasks,
  hasActiveFilters,
  isTaskOverdue,
  matchesSearch,
  planMove,
  planTaskMove,
  positionAfterLast,
  positionBetween,
  rebalance,
  toFullIndex,
} from './dashboard.utils';
import { POSITION_GAP } from './dashboard.config';

describe('board utils: task rules', () => {
  describe('isTaskOverdue', () => {
    const today = new Date(2026, 10, 16, 15, 0);

    it('is true when due before today and not done', () => {
      expect(isTaskOverdue({ status: TaskStatus.Todo, dueDate: '2026-11-15' }, today)).toBe(true);
    });

    it('is false when due today', () => {
      expect(isTaskOverdue({ status: TaskStatus.InProgress, dueDate: '2026-11-16' }, today)).toBe(false);
    });

    it('is false for done tasks even if past due', () => {
      expect(isTaskOverdue({ status: TaskStatus.Done, dueDate: '2026-11-01' }, today)).toBe(false);
    });
  });

  describe('completedAtFor', () => {
    const now: string = '2026-11-17T10:00:00.000Z';

    it('stamps when moving to done', () => {
      expect(completedAtFor({ status: TaskStatus.Todo, completedAt: null }, TaskStatus.Done, now)).toBe(now);
    });

    it('clears when leaving done', () => {
      expect(completedAtFor({ status: TaskStatus.Done, completedAt: 'x' }, TaskStatus.InProgress, now)).toBeNull();
    });

    it('keeps the value when the status does not change', () => {
      expect(completedAtFor({ status: TaskStatus.Done, completedAt: 'x' }, TaskStatus.Done, now)).toBe('x');
    });
  });

  describe('matchesSearch', () => {
    const task: { title: string; description: string; tags: string[] } = {
      title: 'Design homepage',
      description: 'Wireframes',
      tags: ['UI'],
    };

    it('matches title, description and tags, ignoring case and spaces', () => {
      expect(matchesSearch(task, ' design ')).toBe(true);
      expect(matchesSearch(task, 'WIRE')).toBe(true);
      expect(matchesSearch(task, 'ui')).toBe(true);
      expect(matchesSearch(task, '')).toBe(true);
      expect(matchesSearch(task, 'backend')).toBe(false);
    });
  });
});

describe('board utils: positions', () => {
  const list = (...positions: number[]): { id: string; position: number }[] =>
    positions.map((position: number, i: number) => ({ id: `item-${i + 1}`, position }));

  describe('position utils', () => {
    describe('positionBetween', () => {
      it('starts an empty list at the gap', () => {
        expect(positionBetween(null, null)).toBe(POSITION_GAP);
      });

      it('appends one gap after the last item', () => {
        expect(positionBetween(3000, null)).toBe(4000);
      });

      it('halves the first position when dropped at the start', () => {
        expect(positionBetween(null, 1000)).toBe(500);
      });

      it('returns the midpoint between neighbours', () => {
        expect(positionBetween(1000, 2000)).toBe(1500);
        expect(positionBetween(1000, 1500)).toBe(1250);
      });

      it('returns null when no integer is left between neighbours', () => {
        expect(positionBetween(1000, 1001)).toBeNull();
        expect(positionBetween(null, 1)).toBeNull();
      });
    });

    describe('planMove', () => {
      it('updates only the moved item when there is room', () => {
        expect(planMove(list(1000, 2000, 3000), 'item-3', 1)).toEqual([{ id: 'item-3', position: 1500 }]);
      });

      it('moves to the end of another list', () => {
        expect(planMove(list(1000, 2000), 'new', 2)).toEqual([{ id: 'new', position: 3000 }]);
      });

      it('moves into an empty list', () => {
        expect(planMove([], 'new', 0)).toEqual([{ id: 'new', position: 1000 }]);
      });

      it('clamps an out-of-range index to the end', () => {
        expect(planMove(list(1000), 'new', 99)).toEqual([{ id: 'new', position: 2000 }]);
      });

      it('rebalances only when the gap is used up, sending just the changed items', () => {
        const siblings: { id: string; position: number }[] = [
          { id: 'a', position: 1000 },
          { id: 'b', position: 1001 },
          { id: 'c', position: 3000 },
        ];
        expect(planMove(siblings, 'new', 1)).toEqual([
          { id: 'new', position: 2000 },
          { id: 'b', position: 3000 },
          { id: 'c', position: 4000 },
        ]);
      });

      it('needs ~10 repeated drops in the same slot before a rebalance', () => {
        let items: { id: string; position: number }[] = list(1000, 2000);
        let singleUpdates: number = 0;
        for (let i: number = 0; i < 20; i++) {
          const updates: { id: string; position: number }[] = planMove(items, `n${i}`, 1);
          if (updates.length > 1) break;
          singleUpdates++;
          items = byPosition([...items, ...updates]);
        }
        expect(singleUpdates).toBeGreaterThanOrEqual(9);
      });
    });

    it('rebalance spreads items 1000 apart', () => {
      expect(rebalance([{ id: 'x' }, { id: 'y' }])).toEqual([
        { id: 'x', position: 1000 },
        { id: 'y', position: 2000 },
      ]);
    });

    it('positionAfterLast appends after the highest position', () => {
      expect(positionAfterLast(list(1000, 5000, 2000))).toBe(6000);
      expect(positionAfterLast([])).toBe(1000);
    });

    it('byPosition sorts without mutating', () => {
      const input: { id: string; position: number }[] = list(3000, 1000);
      expect(byPosition(input).map((i: { position: number }) => i.position)).toEqual([1000, 3000]);
      expect(input[0].position).toBe(3000);
    });
  });

  describe('toFullIndex', () => {
    const full: { id: string }[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
    const visible: { id: string }[] = [{ id: 'b' }, { id: 'd' }];

    it('drops before the visible item at that index', () => {
      expect(toFullIndex(full, visible, 0)).toBe(1);
      expect(toFullIndex(full, visible, 1)).toBe(3);
    });

    it('drops after the last visible item at the end', () => {
      expect(toFullIndex(full, visible, 2)).toBe(4);
    });

    it('appends when nothing is visible', () => {
      expect(toFullIndex(full, [], 0)).toBe(4);
    });
  });
});

describe('board utils: request builders', () => {
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
      expect(filterTasks(tasks, { ...EMPTY_FILTERS, status: TaskStatus.Todo }).map((t: TaskDto) => t.id)).toEqual([
        'a',
      ]);
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
});
