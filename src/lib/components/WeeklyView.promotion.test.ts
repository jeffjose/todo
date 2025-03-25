import { describe, it, expect } from 'vitest';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';
import { getOpenTodosUpToCurrentWeek } from './WeeklyView.utils';

// Fixed date for all tests to ensure deterministic behavior
const TEST_DATE = new Date('2025-03-07T00:00:00.000Z');

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
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE
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
    createdAt: TEST_DATE,
    updatedAt: TEST_DATE,
    ...overrides
  };
}

// Mock getTodosForWeek function since it's internal to WeeklyView.svelte
function getTodosForWeek(weekEvent: WeekEvent, type: 'deadline' | 'finishBy' | 'todo', todos: Todo[]): Todo[] {
  const startDate = new Date(weekEvent.startDate);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(weekEvent.endDate);
  endDate.setHours(23, 59, 59, 999);

  return todos.filter((todo) => {
    const date = type === 'deadline' ? todo.deadline : type === 'finishBy' ? todo.finishBy : todo.todo;
    if (!date) return false;

    // Task promotion logic:
    // - Deadline tasks: Stay in their original week
    // - Finish By tasks:
    //   * Completed tasks stay in their original week
    //   * Open tasks from past weeks are promoted to current week
    if (type === 'finishBy') {
      const today = TEST_DATE;
      const isPastWeek = weekEvent.endDate < today;
      const isCurrentWeek = today >= weekEvent.startDate && today <= weekEvent.endDate;

      if (isPastWeek) {
        return date >= startDate && date <= endDate && todo.status === 'completed';
      }

      if (isCurrentWeek) {
        return (date >= startDate && date <= endDate) || (date < startDate && todo.status !== 'completed');
      }
    }

    return date >= startDate && date <= endDate;
  });
}

describe('WeeklyView Task Promotion Tests', () => {
  // Current week is March 3-9, 2025
  const currentWeekStart = new Date('2025-03-03T00:00:00.000Z');
  const currentWeekEvent = createWeekEvent(currentWeekStart);

  // Previous week is February 24-March 2, 2025
  const previousWeekStart = new Date('2025-02-24T00:00:00.000Z');
  const previousWeekEvent = createWeekEvent(previousWeekStart);

  describe('Deadline Tasks', () => {
    it('should keep deadline tasks in their original week even if overdue', () => {
      const deadlineTask = createTodo({
        id: 'deadline-task',
        title: 'Deadline Task',
        status: 'pending',
        deadline: new Date('2025-02-26T00:00:00.000Z') // Wednesday of previous week
      });

      // Check if task appears in previous week's deadline column
      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'deadline', [deadlineTask]);
      expect(previousWeekTodos).toHaveLength(1);
      expect(previousWeekTodos[0].id).toBe('deadline-task');

      // Check if task does NOT appear in current week's deadline column
      const currentWeekTodos = getTodosForWeek(currentWeekEvent, 'deadline', [deadlineTask]);
      expect(currentWeekTodos).toHaveLength(0);
    });

    it('should show completed deadline tasks in their original week', () => {
      const completedDeadlineTask = createTodo({
        id: 'completed-deadline',
        title: 'Completed Deadline Task',
        status: 'completed',
        deadline: new Date('2025-02-26T00:00:00.000Z') // Wednesday of previous week
      });

      // Check if task appears in previous week's deadline column
      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'deadline', [completedDeadlineTask]);
      expect(previousWeekTodos).toHaveLength(1);
      expect(previousWeekTodos[0].id).toBe('completed-deadline');

      // Check if task does NOT appear in current week's deadline column
      const currentWeekTodos = getTodosForWeek(currentWeekEvent, 'deadline', [completedDeadlineTask]);
      expect(currentWeekTodos).toHaveLength(0);
    });
  });

  describe('FinishBy Tasks', () => {
    it('should promote overdue finishBy tasks to current week', () => {
      const finishByTask = createTodo({
        id: 'finishby-task',
        title: 'FinishBy Task',
        status: 'pending',
        finishBy: new Date('2025-02-26T00:00:00.000Z') // Wednesday of previous week
      });

      // Check if task appears in current week's finishBy column
      const currentWeekTodos = getTodosForWeek(currentWeekEvent, 'finishBy', [finishByTask]);
      expect(currentWeekTodos).toHaveLength(1);
      expect(currentWeekTodos[0].id).toBe('finishby-task');

      // Check if task does NOT appear in previous week's finishBy column
      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'finishBy', [finishByTask]);
      expect(previousWeekTodos).toHaveLength(0);
    });

    it('should keep completed finishBy tasks in their original week', () => {
      const completedFinishByTask = createTodo({
        id: 'completed-finishby',
        title: 'Completed FinishBy Task',
        status: 'completed',
        finishBy: new Date('2025-02-26T00:00:00.000Z') // Wednesday of previous week
      });

      // Check if task appears in previous week's finishBy column
      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'finishBy', [completedFinishByTask]);
      expect(previousWeekTodos).toHaveLength(1);
      expect(previousWeekTodos[0].id).toBe('completed-finishby');

      // Check if task does NOT appear in current week's finishBy column
      const currentWeekTodos = getTodosForWeek(currentWeekEvent, 'finishBy', [completedFinishByTask]);
      expect(currentWeekTodos).toHaveLength(0);
    });
  });

  describe('Mixed Task Types', () => {
    it('should handle mixed deadline and finishBy tasks correctly', () => {
      const tasks = [
        createTodo({
          id: 'overdue-deadline',
          title: 'Overdue Deadline Task',
          status: 'pending',
          deadline: new Date('2025-02-26T00:00:00.000Z') // Previous week
        }),
        createTodo({
          id: 'overdue-finishby',
          title: 'Overdue FinishBy Task',
          status: 'pending',
          finishBy: new Date('2025-02-26T00:00:00.000Z') // Previous week
        })
      ];

      // Check current week - should only see the finishBy task in finishBy column
      const currentWeekFinishBy = getTodosForWeek(currentWeekEvent, 'finishBy', tasks);
      expect(currentWeekFinishBy).toHaveLength(1);
      expect(currentWeekFinishBy[0].id).toBe('overdue-finishby');

      // Check current week - should NOT see the deadline task in deadline column
      const currentWeekDeadline = getTodosForWeek(currentWeekEvent, 'deadline', tasks);
      expect(currentWeekDeadline).toHaveLength(0);

      // Check previous week - should only see the deadline task in deadline column
      const previousWeekDeadline = getTodosForWeek(previousWeekEvent, 'deadline', tasks);
      expect(previousWeekDeadline).toHaveLength(1);
      expect(previousWeekDeadline[0].id).toBe('overdue-deadline');

      // Check previous week - should NOT see the finishBy task in finishBy column
      const previousWeekFinishBy = getTodosForWeek(previousWeekEvent, 'finishBy', tasks);
      expect(previousWeekFinishBy).toHaveLength(0);
    });
  });
}); 
