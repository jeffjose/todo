import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';

export function getOpenTodosUpToCurrentWeek(weekEvent: WeekEvent, todos: Todo[], today: Date): Todo[] {
  if (!todos) return [];
  if (!weekEvent?.startDate || !weekEvent?.endDate || isNaN(weekEvent.startDate.getTime()) || isNaN(weekEvent.endDate.getTime())) return [];

  const isPastWeek = weekEvent.endDate < today;
  const isCurrentWeek = today >= weekEvent.startDate && today <= weekEvent.endDate;
  const isFutureWeek = weekEvent.startDate > today;

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
  // 1. All tasks (including completed ones) with dates in this week
  // 2. All open tasks from past weeks
  // 3. Tasks without dates
  if (isCurrentWeek) {
    todos.forEach((todo) => {
      const hasDateInWeek =
        (todo.deadline && todo.deadline >= weekEvent.startDate && todo.deadline <= weekEvent.endDate) ||
        (todo.finishBy && todo.finishBy >= weekEvent.startDate && todo.finishBy <= weekEvent.endDate) ||
        (todo.todo && todo.todo >= weekEvent.startDate && todo.todo <= weekEvent.endDate);

      const isFromPastWeek =
        (todo.deadline && todo.deadline < weekEvent.startDate) ||
        (todo.finishBy && todo.finishBy < weekEvent.startDate) ||
        (todo.todo && todo.todo < weekEvent.startDate);

      const hasNoDates = !todo.deadline && !todo.finishBy && !todo.todo;

      const shouldShow = hasDateInWeek || (isFromPastWeek && todo.status !== 'completed') || hasNoDates;

      if (shouldShow) {
        getTaskWithParents(todo, tasksWithParents);
      }
    });
  }

  // For future weeks, show all tasks scheduled for that week
  if (isFutureWeek) {
    todos.forEach((todo) => {
      const hasDateInWeek =
        (todo.deadline && todo.deadline >= weekEvent.startDate && todo.deadline <= weekEvent.endDate) ||
        (todo.finishBy && todo.finishBy >= weekEvent.startDate && todo.finishBy <= weekEvent.endDate) ||
        (todo.todo && todo.todo >= weekEvent.startDate && todo.todo <= weekEvent.endDate);

      if (hasDateInWeek) {
        getTaskWithParents(todo, tasksWithParents);
      }
    });
  }

  const result = Array.from(tasksWithParents);
  result.sort((a, b) => {
    // First sort by path to maintain hierarchy
    if (a.path < b.path) return -1;
    if (a.path > b.path) return 1;

    // Then sort by level (parent tasks before subtasks)
    if (a.level !== b.level) {
      return a.level - b.level;
    }

    // Then sort by completion status
    if (a.status === 'completed' && b.status !== 'completed') return -1;
    if (a.status !== 'completed' && b.status === 'completed') return 1;

    // Finally sort by date if both tasks have dates
    const dateA = a.todo || a.deadline || a.finishBy;
    const dateB = b.todo || b.deadline || b.finishBy;
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });

  return result;
} 
