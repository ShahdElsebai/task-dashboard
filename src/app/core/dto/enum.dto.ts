export enum TaskStatus {
  Todo = 'todo',
  InProgress = 'in_progress',
  Done = 'done',
}

export enum TaskPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum ActivityType {
  Created = 'created',
  Updated = 'updated',
  StatusChanged = 'status_changed',
  Completed = 'completed',
  Deleted = 'deleted',
}

export enum ChangeType {
  Positive = 'positive',
  Negative = 'negative',
  Neutral = 'neutral',
}
