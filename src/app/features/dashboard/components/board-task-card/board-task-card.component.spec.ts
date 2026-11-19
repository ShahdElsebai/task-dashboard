import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { MenuItem } from '@openng/optimus-ui/api';

import { TaskStatus, TaskDto } from '../../../../core/dto';
import { makeTask } from '../../services/dashboard.test-helpers';
import { BoardTaskCardComponent } from './board-task-card.component';

describe('BoardTaskCardComponent', () => {
  let fixture: ComponentFixture<BoardTaskCardComponent>;
  let host: HTMLElement;

  async function render(task: TaskDto): Promise<void> {
    fixture.componentRef.setInput('task', task);
    fixture.componentRef.setInput('labels', {
      'tasks.edit': 'Edit',
      'tasks.delete': 'Delete',
      'tasks.moveTo': 'Move to',
      'board.columns.todo': 'To Do',
      'board.columns.inProgress': 'In Progress',
      'board.columns.done': 'Done',
    });
    await fixture.whenStable();
  }

  const menu = (): MenuItem[] => (fixture.componentInstance as unknown as { menuItems: () => MenuItem[] }).menuItems();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardTaskCardComponent],
      providers: [provideTranslateService()],
    }).compileComponents();
    fixture = TestBed.createComponent(BoardTaskCardComponent);
    host = fixture.nativeElement as HTMLElement;
  });

  it('renders title, description, tags and assignee', async () => {
    await render(makeTask('a', TaskStatus.Todo, 1000, { description: 'Details', tags: ['UI', 'Design'] }));
    expect(host.querySelector('h4')?.textContent).toBe('Task a');
    expect(host.textContent).toContain('Details');
    expect(host.textContent).toContain('UI');
    expect(host.textContent).toContain('@John');
  });

  it('highlights overdue tasks and shows the overdue label', async () => {
    await render(makeTask('a', TaskStatus.Todo, 1000, { dueDate: '2000-01-01' }));
    expect(host.querySelector('article')?.classList).toContain('!bg-status-overdue-bg');
    expect(host.textContent).toContain('due.overdueMany');
  });

  it('does not highlight done tasks even when past due', async () => {
    await render(makeTask('a', TaskStatus.Done, 1000, { dueDate: '2000-01-01' }));
    expect(host.querySelector('article')?.classList).not.toContain('!bg-status-overdue-bg');
  });

  it('menu offers edit and delete only', async () => {
    await render(makeTask('a', TaskStatus.Todo, 1000));
    expect(menu().map((i: MenuItem) => i.label ?? '---')).toEqual(['Edit', '---', 'Delete']);
  });

  it('menu commands emit the matching outputs', async () => {
    const task: TaskDto = makeTask('a', TaskStatus.Todo, 1000);
    await render(task);
    const events: string[] = [];
    fixture.componentInstance.edit.subscribe(() => events.push('edit'));
    fixture.componentInstance.remove.subscribe(() => events.push('remove'));

    menu().forEach((item: MenuItem) => item.command?.({ item } as never));
    expect(events).toEqual(['edit', 'remove']);
  });
});
