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

  // First filter todos based on date and type
  const filteredTodos = todos.filter((todo) => {
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

  // Create a map for quick lookup
  const todoMap = new Map(todos.map(todo => [todo.id, todo]));

  // Get all parent tasks and subtasks
  const tasksWithRelations = new Set<Todo>();
  filteredTodos.forEach(todo => {
    // Add the current todo
    tasksWithRelations.add(todo);

    // Add all parent tasks
    let currentTodo = todo;
    while (currentTodo.parentId) {
      const parentTodo = todoMap.get(currentTodo.parentId);
      if (parentTodo) {
        tasksWithRelations.add(parentTodo);
        currentTodo = parentTodo;
      } else {
        break;
      }
    }

    // Add immediate subtasks
    todos.forEach(potentialSubtask => {
      if (potentialSubtask.parentId === todo.id) {
        tasksWithRelations.add(potentialSubtask);
      }
    });
  });

  // Convert Set back to array and sort
  const sortedTodos = Array.from(tasksWithRelations).sort((a, b) => {
    // Split paths into segments
    const partsA = a.path.split('.');
    const partsB = b.path.split('.');

    // Compare the first path segment (root)
    if (partsA[0] !== partsB[0]) {
      return partsA[0].localeCompare(partsB[0]);
    }

    // If root is the same, compare the next segment
    if (partsA[1] !== partsB[1]) {
      return partsA[1].localeCompare(partsB[1]);
    }

    // If we're at the same level in the hierarchy, sort by level
    if (a.level !== b.level) return a.level - b.level;

    // If levels are equal, sort by status
    if (a.status !== b.status) {
      return a.status === 'completed' ? -1 : 1;
    }

    // If status is equal and they share the same parent (same hierarchy level),
    // sort by date
    const aDate = type === 'deadline' ? a.deadline : type === 'finishBy' ? a.finishBy : a.todo;
    const bDate = type === 'deadline' ? b.deadline : type === 'finishBy' ? b.finishBy : b.todo;
    if (!aDate || !bDate) return 0;
    return aDate.getTime() - bDate.getTime();
  });

  return sortedTodos;
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

    it('should promote slipped tasks to current week regardless of finishBy date', () => {
      const tasks = [
        createTodo({
          id: 'slipped-task-1',
          title: 'Slipped Task 1',
          status: 'pending',
          finishBy: new Date('2025-02-20T00:00:00.000Z') // Previous week
        }),
        createTodo({
          id: 'slipped-task-2',
          title: 'Slipped Task 2',
          status: 'pending',
          finishBy: new Date('2025-02-15T00:00:00.000Z') // Two weeks ago
        })
      ];

      // Both tasks should appear in current week's finishBy column
      const currentWeekTodos = getTodosForWeek(currentWeekEvent, 'finishBy', tasks);
      expect(currentWeekTodos).toHaveLength(2);
      // Tasks should be sorted by finishBy date (earlier date first)
      expect(currentWeekTodos.map(t => t.id)).toEqual(['slipped-task-2', 'slipped-task-1']);

      // Neither task should appear in previous week's finishBy column
      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'finishBy', tasks);
      expect(previousWeekTodos).toHaveLength(0);
    });

    it('should handle mixed slipped and completed tasks correctly', () => {
      const tasks = [
        createTodo({
          id: 'slipped-task',
          title: 'Slipped Task',
          status: 'pending',
          finishBy: new Date('2025-02-26T00:00:00.000Z') // Previous week
        }),
        createTodo({
          id: 'completed-task',
          title: 'Completed Task',
          status: 'completed',
          finishBy: new Date('2025-02-26T00:00:00.000Z') // Previous week
        })
      ];

      // Only slipped task should appear in current week
      const currentWeekTodos = getTodosForWeek(currentWeekEvent, 'finishBy', tasks);
      expect(currentWeekTodos).toHaveLength(1);
      expect(currentWeekTodos[0].id).toBe('slipped-task');

      // Only completed task should appear in previous week
      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'finishBy', tasks);
      expect(previousWeekTodos).toHaveLength(1);
      expect(previousWeekTodos[0].id).toBe('completed-task');
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

  describe('Subtask Behavior', () => {
    it('should show parent tasks when subtask is visible', () => {
      const parentTask = createTodo({
        id: 'parent',
        title: 'Parent Task',
        path: 'root.parent',
        status: 'pending'
      });

      const subtask = createTodo({
        id: 'subtask',
        title: 'Subtask',
        parentId: 'parent',
        path: 'root.parent.subtask',
        level: 1,
        deadline: new Date('2025-02-26T00:00:00.000Z') // Previous week
      });

      const todos = [parentTask, subtask];

      // Check if both parent and subtask appear in previous week's deadline column
      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'deadline', todos);
      expect(previousWeekTodos).toHaveLength(2);
      expect(previousWeekTodos.map(t => t.id)).toContain('parent');
      expect(previousWeekTodos.map(t => t.id)).toContain('subtask');
    });

    it('should show subtasks when parent task is visible', () => {
      const parentTask = createTodo({
        id: 'parent',
        title: 'Parent Task',
        path: 'root.parent',
        deadline: new Date('2025-02-26T00:00:00.000Z'), // Previous week
        status: 'pending'
      });

      const subtask = createTodo({
        id: 'subtask',
        title: 'Subtask',
        parentId: 'parent',
        path: 'root.parent.subtask',
        level: 1,
        status: 'pending'
      });

      const todos = [parentTask, subtask];

      // Check if both parent and subtask appear in previous week's deadline column
      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'deadline', todos);
      expect(previousWeekTodos).toHaveLength(2);
      expect(previousWeekTodos.map(t => t.id)).toContain('parent');
      expect(previousWeekTodos.map(t => t.id)).toContain('subtask');
    });

    it('should handle mixed deadline and finishBy tasks with subtasks', () => {
      const parentDeadline = createTodo({
        id: 'parent-deadline',
        title: 'Parent Deadline Task',
        path: 'root.parent-deadline',
        deadline: new Date('2025-02-26T00:00:00.000Z'), // Previous week
        status: 'pending'
      });

      const subtaskFinishBy = createTodo({
        id: 'subtask-finishby',
        title: 'Subtask FinishBy',
        parentId: 'parent-deadline',
        path: 'root.parent-deadline.subtask-finishby',
        level: 1,
        finishBy: new Date('2025-02-26T00:00:00.000Z'), // Previous week
        status: 'pending'
      });

      const todos = [parentDeadline, subtaskFinishBy];

      // Parent and subtask should appear in previous week's deadline column
      const previousWeekDeadline = getTodosForWeek(previousWeekEvent, 'deadline', todos);
      expect(previousWeekDeadline).toHaveLength(2);
      expect(previousWeekDeadline.map(t => t.id)).toContain('parent-deadline');
      expect(previousWeekDeadline.map(t => t.id)).toContain('subtask-finishby');

      // Only subtask should appear in current week's finishBy column (promoted)
      const currentWeekFinishBy = getTodosForWeek(currentWeekEvent, 'finishBy', todos);
      expect(currentWeekFinishBy).toHaveLength(2);
      expect(currentWeekFinishBy.map(t => t.id)).toContain('parent-deadline');
      expect(currentWeekFinishBy.map(t => t.id)).toContain('subtask-finishby');
    });
  });

  describe('Task Sorting', () => {
    it('should sort tasks by path to maintain hierarchy', () => {
      const tasks = [
        createTodo({
          id: 'parent2',
          title: 'Parent 2',
          path: 'root.parent2',
          deadline: new Date('2025-02-26T00:00:00.000Z')
        }),
        createTodo({
          id: 'parent1',
          title: 'Parent 1',
          path: 'root.parent1',
          deadline: new Date('2025-02-26T00:00:00.000Z')
        }),
        createTodo({
          id: 'subtask1',
          title: 'Subtask 1',
          parentId: 'parent1',
          path: 'root.parent1.subtask1',
          level: 1,
          deadline: new Date('2025-02-26T00:00:00.000Z')
        })
      ];

      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'deadline', tasks);
      expect(previousWeekTodos).toHaveLength(3);
      expect(previousWeekTodos.map(t => t.id)).toEqual(['parent1', 'subtask1', 'parent2']);
    });

    it('should sort tasks by status within same hierarchy level', () => {
      const tasks = [
        createTodo({
          id: 'parent',
          title: 'Parent',
          path: 'root.parent',
          deadline: new Date('2025-02-26T00:00:00.000Z'),
          status: 'pending'
        }),
        createTodo({
          id: 'subtask1',
          title: 'Subtask 1',
          parentId: 'parent',
          path: 'root.parent.subtask1',
          level: 1,
          deadline: new Date('2025-02-26T00:00:00.000Z'),
          status: 'completed'
        }),
        createTodo({
          id: 'subtask2',
          title: 'Subtask 2',
          parentId: 'parent',
          path: 'root.parent.subtask2',
          level: 1,
          deadline: new Date('2025-02-26T00:00:00.000Z'),
          status: 'pending'
        })
      ];

      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'deadline', tasks);
      expect(previousWeekTodos).toHaveLength(3);
      expect(previousWeekTodos.map(t => t.id)).toEqual(['parent', 'subtask1', 'subtask2']);
    });

    it('should sort tasks by date within same hierarchy level and status', () => {
      const tasks = [
        createTodo({
          id: 'parent',
          title: 'Parent',
          path: 'root.parent',
          deadline: new Date('2025-02-26T00:00:00.000Z'),
          status: 'pending'
        }),
        createTodo({
          id: 'subtask1',
          title: 'Subtask 1',
          parentId: 'parent',
          path: 'root.parent.subtask1',
          level: 1,
          deadline: new Date('2025-02-27T00:00:00.000Z'),
          status: 'pending'
        }),
        createTodo({
          id: 'subtask2',
          title: 'Subtask 2',
          parentId: 'parent',
          path: 'root.parent.subtask2',
          level: 1,
          deadline: new Date('2025-02-25T00:00:00.000Z'),
          status: 'pending'
        })
      ];

      const previousWeekTodos = getTodosForWeek(previousWeekEvent, 'deadline', tasks);
      expect(previousWeekTodos).toHaveLength(3);
      expect(previousWeekTodos.map(t => t.id)).toEqual(['parent', 'subtask2', 'subtask1']);
    });
  });
}); 
