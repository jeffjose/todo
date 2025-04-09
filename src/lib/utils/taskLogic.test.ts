import { describe, it, expect, vi } from 'vitest';
import { getTaskStatus } from './taskLogic';
import type { Task } from '../types';
import type { Todo } from '$lib/client/dexie';

describe('Task Status Logic', () => {
  // Helper function to create a basic task for status tests
  const createTaskForStatus = (overrides: Partial<Task> = {}): Task => ({
    completed: false,
    completedAt: undefined,
    deadline: null,
    finishBy: null,
    todo: null,
    ...overrides
  });

  // Helper function to create a basic todo for other tests
  const createTodo = (overrides: Partial<Todo> = {}): Todo => ({
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
    path: 'root.test-id',
    level: 0,
    parentId: null,
    completed: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  });

  describe('Overdue Tasks', () => {
    it('should mark task as overdue when deadline is in the past', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTaskForStatus({
        deadline: new Date('2024-03-17T00:00:00Z'),
        completed: false
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('overdue');
      expect(status?.daysOverdue).toBe(1);

      vi.setSystemTime(new Date());
    });

    it('should mark completed task as overdue if completed after deadline', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTaskForStatus({
        deadline: new Date('2024-03-17T00:00:00Z'),
        completed: true,
        completedAt: new Date('2024-03-18T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('overdue');
      expect(status?.daysOverdue).toBe(1);

      vi.setSystemTime(new Date());
    });

    it('should not mark completed task as overdue if completed before deadline', () => {
      const task = createTaskForStatus({
        deadline: new Date('2024-03-12T00:00:00Z'),
        completed: true,
        completedAt: new Date('2024-03-11T23:59:59Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeUndefined();

      vi.setSystemTime(new Date());
    });
  });

  describe('Slipped Tasks', () => {
    it('should mark task as slipped when finishBy is in the past', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTaskForStatus({
        finishBy: new Date('2024-03-17T00:00:00Z'),
        completed: false
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('slipped');

      vi.setSystemTime(new Date());
    });

    it('should mark task as slipped when todo date is in the past', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTaskForStatus({
        todo: new Date('2024-03-17T00:00:00Z'),
        completed: false
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('slipped');

      vi.setSystemTime(new Date());
    });

    it('should mark completed task as slipped if completed after finishBy', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTaskForStatus({
        finishBy: new Date('2024-03-17T00:00:00Z'),
        completed: true,
        completedAt: new Date('2024-03-18T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('slipped');

      vi.setSystemTime(new Date());
    });

    it('should not mark completed task as slipped if completed before finishBy', () => {
      const task = createTaskForStatus({
        finishBy: new Date('2024-03-12T00:00:00Z'),
        completed: true,
        completedAt: new Date('2024-03-11T23:59:59Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeUndefined();

      vi.setSystemTime(new Date());
    });
  });

  describe('Tasks with no status', () => {
    it('should return undefined when all dates are in the future', () => {
      const task = createTaskForStatus({
        deadline: new Date('2024-03-13T00:00:00Z'),
        finishBy: new Date('2024-03-13T00:00:00Z'),
        todo: new Date('2024-03-13T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeUndefined();

      vi.setSystemTime(new Date());
    });

    it('should return undefined when it has no dates', () => {
      const task = createTaskForStatus();

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeUndefined();

      vi.setSystemTime(new Date());
    });
  });

  describe('Priority Rules', () => {
    it('should prioritize overdue over slipped when both conditions are met', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTaskForStatus({
        deadline: new Date('2024-03-17T00:00:00Z'),
        finishBy: new Date('2024-03-16T00:00:00Z'),
        completed: false
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('overdue');
      expect(status?.daysOverdue).toBe(1);

      vi.setSystemTime(new Date());
    });

    it('should prioritize slipped over undefined when both conditions are met', () => {
      const task = createTaskForStatus({
        deadline: new Date('2024-03-13T00:00:00Z'),
        finishBy: new Date('2024-03-10T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status?.type).toBe('slipped');

      vi.setSystemTime(new Date());
    });
  });

  describe('Edge Cases', () => {
    it('should return undefined when deadline is same day', () => {
      const task = createTaskForStatus({
        deadline: new Date('2024-03-11T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeUndefined();

      vi.setSystemTime(new Date());
    });

    it('should return undefined when finishBy is same day', () => {
      const task = createTaskForStatus({
        finishBy: new Date('2024-03-11T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeUndefined();

      vi.setSystemTime(new Date());
    });

    it('should return undefined when todo is same day', () => {
      const task = createTaskForStatus({
        todo: new Date('2024-03-11T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeUndefined();

      vi.setSystemTime(new Date());
    });

    it('should return undefined when dates are invalid', () => {
      const task = createTaskForStatus({
        deadline: new Date('invalid'),
        finishBy: new Date('invalid'),
        todo: new Date('invalid')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeUndefined();

      vi.setSystemTime(new Date());
    });
  });
}); 
