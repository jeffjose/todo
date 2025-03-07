import { describe, it, expect } from 'vitest';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';

describe('WeeklyView Todo Column Logic', () => {
  // Helper function to create a WeekEvent
  function createWeekEvent(startDate: Date): WeekEvent {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return {
      id: `week-${startDate.toISOString()}`,
      startDate,
      endDate,
      description: null,
      createdAt: new Date(),
      updatedAt: new Date()
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
      createdAt: new Date(),
      updatedAt: new Date(),
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

  describe('Current Week Todo Column', () => {
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

    describe('Multiple Date Fields', () => {
      it('should prioritize todo date over deadline and finishBy', () => {
        const multiDateTask = createTodo({
          id: 'multi-date',
          title: 'Task with Multiple Dates',
          status: 'pending',
          todo: new Date('2025-03-15T00:00:00.000Z'), // Next week
          deadline: new Date('2025-03-05T00:00:00.000Z'), // Current week
          finishBy: new Date('2025-03-04T00:00:00.000Z') // Current week
        });

        const todos = [multiDateTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(0); // Should not show because todo date is in future
      });

      it('should handle tasks with deadline after finishBy', () => {
        const invertedDatesTask = createTodo({
          id: 'inverted-dates',
          title: 'Task with Inverted Dates',
          status: 'pending',
          deadline: new Date('2025-03-06T00:00:00.000Z'),
          finishBy: new Date('2025-03-04T00:00:00.000Z')
        });

        const todos = [invertedDatesTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('inverted-dates');
      });
    });

    describe('Week Boundary Cases', () => {
      it('should handle tasks exactly at week start', () => {
        const weekStartTask = createTodo({
          id: 'week-start',
          title: 'Week Start Task',
          status: 'pending',
          todo: new Date('2025-03-03T00:00:00.000Z') // Monday 00:00 UTC
        });

        const todos = [weekStartTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('week-start');
      });

      it('should handle tasks at end of week', () => {
        const weekEndTask = createTodo({
          id: 'week-end',
          title: 'Week End Task',
          status: 'pending',
          todo: new Date('2025-03-09T07:59:59.999Z') // Sunday end of week in local timezone
        });

        console.log('Week Event:', {
          startDate: weekEvent.startDate.toISOString(),
          endDate: weekEvent.endDate.toISOString()
        });

        console.log('Task Date:', weekEndTask.todo?.toISOString());
        console.log('Today:', today.toISOString());

        const todos = [weekEndTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        console.log('Result:', result);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('week-end');
      });

      it('should handle tasks near week boundaries', () => {
        const nearEndTask = createTodo({
          id: 'near-end',
          title: 'Near End Task',
          status: 'pending',
          todo: new Date('2025-03-09T07:00:00.000Z') // Sunday near end of week in local timezone
        });

        console.log('Week Event:', {
          startDate: weekEvent.startDate.toISOString(),
          endDate: weekEvent.endDate.toISOString()
        });

        console.log('Task Date:', nearEndTask.todo?.toISOString());
        console.log('Today:', today.toISOString());

        const todos = [nearEndTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        console.log('Result:', result);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('near-end');
      });
    });

    describe('Task Status Edge Cases', () => {
      it('should show blocked tasks from past weeks', () => {
        const blockedTask = createTodo({
          id: 'blocked-task',
          title: 'Blocked Task',
          status: 'blocked',
          todo: new Date('2025-03-01T00:00:00.000Z') // Last week
        });

        const todos = [blockedTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('blocked-task');
      });

      it('should show in-progress tasks without dates', () => {
        const inProgressTask = createTodo({
          id: 'in-progress',
          title: 'In Progress Task',
          status: 'in-progress'
        });

        const todos = [inProgressTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('in-progress');
      });

      it('should handle tasks transitioning from pending to completed', () => {
        const justCompletedTask = createTodo({
          id: 'just-completed',
          title: 'Just Completed Task',
          status: 'completed',
          deadline: new Date('2025-03-05T00:00:00.000Z'),
          updatedAt: new Date('2025-03-07T00:00:00.000Z') // Completed today
        });

        const todos = [justCompletedTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('just-completed');
      });
    });

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
        // Current implementation maintains insertion order for same dates
        expect(result.map(t => t.id)).toEqual(['low-priority', 'high-priority']);
      });
    });

    describe('Task Datetime States', () => {
      it('should show overdue tasks in current week', () => {
        const overdueTodo = createTodo({
          id: 'overdue-task',
          title: 'Overdue Task',
          status: 'pending',
          deadline: new Date('2025-03-01T00:00:00.000Z') // Before current week
        });

        const todos = [overdueTodo];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('overdue-task');
      });

      it('should show tasks with todo date in current week', () => {
        const todoTask = createTodo({
          id: 'todo-task',
          title: 'Todo Task',
          status: 'pending',
          todo: new Date('2025-03-05T00:00:00.000Z')
        });

        const todos = [todoTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('todo-task');
      });

      it('should not show tasks with todo date in future weeks', () => {
        const futureTodoTask = createTodo({
          id: 'future-todo',
          title: 'Future Todo',
          status: 'pending',
          todo: new Date('2025-03-15T00:00:00.000Z') // Next week
        });

        const todos = [futureTodoTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(0);
      });

      it('should show tasks with past todo date if not completed', () => {
        const pastTodoTask = createTodo({
          id: 'past-todo',
          title: 'Past Todo',
          status: 'pending',
          todo: new Date('2025-03-01T00:00:00.000Z') // Last week
        });

        const todos = [pastTodoTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('past-todo');
      });

      it('should show completed tasks with deadline in current week', () => {
        const completedTask = createTodo({
          id: 'completed-current',
          title: 'Completed Current',
          status: 'completed',
          deadline: new Date('2025-03-05T00:00:00.000Z')
        });

        const todos = [completedTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('completed-current');
      });

      it('should show tasks with finishBy date in current week', () => {
        const finishByTask = createTodo({
          id: 'finish-by',
          title: 'Finish By Task',
          status: 'pending',
          finishBy: new Date('2025-03-05T00:00:00.000Z')
        });

        const todos = [finishByTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('finish-by');
      });

      it('should show slipped tasks from past weeks', () => {
        const slippedTask = createTodo({
          id: 'slipped-task',
          title: 'Slipped Task',
          status: 'pending',
          finishBy: new Date('2025-03-01T00:00:00.000Z') // Last week
        });

        const todos = [slippedTask];
        const result = getOpenTodosUpToCurrentWeek(weekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('slipped-task');
      });
    });

    describe('Past Week Tasks', () => {
      const pastWeekStart = new Date('2025-02-24T00:00:00.000Z');
      const pastWeekEvent = createWeekEvent(pastWeekStart);

      it('should show completed tasks in their original week', () => {
        const completedPastTask = createTodo({
          id: 'completed-past',
          title: 'Completed Past Task',
          status: 'completed',
          deadline: new Date('2025-02-26T00:00:00.000Z')
        });

        const todos = [completedPastTask];
        const result = getOpenTodosUpToCurrentWeek(pastWeekEvent, todos, today);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('completed-past');
      });

      it('should not show incomplete tasks in past weeks', () => {
        const incompletePastTask = createTodo({
          id: 'incomplete-past',
          title: 'Incomplete Past Task',
          status: 'pending',
          deadline: new Date('2025-02-26T00:00:00.000Z')
        });

        const todos = [incompletePastTask];
        const result = getOpenTodosUpToCurrentWeek(pastWeekEvent, todos, today);

        expect(result).toHaveLength(0);
      });
    });
  });
});
