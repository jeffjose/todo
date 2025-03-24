import { describe, it, expect } from 'vitest';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from '../WeeklyView.svelte';

// Helper function that mimics the sorting logic from WeeklyView.svelte
function sortTodos(todos: Todo[]): Todo[] {
  // First, build a map of parent-child relationships
  const childrenMap = new Map<string, Todo[]>();
  const parentMap = new Map<string, Todo>();

  todos.forEach(todo => {
    if (todo.parentId) {
      const children = childrenMap.get(todo.parentId) || [];
      children.push(todo);
      childrenMap.set(todo.parentId, children);
      parentMap.set(todo.id, todos.find(t => t.id === todo.parentId)!);
    }
  });

  // Helper function to get the root parent of a task
  function getRootParent(todo: Todo): Todo {
    let current = todo;
    while (current.parentId && parentMap.has(current.id)) {
      current = parentMap.get(current.id)!;
    }
    return current;
  }

  // Helper function to get all descendants of a task
  function getAllDescendants(todo: Todo): Todo[] {
    const result: Todo[] = [];
    const children = childrenMap.get(todo.id) || [];
    for (const child of children) {
      result.push(child);
      result.push(...getAllDescendants(child));
    }
    return result;
  }

  // Get all root tasks (tasks without parents)
  const rootTasks = todos.filter(todo => !todo.parentId);

  // Sort root tasks by whether they have children, then by path or title
  const sortedRootTasks = [...rootTasks].sort((a, b) => {
    const aHasChildren = childrenMap.has(a.id);
    const bHasChildren = childrenMap.has(b.id);

    // Tasks with children come first
    if (aHasChildren && !bHasChildren) return -1;
    if (!aHasChildren && bHasChildren) return 1;

    const pathA = a.path || '';
    const pathB = b.path || '';

    // If both paths are empty, sort by title
    if (!pathA && !pathB) {
      return a.title.localeCompare(b.title);
    }

    // Empty paths come before non-empty paths
    if (!pathA) return -1;
    if (!pathB) return 1;

    // Sort by path
    return pathA.localeCompare(pathB);
  });

  // For each root task, add its descendants in order
  const result: Todo[] = [];
  for (const rootTask of sortedRootTasks) {
    result.push(rootTask);
    const descendants = getAllDescendants(rootTask);
    descendants.sort((a, b) => {
      if (a.level !== b.level) {
        return a.level - b.level;
      }
      const pathA = a.path || '';
      const pathB = b.path || '';
      if (pathA !== pathB) {
        return pathA.localeCompare(pathB);
      }
      if (a.status !== b.status) {
        return a.status === 'completed' ? -1 : 1;
      }
      if (a.deadline && b.deadline) {
        return a.deadline.getTime() - b.deadline.getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return a.title.localeCompare(b.title);
    });
    result.push(...descendants);
  }

  return result;
}

describe('WeeklyView Task Sorting', () => {
  const baseDate = new Date('2025-03-24T17:00:00');

  // Helper function to create a test todo
  function createTestTodo(
    id: string,
    title: string,
    path: string,
    level: number,
    parentId: string | null = null,
    status: string = 'pending',
    deadline: Date | null = null
  ): Todo {
    return {
      id,
      title,
      path,
      level,
      parentId,
      status,
      deadline,
      description: null,
      emoji: null,
      finishBy: null,
      todo: null,
      priority: 'P1',
      urgency: 'medium',
      tags: [],
      attachments: [],
      comments: [],
      subtasks: [],
      createdAt: baseDate,
      updatedAt: baseDate
    };
  }

  it('should sort parent tasks before their subtasks', () => {
    const parent = createTestTodo('parent1', 'HDR', 'root.parent1', 0);
    const subtask1 = createTestTodo('sub1', 'Read HDR doc', 'root.parent1.sub1', 1, 'parent1');
    const subtask2 = createTestTodo('sub2', 'Catch up on HDR email', 'root.parent1.sub2', 1, 'parent1');
    const unrelatedTask = createTestTodo('other1', 'Marketing', 'root.other1', 0);

    const todos = [subtask2, unrelatedTask, subtask1, parent];
    const sorted = sortTodos(todos);

    expect(sorted.map(t => ({ title: t.title, path: t.path }))).toEqual([
      { title: 'HDR', path: 'root.parent1' },
      { title: 'Read HDR doc', path: 'root.parent1.sub1' },
      { title: 'Catch up on HDR email', path: 'root.parent1.sub2' },
      { title: 'Marketing', path: 'root.other1' }
    ]);
  });

  it('should maintain correct hierarchy with multiple parent tasks and their subtasks', () => {
    const parent1 = createTestTodo('parent1', 'HDR', 'root.parent1', 0);
    const parent2 = createTestTodo('parent2', 'Marketing', 'root.parent2', 0);
    const subtask1 = createTestTodo('sub1', 'Read HDR doc', 'root.parent1.sub1', 1, 'parent1');
    const subtask2 = createTestTodo('sub2', 'Catch up on HDR email', 'root.parent1.sub2', 1, 'parent1');
    const subtask3 = createTestTodo('sub3', 'Contact team', 'root.parent2.sub3', 1, 'parent2');

    const todos = [subtask2, parent2, subtask3, subtask1, parent1];
    const sorted = sortTodos(todos);

    expect(sorted.map(t => t.title)).toEqual([
      'HDR',
      'Read HDR doc',
      'Catch up on HDR email',
      'Marketing',
      'Contact team'
    ]);
  });

  it('should handle tasks with same paths but different levels', () => {
    const parent = createTestTodo('parent1', 'HDR', 'root.parent1', 0);
    const subtask = createTestTodo('sub1', 'Read HDR doc', 'root.parent1', 1, 'parent1');
    const deepSubtask = createTestTodo('sub2', 'Section 1', 'root.parent1', 2, 'sub1');

    const todos = [deepSubtask, subtask, parent];
    const sorted = sortTodos(todos);

    expect(sorted.map(t => ({ title: t.title, level: t.level }))).toEqual([
      { title: 'HDR', level: 0 },
      { title: 'Read HDR doc', level: 1 },
      { title: 'Section 1', level: 2 }
    ]);
  });

  it('should sort completed tasks before incomplete tasks within same hierarchy level', () => {
    const parent = createTestTodo('parent1', 'HDR', 'root.parent1', 0);
    const completedSubtask = createTestTodo('sub1', 'Read HDR doc', 'root.parent1.sub1', 1, 'parent1', 'completed');
    const pendingSubtask = createTestTodo('sub2', 'Catch up on HDR email', 'root.parent1.sub2', 1, 'parent1', 'pending');

    const todos = [pendingSubtask, completedSubtask, parent];
    const sorted = sortTodos(todos);

    expect(sorted.map(t => ({ title: t.title, status: t.status }))).toEqual([
      { title: 'HDR', status: 'pending' },
      { title: 'Read HDR doc', status: 'completed' },
      { title: 'Catch up on HDR email', status: 'pending' }
    ]);
  });

  it('should sort by deadline within same hierarchy level and status', () => {
    const parent = createTestTodo('parent1', 'HDR', 'root.parent1', 0);
    const urgentSubtask = createTestTodo(
      'sub1',
      'Read HDR doc',
      'root.parent1.sub1',
      1,
      'parent1',
      'pending',
      new Date('2025-03-25')
    );
    const laterSubtask = createTestTodo(
      'sub2',
      'Catch up on HDR email',
      'root.parent1.sub2',
      1,
      'parent1',
      'pending',
      new Date('2025-03-31')
    );

    const todos = [laterSubtask, urgentSubtask, parent];
    const sorted = sortTodos(todos);

    expect(sorted.map(t => ({ title: t.title, deadline: t.deadline }))).toEqual([
      { title: 'HDR', deadline: null },
      { title: 'Read HDR doc', deadline: new Date('2025-03-25') },
      { title: 'Catch up on HDR email', deadline: new Date('2025-03-31') }
    ]);
  });

  it('should handle empty or null paths gracefully', () => {
    const task1 = createTestTodo('task1', 'Task 1', '', 0);
    const task2 = createTestTodo('task2', 'Task 2', null as unknown as string, 0);
    const task3 = createTestTodo('task3', 'Task 3', 'root.task3', 0);

    const todos = [task2, task3, task1];
    const sorted = sortTodos(todos);

    expect(sorted.map(t => ({ title: t.title, path: t.path || '' }))).toEqual([
      { title: 'Task 1', path: '' },
      { title: 'Task 2', path: '' },
      { title: 'Task 3', path: 'root.task3' }
    ]);
  });
}); 
