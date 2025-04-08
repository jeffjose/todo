import { describe, it, expect, beforeEach } from 'vitest';
import { getTodosForWeek } from './taskFilters';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './taskLogic';

describe('Task Filtering', () => {
  // Helper to create a basic todo
  function createTodo(overrides: Partial<Todo> = {}): Todo {
    return {
      id: 'test-id',
      title: 'Test Task',
      status: 'pending',
      deadline: null,
      finishBy: null,
      todo: null,
      completed: null,
      description: null,
      emoji: null,
      priority: 'P1',
      urgency: 'medium',
      tags: [],
      attachments: [],
      urls: [],
      comments: [],
      subtasks: [],
      path: 'root.test-id',
      level: 0,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  // Helper to create a week event
  function createWeekEvent(startDate: Date, endDate: Date): WeekEvent {
    return {
      id: `week-${startDate.toISOString()}`,
      startDate,
      endDate,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  describe('Tasks with both finishBy and todo dates', () => {
    const baseDate = new Date('2025-04-01T00:00:00Z');
    let currentWeek: WeekEvent;
    let todoWeek: WeekEvent;
    let finishByWeek: WeekEvent;
    let task: Todo;

    beforeEach(() => {
      // Mock current date to April 1, 2025
      vi.setSystemTime(baseDate);

      // Week containing todo date (April 7-13)
      todoWeek = createWeekEvent(
        new Date('2025-04-07T00:00:00Z'),
        new Date('2025-04-13T23:59:59Z')
      );

      // Week containing finishBy date (April 14-20)
      finishByWeek = createWeekEvent(
        new Date('2025-04-14T00:00:00Z'),
        new Date('2025-04-20T23:59:59Z')
      );

      // Current week (April 1-6)
      currentWeek = createWeekEvent(
        new Date('2025-04-01T00:00:00Z'),
        new Date('2025-04-06T23:59:59Z')
      );

      // Task with both finishBy and todo dates
      task = createTodo({
        id: 'test-metrics',
        title: 'XBR metrics',
        status: 'pending',
        finishBy: new Date('2025-04-15T17:00:00Z'),  // In finishBy week
        todo: new Date('2025-04-07T17:00:00Z'),      // In todo week
        deadline: new Date('2025-04-25T17:00:00Z')   // Future date
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('When task is pending', () => {
      it('should show in todo week for todo column', () => {
        const result = getTodosForWeek([task], todoWeek, 'todo');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('test-metrics');
      });

      it('should show in finishBy week for finishBy column', () => {
        const result = getTodosForWeek([task], finishByWeek, 'finishBy');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('test-metrics');
      });

      it('should not show in current week for finishBy column', () => {
        const result = getTodosForWeek([task], currentWeek, 'finishBy');
        expect(result).toHaveLength(0);
      });
    });

    describe('When task is completed', () => {
      beforeEach(() => {
        task.status = 'completed';
        task.completed = new Date('2025-04-03T17:00:00Z'); // Completed in current week
      });

      it('should show only in finishBy week for finishBy column', () => {
        // Should show in finishBy week
        const finishByResult = getTodosForWeek([task], finishByWeek, 'finishBy');
        expect(finishByResult).toHaveLength(1);
        expect(finishByResult[0].id).toBe('test-metrics');

        // Should not show in todo week
        const todoWeekResult = getTodosForWeek([task], todoWeek, 'finishBy');
        expect(todoWeekResult).toHaveLength(0);

        // Should not show in current week
        const currentWeekResult = getTodosForWeek([task], currentWeek, 'finishBy');
        expect(currentWeekResult).toHaveLength(0);
      });

      it('should not show in todo column after completion', () => {
        const result = getTodosForWeek([task], todoWeek, 'todo');
        expect(result).toHaveLength(0);
      });
    });

    describe('When task is overdue', () => {
      beforeEach(() => {
        // Move current date to April 16 (after finishBy date)
        vi.setSystemTime(new Date('2025-04-16T00:00:00Z'));
      });

      it('should show in current week when overdue and not completed', () => {
        const newCurrentWeek = createWeekEvent(
          new Date('2025-04-14T00:00:00Z'),
          new Date('2025-04-20T23:59:59Z')
        );
        const result = getTodosForWeek([task], newCurrentWeek, 'finishBy');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('test-metrics');
      });

      it('should not show in current week when overdue but completed', () => {
        task.status = 'completed';
        task.completed = new Date('2025-04-16T17:00:00Z');
        
        const newCurrentWeek = createWeekEvent(
          new Date('2025-04-14T00:00:00Z'),
          new Date('2025-04-20T23:59:59Z')
        );
        const result = getTodosForWeek([task], newCurrentWeek, 'finishBy');
        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('test-metrics');
      });
    });
  });
}); 
