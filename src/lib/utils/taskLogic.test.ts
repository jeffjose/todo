import { describe, it, expect, vi } from 'vitest';
import { getTaskStatus } from './taskLogic';
import type { Todo } from '$lib/client/dexie';

describe('Task Status Logic', () => {
  // Helper function to create a basic todo
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

      const task = createTodo({
        deadline: new Date('2024-03-17T00:00:00Z'),
        status: 'pending'
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

      const task = createTodo({
        deadline: new Date('2024-03-17T00:00:00Z'),
        status: 'completed',
        completed: new Date('2024-03-18T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('overdue');
      expect(status?.daysOverdue).toBe(1);

      vi.setSystemTime(new Date());
    });

    it('should not mark completed task as overdue if completed before deadline', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        deadline: new Date('2024-03-17T00:00:00Z'),
        status: 'completed',
        completed: new Date('2024-03-16T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeNull();

      vi.setSystemTime(new Date());
    });
  });

  describe('Slipped Tasks', () => {
    it('should mark task as slipped when finishBy is in the past', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        finishBy: new Date('2024-03-17T00:00:00Z'),
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('slipped');

      vi.setSystemTime(new Date());
    });

    it('should mark task as slipped when todo date is in the past', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        todo: new Date('2024-03-17T00:00:00Z'),
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('slipped');

      vi.setSystemTime(new Date());
    });

    it('should mark completed task as slipped if completed after finishBy', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        finishBy: new Date('2024-03-17T00:00:00Z'),
        status: 'completed',
        completed: new Date('2024-03-18T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('slipped');

      vi.setSystemTime(new Date());
    });

    it('should not mark completed task as slipped if completed before finishBy', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        finishBy: new Date('2024-03-17T00:00:00Z'),
        status: 'completed',
        completed: new Date('2024-03-16T00:00:00Z')
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeNull();

      vi.setSystemTime(new Date());
    });
  });

  describe('On Track Tasks', () => {
    it('should mark task as on-track when all dates are in the future', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        deadline: new Date('2024-03-20T00:00:00Z'),
        finishBy: new Date('2024-03-19T00:00:00Z'),
        todo: new Date('2024-03-19T00:00:00Z'),
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('on-track');

      vi.setSystemTime(new Date());
    });

    it('should mark task as on-track when it has no dates', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('on-track');

      vi.setSystemTime(new Date());
    });
  });

  describe('Priority Rules', () => {
    it('should prioritize overdue over slipped when both conditions are met', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        deadline: new Date('2024-03-17T00:00:00Z'),
        finishBy: new Date('2024-03-16T00:00:00Z'),
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('overdue');
      expect(status?.daysOverdue).toBe(1);

      vi.setSystemTime(new Date());
    });

    it('should prioritize slipped over on-track when both conditions are met', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        finishBy: new Date('2024-03-17T00:00:00Z'),
        todo: new Date('2024-03-19T00:00:00Z'),
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('slipped');

      vi.setSystemTime(new Date());
    });
  });

  describe('Edge Cases', () => {
    it('should mark task as on-track when deadline is same day', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        deadline: new Date('2024-03-18T00:00:00Z'),
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('on-track');

      vi.setSystemTime(new Date());
    });

    it('should mark task as on-track when finishBy is same day', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        finishBy: new Date('2024-03-18T00:00:00Z'),
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('on-track');

      vi.setSystemTime(new Date());
    });

    it('should mark task as on-track when todo is same day', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        todo: new Date('2024-03-18T00:00:00Z'),
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('on-track');

      vi.setSystemTime(new Date());
    });

    it('should mark task as on-track when dates are invalid', () => {
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      const task = createTodo({
        deadline: new Date('invalid'),
        finishBy: new Date('invalid'),
        todo: new Date('invalid'),
        status: 'pending'
      });

      const status = getTaskStatus(task, new Date('2024-03-11T00:00:00Z'));
      expect(status).toBeDefined();
      expect(status?.type).toBe('on-track');

      vi.setSystemTime(new Date());
    });
  });
}); 
