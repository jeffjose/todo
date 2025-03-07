import { describe, it, expect } from 'vitest';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';
import { getOpenTodosUpToCurrentWeek } from './WeeklyView.utils';

// Helper function to create a WeekEvent
function createWeekEvent(startDate: Date): WeekEvent {
  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);
  endDate.setUTCHours(7, 59, 59, 999);
  return {
    id: `week-${startDate.toISOString()}`,
    startDate,
    endDate,
    description: null,
    createdAt: new Date('2025-03-07T00:00:00.000Z'),
    updatedAt: new Date('2025-03-07T00:00:00.000Z')
  };
}

// Helper function to create a Todo
function createTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'test-todo',
    title: 'Test Todo',
    description: null,
    emoji: null,
    status: 'pending',
    path: 'root',
    level: 0,
    parentId: null,
    priority: 'P2',
    urgency: 'medium',
    tags: [],
    attachments: [],
    comments: [],
    subtasks: [],
    todo: null,
    deadline: null,
    finishBy: null,
    createdAt: new Date('2025-03-07T00:00:00.000Z'),
    updatedAt: new Date('2025-03-07T00:00:00.000Z'),
    ...overrides
  };
}

describe('WeeklyView Sorting and Visualization', () => {
  const today = new Date('2025-03-07T00:00:00.000Z');
  const currentWeekStart = new Date('2025-03-03T00:00:00.000Z');
  const weekEvent = createWeekEvent(currentWeekStart);

  describe('Complex Sorting Scenarios', () => {
    it('should sort tasks by path, status, and date', () => {
      const task1 = createTodo({
        id: 'task1',
        title: 'Task 1',
        status: 'completed',
        path: 'root.a',
        todo: new Date('2025-03-05T10:00:00.000Z')
      });

      const task2 = createTodo({
        id: 'task2',
        title: 'Task 2',
        status: 'pending',
        path: 'root.a',
        todo: new Date('2025-03-05T09:00:00.000Z')
      });

      const task3 = createTodo({
        id: 'task3',
        title: 'Task 3',
        status: 'pending',
        path: 'root.b',
        todo: new Date('2025-03-05T08:00:00.000Z')
      });

      const todos = [task1, task2, task3];
      const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

      expect(result).toHaveLength(3);
      expect(result.map(t => t.id)).toEqual(['task1', 'task2', 'task3']);
    });

    it('should maintain insertion order for tasks with same dates', () => {
      const highPriorityTask = createTodo({
        id: 'high-priority',
        title: 'High Priority Task',
        status: 'pending',
        priority: 'P0',
        todo: new Date('2025-03-05T10:00:00.000Z')
      });

      const lowPriorityTask = createTodo({
        id: 'low-priority',
        title: 'Low Priority Task',
        status: 'pending',
        priority: 'P3',
        todo: new Date('2025-03-05T10:00:00.000Z')
      });

      const todos = [lowPriorityTask, highPriorityTask];
      const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toEqual(['low-priority', 'high-priority']);
    });
  });

  describe('Task Visualization', () => {
    it('should handle tasks with combined status scenarios', () => {
      const tasks = [
        createTodo({
          id: 'parent-completed',
          title: 'Parent Completed',
          status: 'completed',
          path: 'root'
        }),
        createTodo({
          id: 'child-pending',
          title: 'Child Pending',
          status: 'pending',
          parentId: 'parent-completed',
          path: 'root.parent-completed',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'child-blocked',
          title: 'Child Blocked',
          status: 'blocked',
          parentId: 'parent-completed',
          path: 'root.parent-completed',
          todo: new Date('2025-03-06T00:00:00.000Z')
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, today);
      expect(result).toHaveLength(3);
      expect(result.map(t => t.status)).toContain('completed');
      expect(result.map(t => t.status)).toContain('pending');
      expect(result.map(t => t.status)).toContain('blocked');
    });

    it('should handle tasks with missing dates but valid status', () => {
      const tasks = [
        createTodo({
          id: 'no-dates',
          title: 'No Dates Task',
          status: 'in-progress',
          path: 'root'
        }),
        createTodo({
          id: 'partial-dates',
          title: 'Partial Dates Task',
          status: 'pending',
          deadline: new Date('2025-03-05T00:00:00.000Z'),
          path: 'root'
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, today);
      expect(result).toHaveLength(2);
      expect(result.find(t => t.id === 'no-dates')).toBeDefined();
      expect(result.find(t => t.id === 'partial-dates')).toBeDefined();
    });

    it('should maintain correct task order with mixed statuses', () => {
      const tasks = [
        createTodo({
          id: 'task1',
          title: 'First Task',
          status: 'completed',
          path: 'root.a',
          todo: new Date('2025-03-04T00:00:00.000Z')
        }),
        createTodo({
          id: 'task2',
          title: 'Second Task',
          status: 'in-progress',
          path: 'root.a',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'task3',
          title: 'Third Task',
          status: 'pending',
          path: 'root.b',
          todo: new Date('2025-03-06T00:00:00.000Z')
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, today);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('task1'); // Completed tasks first
      expect(result[1].id).toBe('task2'); // Then in-progress
      expect(result[2].id).toBe('task3'); // Then pending
    });
  });
});
