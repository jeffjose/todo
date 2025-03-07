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

describe('WeeklyView Status Tests', () => {
  const today = new Date('2025-03-07T00:00:00.000Z');
  const currentWeekStart = new Date('2025-03-03T00:00:00.000Z');
  const weekEvent = createWeekEvent(currentWeekStart);

  describe('Task Status Transitions', () => {
    it('should handle transition from pending to in-progress', () => {
      const task = createTodo({
        id: 'task1',
        title: 'Task 1',
        status: 'in-progress',
        path: 'root',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [task], today);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('in-progress');
    });

    it('should handle tasks blocked by dependencies', () => {
      const tasks = [
        createTodo({
          id: 'task1',
          title: 'Task 1',
          status: 'blocked',
          path: 'root',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'task2',
          title: 'Task 2',
          status: 'pending',
          path: 'root',
          todo: new Date('2025-03-06T00:00:00.000Z')
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, today);
      expect(result).toHaveLength(2);
      expect(result.find(t => t.id === 'task1')?.status).toBe('blocked');
    });

    it('should handle tasks with multiple status changes', () => {
      const tasks = [
        createTodo({
          id: 'task1',
          title: 'Task 1',
          status: 'completed',
          path: 'root',
          todo: new Date('2025-03-04T00:00:00.000Z')
        }),
        createTodo({
          id: 'task2',
          title: 'Task 2',
          status: 'in-progress',
          path: 'root',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'task3',
          title: 'Task 3',
          status: 'blocked',
          path: 'root',
          todo: new Date('2025-03-06T00:00:00.000Z')
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, today);
      expect(result).toHaveLength(3);
      expect(result.map(t => t.status)).toEqual(['completed', 'in-progress', 'blocked']);
    });
  });

  describe('Task Prioritization', () => {
    it('should handle tasks with different priority levels', () => {
      const tasks = [
        createTodo({
          id: 'task1',
          title: 'High Priority',
          status: 'pending',
          priority: 'P0',
          path: 'root',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'task2',
          title: 'Low Priority',
          status: 'pending',
          priority: 'P3',
          path: 'root',
          todo: new Date('2025-03-05T00:00:00.000Z')
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, today);
      expect(result).toHaveLength(2);
      expect(result[0].priority).toBe('P0');
      expect(result[1].priority).toBe('P3');
    });

    it('should handle tasks with different urgency levels', () => {
      const tasks = [
        createTodo({
          id: 'task1',
          title: 'High Urgency',
          status: 'pending',
          urgency: 'high',
          path: 'root',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'task2',
          title: 'Low Urgency',
          status: 'pending',
          urgency: 'low',
          path: 'root',
          todo: new Date('2025-03-05T00:00:00.000Z')
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, today);
      expect(result).toHaveLength(2);
      expect(result[0].urgency).toBe('high');
      expect(result[1].urgency).toBe('low');
    });
  });
});
