import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './taskLogic';

export function getTodosForWeek(
  todos: Todo[],
  weekEvent: WeekEvent,
  type: 'deadline' | 'finishBy' | 'todo'
): Todo[] {
  // Create a map of all todos for quick lookup
  const todoMap = new Map(todos.map((todo: Todo) => [todo.id, todo]));

  // First, filter todos for the week
  const weekTodos = todos.filter((todo: Todo) => {
    const date =
      type === 'deadline' ? todo.deadline : type === 'finishBy' ? todo.finishBy : todo.todo;
    if (!date) return false;

    // Set start date to beginning of day (midnight)
    const startDate = new Date(weekEvent.startDate);
    startDate.setHours(0, 0, 0, 0);

    // Set end date to end of day (23:59:59)
    const endDate = new Date(weekEvent.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (type === 'finishBy' && todo.title === 'XBR metrics') {
      console.log('DEBUG XBR metrics in finishBy column:', {
        weekStart: startDate.toISOString(),
        weekEnd: endDate.toISOString(),
        status: todo.status,
        finishBy: todo.finishBy?.toISOString(),
        todo: todo.todo?.toISOString(),
        completed: todo.completed?.toISOString(),
        isCurrentWeek: weekEvent.startDate <= new Date() && weekEvent.endDate >= new Date()
      });

      // For finishBy column:
      // 1. Show completed tasks in their finishBy week
      // 2. Show non-completed tasks in their scheduled week
      // 3. For current week, also show overdue tasks
      const wasScheduledForThisWeek = date >= startDate && date <= endDate;

      if (weekEvent.endDate < new Date()) {
        // For past weeks, show completed tasks in their finishBy week
        const shouldShow = todo.status === 'completed' && wasScheduledForThisWeek;
        if (todo.title === 'XBR metrics') {
          console.log('XBR metrics - Past week:', { shouldShow, wasScheduledForThisWeek, status: todo.status });
        }
        return shouldShow;
      }

      if (weekEvent.startDate <= new Date() && weekEvent.endDate >= new Date()) {
        // For current week, show tasks if:
        // 1. They are scheduled for this week (completed or not)
        // 2. They are overdue (finishBy date in past) and not completed
        const isOverdueFromPastWeek = date < new Date() && todo.status !== 'completed';
        // Don't show tasks that have a todo date in a different week
        const hasTodoInDifferentWeek = todo.todo && (todo.todo < startDate || todo.todo > endDate);

        const shouldShow = (wasScheduledForThisWeek || isOverdueFromPastWeek) && !hasTodoInDifferentWeek;

        if (todo.title === 'XBR metrics') {
          console.log('XBR metrics - Current week:', {
            shouldShow,
            wasScheduledForThisWeek,
            isOverdueFromPastWeek,
            hasTodoInDifferentWeek,
            status: todo.status
          });
        }
        return shouldShow;
      }

      // For future weeks, show tasks in their scheduled week
      const shouldShowInFutureWeek = wasScheduledForThisWeek;
      if (todo.title === 'XBR metrics') {
        console.log('XBR metrics - Future week:', {
          shouldShow: shouldShowInFutureWeek,
          wasScheduledForThisWeek,
          status: todo.status
        });
      }
      return shouldShowInFutureWeek;
    }

    // For deadline and todo columns, show tasks scheduled for this week
    return date >= startDate && date <= endDate;
  });

  // Get all parent tasks for the filtered todos
  const tasksWithParents = new Set<Todo>();
  weekTodos.forEach((todo: Todo) => {
    // Add the current todo and its parents
    tasksWithParents.add(todo);
    let currentTodo: Todo = todo;
    while (currentTodo.parentId) {
      const parentTodo = todoMap.get(currentTodo.parentId) as Todo;
      if (parentTodo) {
        tasksWithParents.add(parentTodo);
        currentTodo = parentTodo;
      } else {
        break;
      }
    }
  });

  // Also add any subtasks of the filtered todos
  weekTodos.forEach((todo: Todo) => {
    todos.forEach((potentialSubtask: Todo) => {
      if (potentialSubtask.parentId === todo.id) {
        tasksWithParents.add(potentialSubtask);
      }
    });
  });

  // Convert Set back to array and sort
  const result = Array.from(tasksWithParents).sort(sortTodos);

  if (type === 'finishBy') {
    const xbrMetrics = result.filter(t => t.title === 'XBR metrics');
    if (xbrMetrics.length > 0) {
      console.log('XBR metrics - Final tasks for week:', {
        weekStart: weekEvent.startDate.toISOString(),
        weekEnd: weekEvent.endDate.toISOString(),
        count: xbrMetrics.length,
        tasks: xbrMetrics.map(t => ({
          status: t.status,
          finishBy: t.finishBy?.toISOString(),
          todo: t.todo?.toISOString()
        }))
      });
    }
  }

  return result;
}

export function getOpenTodosUpToCurrentWeek(todos: Todo[], weekEvent: WeekEvent): Todo[] {
  const today = new Date();
  const isPastWeek = weekEvent.endDate < today;
  const isCurrentWeek = today >= weekEvent.startDate && today <= weekEvent.endDate;

  // Create a map of all todos for quick lookup
  const todoMap = new Map(todos.map((todo: Todo) => [todo.id, todo]));

  // Helper function to get a task and all its parents
  function getTaskWithParents(todo: Todo, tasksSet: Set<Todo>) {
    tasksSet.add(todo);
    let currentTodo: Todo = todo;
    while (currentTodo.parentId) {
      const parentTodo = todoMap.get(currentTodo.parentId);
      if (parentTodo) {
        const typedParentTodo = parentTodo as Todo;
        tasksSet.add(typedParentTodo);
        currentTodo = typedParentTodo;
      } else {
        break;
      }
    }
  }

  const tasksWithParents = new Set<Todo>();

  if (isPastWeek) {
    // For past weeks, show tasks completed in this week
    todos.forEach((todo: Todo) => {
      if (
        todo.status === 'completed' &&
        todo.completed &&
        todo.completed >= weekEvent.startDate &&
        todo.completed <= weekEvent.endDate
      ) {
        getTaskWithParents(todo, tasksWithParents);
      }
    });
  }

  if (isCurrentWeek) {
    // For current week, show:
    // 1. All tasks with dates in this week
    // 2. All open tasks without dates
    // 3. All open tasks from past weeks
    // 4. Completed tasks from this week
    todos.forEach((todo: Todo) => {
      const hasDateInWeek =
        (todo.deadline &&
          todo.deadline >= weekEvent.startDate &&
          todo.deadline <= weekEvent.endDate) ||
        (todo.finishBy &&
          todo.finishBy >= weekEvent.startDate &&
          todo.finishBy <= weekEvent.endDate) ||
        (todo.todo && todo.todo >= weekEvent.startDate && todo.todo <= weekEvent.endDate);

      const hasPastDate =
        (todo.deadline && todo.deadline < weekEvent.startDate) ||
        (todo.finishBy && todo.finishBy < weekEvent.startDate) ||
        (todo.todo && todo.todo < weekEvent.startDate);

      const wasCompletedThisWeek =
        todo.status === 'completed' &&
        todo.completed &&
        todo.completed >= weekEvent.startDate &&
        todo.completed <= weekEvent.endDate;

      const shouldShow =
        hasDateInWeek ||
        (!todo.deadline && !todo.finishBy && !todo.todo && todo.status !== 'completed') ||
        (hasPastDate && todo.status !== 'completed') ||
        wasCompletedThisWeek;

      if (shouldShow) {
        getTaskWithParents(todo, tasksWithParents);
      }
    });
  }

  // Remove duplicates based on todo ID
  const uniqueTodos = new Map(Array.from(tasksWithParents).map((todo) => [todo.id, todo]));
  return Array.from(uniqueTodos.values()).sort(sortTodos);
}

function sortTodos(a: Todo, b: Todo): number {
  // First sort by path to maintain hierarchy
  const pathA = a.path || '';
  const pathB = b.path || '';
  if (pathA !== pathB) {
    return pathA.localeCompare(pathB);
  }

  // Then sort by level (parent tasks before subtasks)
  if (a.level !== b.level) {
    return a.level - b.level;
  }

  // Then sort by completion status
  if (a.status === 'completed' && b.status !== 'completed') return -1;
  if (a.status !== 'completed' && b.status === 'completed') return 1;

  // Then sort by date if both tasks have dates
  const dateA = a.todo || a.deadline || a.finishBy;
  const dateB = b.todo || b.deadline || b.finishBy;

  // Handle date comparison consistently
  if (dateA && dateB) {
    const dateCompare = dateA.getTime() - dateB.getTime();
    if (dateCompare !== 0) return dateCompare;
  } else if (dateA) return -1;
  else if (dateB) return 1;

  // Then sort by ID for stability
  if (a.id !== b.id) {
    return a.id.localeCompare(b.id);
  }

  // Finally sort alphabetically by title as a last resort
  return (a.title || '').localeCompare(b.title || '');
} 
