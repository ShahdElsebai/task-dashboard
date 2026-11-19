#!/usr/bin/env node

/**
 * Builds db.json for json-server from the output of generate-data.cjs.
 *
 * - tasks: the generated tasks, with `isOverdue` computed for every task
 *   (the generator only sets it on a few) and missing optional fields filled.
 * - statistics: the generated statistics (the app derives live numbers
 *   from tasks too; this endpoint is kept to match the provided API).
 * - users: unique assignees, used by the assignee filter and the Team page.
 * - activities: a seed activity feed built from task timestamps.
 *
 * Board columns are fixed (one per status). Each task gets a `position` inside
 * its column, in gaps of 1000 (1000, 2000, 3000, …), so moving a task only
 * updates that task: its new position is the midpoint between its new
 * neighbours. See positionBetween / planMove in src/app/features/dashboard/dashboard.utils.ts.
 */

const fs = require('fs');
const path = require('path');

const read = file => JSON.parse(fs.readFileSync(path.join(__dirname, file), 'utf8'));

/** True when the due date is before today (date-only) and the task is not done. */
function isOverdue(task) {
  if (task.status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

/** Gap between neighbouring positions. Keep in sync with POSITION_GAP in the app. */
const POSITION_GAP = 1000;

function main() {
  const { tasks: rawTasks } = read('tasks.json');
  const { statistics } = read('statistics.json');

  // Order inside each status column: by due date, then id; then assign 1000, 2000, 3000, …
  const sorted = [...rawTasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id.localeCompare(b.id));
  const nextPosition = new Map();
  const tasks = sorted.map(task => {
    const position = (nextPosition.get(task.status) ?? 0) + POSITION_GAP;
    nextPosition.set(task.status, position);
    return {
      ...task,
      isOverdue: isOverdue(task),
      completedAt: task.completedAt ?? null,
      position,
    };
  });

  const users = [...new Map(tasks.map(t => [t.assignee.id, t.assignee])).values()];

  const activities = tasks
    .flatMap(t => {
      const items = [
        {
          type: 'created',
          taskId: t.id,
          taskTitle: t.title,
          user: t.assignee,
          timestamp: t.createdAt,
        },
      ];
      if (t.completedAt) {
        items.push({
          type: 'completed',
          taskId: t.id,
          taskTitle: t.title,
          user: t.assignee,
          timestamp: t.completedAt,
        });
      } else if (t.updatedAt !== t.createdAt) {
        items.push({
          type: 'updated',
          taskId: t.id,
          taskTitle: t.title,
          user: t.assignee,
          timestamp: t.updatedAt,
        });
      }
      return items;
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 20)
    .map((activity, i) => ({ id: `activity-${String(i + 1).padStart(3, '0')}`, ...activity }));

  const db = { tasks, statistics, users, activities };
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2) + '\n', 'utf8');
  console.log(`Built db.json: ${tasks.length} tasks, ${users.length} users, ${activities.length} activities`);
}

main();
