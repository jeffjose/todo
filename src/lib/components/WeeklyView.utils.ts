import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';

export function getOpenTodosUpToCurrentWeek(weekEvent: WeekEvent, todos: Todo[], today: Date): Todo[] {
  if (!todos) return [];
  if (!weekEvent?.startDate || !weekEvent?.endDate || isNaN(weekEvent.startDate.getTime()) || isNaN(weekEvent.endDate.getTime())) return [];

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
