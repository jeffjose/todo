import { describe, it, expect } from 'vitest';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';
import { getOpenTodosUpToCurrentWeek } from './WeeklyView.utils';

function createTodo(overrides: Partial<Todo> = {}): Todo {
  return {
    id: 'test-id',
    title: 'Test Task',
    description: null,
    emoji: null,
    deadline: null,
    finishBy: null,
    todo: null,
    status: 'pending',
    priority: 'P3',
    urgency: 'medium',
    tags: [],
    attachments: [],
    urls: [],
    comments: [],
    subtasks: [],
    path: 'root',
    level: 0,
    parentId: null,
    completed: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}

function createWeekEvent(startDate: Date, endDate: Date): WeekEvent {
  return {
    id: 'test-week',
    startDate,
    endDate,
    description: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

describe('Task Completion Behavior', () => {
  const today = new Date('2024-03-20T00:00:00Z'); // Wednesday
  const currentWeekStart = new Date('2024-03-18T00:00:00Z'); // Monday
  const currentWeekEnd = new Date('2024-03-24T23:59:59Z'); // Sunday
  const currentWeek = createWeekEvent(currentWeekStart, currentWeekEnd);

  describe('Current Week Tasks', () => {
    it('should show completed tasks in their original week', () => {
      const task = createTodo({
        id: 'completed-task',
        title: 'Completed Task',
        status: 'completed',
        deadline: new Date('2024-03-19T00:00:00Z'), // Tuesday
        completed: new Date('2024-03-19T00:00:00Z')
      });

      const result = getOpenTodosUpToCurrentWeek(currentWeek, [task], today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('completed-task');
      expect(result[0].status).toBe('completed');
    });

    it('should show completed tasks with their original deadline date', () => {
      const task = createTodo({
        id: 'completed-task',
        title: 'Completed Task',
        status: 'completed',
        deadline: new Date('2024-03-19T00:00:00Z'), // Tuesday
        completed: new Date('2024-03-21T00:00:00Z') // Completed on Thursday
      });

      const result = getOpenTodosUpToCurrentWeek(currentWeek, [task], today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('completed-task');
      expect(result[0].deadline?.toISOString()).toBe('2024-03-19T00:00:00.000Z');
    });

    it('should show completed tasks with their original finishBy date', () => {
      const task = createTodo({
        id: 'completed-task',
        title: 'Completed Task',
        status: 'completed',
        finishBy: new Date('2024-03-19T00:00:00Z'), // Tuesday
        completed: new Date('2024-03-21T00:00:00Z') // Completed on Thursday
      });

      const result = getOpenTodosUpToCurrentWeek(currentWeek, [task], today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('completed-task');
      expect(result[0].finishBy?.toISOString()).toBe('2024-03-19T00:00:00.000Z');
    });
  });

  describe('Past Week Tasks', () => {
    const pastWeekStart = new Date('2024-03-11T00:00:00Z'); // Monday
    const pastWeekEnd = new Date('2024-03-17T23:59:59Z'); // Sunday
    const pastWeek = createWeekEvent(pastWeekStart, pastWeekEnd);

    it('should show completed tasks in their original week', () => {
      const task = createTodo({
        id: 'completed-task',
        title: 'Completed Task',
        status: 'completed',
        deadline: new Date('2024-03-15T00:00:00Z'), // Friday
        completed: new Date('2024-03-15T00:00:00Z')
      });

      const result = getOpenTodosUpToCurrentWeek(pastWeek, [task], today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('completed-task');
      expect(result[0].status).toBe('completed');
    });

    it('should not show completed tasks from past weeks in current week', () => {
      const task = createTodo({
        id: 'completed-task',
        title: 'Completed Task',
        status: 'completed',
        deadline: new Date('2024-03-15T00:00:00Z'), // Friday
        completed: new Date('2024-03-15T00:00:00Z')
      });

      const result = getOpenTodosUpToCurrentWeek(currentWeek, [task], today);
      expect(result).toHaveLength(0);
    });
  });

  describe('Future Week Tasks', () => {
    const futureWeekStart = new Date('2024-03-25T00:00:00Z'); // Monday
    const futureWeekEnd = new Date('2024-03-31T23:59:59Z'); // Sunday
    const futureWeek = createWeekEvent(futureWeekStart, futureWeekEnd);

    it('should show completed tasks in their original week', () => {
      const task = createTodo({
        id: 'completed-task',
        title: 'Completed Task',
        status: 'completed',
        deadline: new Date('2024-03-27T00:00:00Z'), // Wednesday
        completed: new Date('2024-03-27T00:00:00Z')
      });

      const result = getOpenTodosUpToCurrentWeek(futureWeek, [task], today);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('completed-task');
      expect(result[0].status).toBe('completed');
    });

    it('should not show completed tasks from future weeks in current week', () => {
      const task = createTodo({
        id: 'completed-task',
        title: 'Completed Task',
        status: 'completed',
        deadline: new Date('2024-03-27T00:00:00Z'), // Wednesday
        completed: new Date('2024-03-27T00:00:00Z')
      });

      const result = getOpenTodosUpToCurrentWeek(currentWeek, [task], today);
      expect(result).toHaveLength(0);
    });
  });

  describe('Task Hierarchy', () => {
    it('should show completed parent tasks with their children', () => {
      const parentTask = createTodo({
        id: 'parent-task',
        title: 'Parent Task',
        status: 'completed',
        deadline: new Date('2024-03-19T00:00:00Z'),
        completed: new Date('2024-03-19T00:00:00Z')
      });

      const childTask = createTodo({
        id: 'child-task',
        title: 'Child Task',
        status: 'pending',
        deadline: new Date('2024-03-19T00:00:00Z'),
        parentId: 'parent-task',
        path: 'root.parent-task'
      });

      const result = getOpenTodosUpToCurrentWeek(currentWeek, [parentTask, childTask], today);
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toContain('parent-task');
      expect(result.map(t => t.id)).toContain('child-task');
    });

    it('should show completed child tasks with their parents', () => {
      const parentTask = createTodo({
        id: 'parent-task',
        title: 'Parent Task',
        status: 'pending',
        deadline: new Date('2024-03-19T00:00:00Z')
      });

      const childTask = createTodo({
        id: 'child-task',
        title: 'Child Task',
        status: 'completed',
        deadline: new Date('2024-03-19T00:00:00Z'),
        parentId: 'parent-task',
        path: 'root.parent-task',
        completed: new Date('2024-03-19T00:00:00Z')
      });

      const result = getOpenTodosUpToCurrentWeek(currentWeek, [parentTask, childTask], today);
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toContain('parent-task');
      expect(result.map(t => t.id)).toContain('child-task');
    });
  });
}); 
