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
 * - comments: seed comment threads on most tasks (see COMMENT_SCRIPT), timed relative to when
 *   this script runs so they show as recent.
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

/** The signed-in user in the app (CURRENT_USER in src/app/core/config/user.config.ts). */
const CURRENT_USER_ID = 'user-001';

/**
 * Seed comment threads: [author id, body, mentioned ids, hours ago] per comment, oldest first.
 * `open` threads go on the open tasks in board order, `done` threads on finished ones. Times
 * range from minutes to weeks, and four comments by others mention the signed-in user, so the
 * notifications bell has unread items on a fresh start.
 */
const J = CURRENT_USER_ID;
const S = 'user-002';
const M = 'user-003';
const E = 'user-004';
const COMMENT_SCRIPT = {
  open: [
    [
      [S, '@John Doe can you review this before Friday?', [J], 5],
      [J, 'Sure, I will look at it this afternoon.', [], 4],
    ],
    [
      [M, 'Started on this. @Emily Davis can you share the latest numbers?', [E], 30],
      [E, 'Shared them in the team folder. @John Doe can you check the totals?', [J], 2],
    ],
    [[E, 'I added the test cases to the description.', [], 72]],
    [
      [J, '@Mike Johnson this one is yours now, ping me if you get stuck.', [M], 96],
      [M, 'Thanks, I will start tomorrow morning.', [], 90],
      [M, 'Halfway there. @Sarah Smith I will need a quick design review.', [S], 20],
    ],
    [
      [S, 'Blocked until the client confirms the scope.', [], 48],
      [J, '@Sarah Smith I will chase them today.', [S], 46],
    ],
    [[M, '@John Doe quick question: should this ship behind a feature flag?', [J], 0.5]],
    [
      [E, 'Updated the estimate to two days.', [], 150],
      [S, 'Works for me.', [], 149],
    ],
    [
      [J, "Let's pair on this one, @Emily Davis.", [E], 10],
      [E, 'Sounds good, I booked 30 minutes for tomorrow.', [], 9],
    ],
    [[S, 'Draft is ready for review. @Mike Johnson @John Doe', [M, J], 26]],
  ],
  done: [
    [[M, 'Merged and deployed. Thanks everyone!', [], 60]],
    [[J, 'Great work on this, @Sarah Smith.', [S], 100]],
    [[E, 'Closing this, the fix is verified on staging.', [], 200]],
  ],
};

function buildComments(tasks, users) {
  const byId = new Map(users.map(u => [u.id, u]));
  const now = Date.now();
  const place = (threads, candidates) =>
    threads.flatMap((thread, i) => {
      const task = candidates[i];
      if (!task) return [];
      return thread
        .filter(([authorId]) => byId.has(authorId))
        .map(([authorId, body, mentions, hoursAgo]) => ({
          taskId: task.id,
          taskTitle: task.title,
          author: byId.get(authorId),
          body,
          mentions: mentions.filter(id => byId.has(id)),
          createdAt: new Date(now - hoursAgo * 3600 * 1000).toISOString(),
        }));
    });

  return [
    ...place(
      COMMENT_SCRIPT.open,
      tasks.filter(t => t.status !== 'done')
    ),
    ...place(
      COMMENT_SCRIPT.done,
      tasks.filter(t => t.status === 'done')
    ),
  ]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((comment, i) => ({ id: `comment-${String(i + 1).padStart(3, '0')}`, ...comment }));
}

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

  const comments = buildComments(tasks, users);

  const db = { tasks, statistics, users, activities, comments };
  fs.writeFileSync(path.join(__dirname, 'db.json'), JSON.stringify(db, null, 2) + '\n', 'utf8');
  console.log(
    `Built db.json: ${tasks.length} tasks, ${users.length} users, ${activities.length} activities, ` +
      `${comments.length} comments`
  );
}

main();
