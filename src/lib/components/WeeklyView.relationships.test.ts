import { describe, it, expect } from 'vitest';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';

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

// Import the function from WeeklyView.svelte
function getOpenTodosUpToCurrentWeek(weekEvent: WeekEvent, todos: Todo[], today: Date = new Date()): Todo[] {
  const isPastWeek = weekEvent.endDate < today;
  const isCurrentWeek = today >= weekEvent.startDate && today <= weekEvent.endDate;

  // Create a map of all todos for quick lookup
  const todoMap = new Map(todos.map((todo) => [todo.id, todo]));

  // Helper function to get a task and all its parents
  function getTaskWithParents(todo: Todo, tasksSet: Set<Todo>) {
    tasksSet.add(todo);
    let currentTodo: Todo = todo;
    while (currentTodo.parentId) {
      const parentTodo = todoMap.get(currentTodo.parentId);
      if (parentTodo) {
        tasksSet.add(parentTodo);
        currentTodo = parentTodo;
      } else {
        break;
      }
    }
  }

  const tasksWithParents = new Set<Todo>();

  // For past weeks, show completed tasks from that week and their parents
  if (isPastWeek) {
    todos.forEach((todo) => {
      if (todo.status === 'completed') {
        const date = todo.deadline || todo.finishBy || todo.todo;
        if (date && date >= weekEvent.startDate && date <= weekEvent.endDate) {
          getTaskWithParents(todo, tasksWithParents);
        }
      }
    });
  }

  // For current week, show:
  // 1. All open tasks from past and current week (if they don't have a todo date)
  // 2. Tasks with todo date in this week
  // 3. Completed tasks with deadline or finishBy date in this week
  if (isCurrentWeek) {
    todos.forEach((todo) => {
      const hasTodoInWeek =
        todo.todo && todo.todo >= weekEvent.startDate && todo.todo <= weekEvent.endDate;
      const hasPastTodo = todo.todo && todo.todo < weekEvent.startDate;
      const hasDeadlineInWeek =
        todo.deadline && todo.deadline >= weekEvent.startDate && todo.deadline <= weekEvent.endDate;
      const hasFinishByInWeek =
        todo.finishBy && todo.finishBy >= weekEvent.startDate && todo.finishBy <= weekEvent.endDate;

      const shouldShow =
        hasTodoInWeek ||
        (!todo.todo && todo.status !== 'completed') ||
        (hasPastTodo && todo.status !== 'completed') ||
        (todo.status === 'completed' && (hasDeadlineInWeek || hasFinishByInWeek));

      if (shouldShow) {
        getTaskWithParents(todo, tasksWithParents);
      }
    });
  }

  const result = Array.from(tasksWithParents);
  result.sort((a, b) => {
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (a.status !== 'completed' && b.status === 'completed') return 1;
    const dateA = a.todo || a.deadline || a.finishBy;
    const dateB = b.todo || b.deadline || b.finishBy;
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });

  return result;
}

describe('WeeklyView Task Relationships', () => {
  const today = new Date('2025-03-07T00:00:00.000Z');
  const currentWeekStart = new Date('2025-03-03T00:00:00.000Z');
  const weekEvent = createWeekEvent(currentWeekStart);

  describe('Parent-Child Task Relationships', () => {
    it('should show parent task when child task is visible in current week', () => {
      const parentTodo = createTodo({
        id: 'parent-task',
        title: 'Parent Task',
        status: 'completed',
        path: 'root'
      });

      const childTodo = createTodo({
        id: 'child-task',
        title: 'Child Task',
        status: 'pending',
        parentId: 'parent-task',
        path: 'root.parent-task',
        level: 1,
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const todos = [parentTodo, childTodo];
      const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toContain('parent-task');
      expect(result.map(t => t.id)).toContain('child-task');
    });

    it('should show completed parent task when child task is pending in current week', () => {
      const parentTodo = createTodo({
        id: 'parent-completed',
        title: 'Parent Completed',
        status: 'completed',
        path: 'root'
      });

      const childTodo = createTodo({
        id: 'child-pending',
        title: 'Child Pending',
        status: 'pending',
        parentId: 'parent-completed',
        path: 'root.parent-completed',
        level: 1,
        deadline: new Date('2025-03-05T00:00:00.000Z')
      });

      const todos = [parentTodo, childTodo];
      const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toContain('parent-completed');
      expect(result.map(t => t.id)).toContain('child-pending');
    });
  });

  describe('Complex Parent-Child Relationships', () => {
    it('should show all ancestors in a multi-level task hierarchy', () => {
      const grandparentTodo = createTodo({
        id: 'grandparent',
        title: 'Grandparent Task',
        status: 'completed',
        path: 'root'
      });

      const parentTodo = createTodo({
        id: 'parent',
        title: 'Parent Task',
        status: 'in-progress',
        parentId: 'grandparent',
        path: 'root.grandparent',
        level: 1
      });

      const childTodo = createTodo({
        id: 'child',
        title: 'Child Task',
        status: 'pending',
        parentId: 'parent',
        path: 'root.grandparent.parent',
        level: 2,
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const todos = [grandparentTodo, parentTodo, childTodo];
      const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

      expect(result).toHaveLength(3);
      expect(result.map(t => t.id)).toContain('grandparent');
      expect(result.map(t => t.id)).toContain('parent');
      expect(result.map(t => t.id)).toContain('child');
    });

    it('should handle missing parent tasks gracefully', () => {
      const childTodo = createTodo({
        id: 'orphan-child',
        title: 'Orphan Child Task',
        status: 'pending',
        parentId: 'non-existent-parent',
        path: 'root.non-existent-parent',
        level: 1,
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const todos = [childTodo];
      const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('orphan-child');
    });
  });
}); 
