import { describe, it, expect } from 'vitest';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';
import { getOpenTodosUpToCurrentWeek } from './WeeklyView.utils';

// Fixed date for all tests to ensure deterministic behavior
const TEST_DATE = new Date('2025-03-07T00:00:00.000Z');

describe('WeeklyView Task Tests', () => {
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

  describe('Task Status Transitions', () => {
    const weekEvent = createWeekEvent(new Date('2025-03-03T00:00:00.000Z'));

    it('should handle transition from pending to in-progress', () => {
      const transitioningTask = createTodo({
        id: 'transitioning',
        title: 'Transitioning Task',
        status: 'in-progress',
        todo: new Date('2025-03-05T00:00:00.000Z'),
        updatedAt: TEST_DATE
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [transitioningTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('in-progress');
    });

    it('should handle tasks blocked by dependencies', () => {
      const blockedTask = createTodo({
        id: 'blocked',
        title: 'Blocked Task',
        status: 'blocked',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [blockedTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('blocked');
    });

    it('should handle tasks with multiple status changes', () => {
      const multiStatusTask = createTodo({
        id: 'multi-status',
        title: 'Multi-Status Task',
        status: 'completed',
        todo: new Date('2025-03-04T00:00:00.000Z'),
        deadline: new Date('2025-03-06T00:00:00.000Z'),
        updatedAt: TEST_DATE
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [multiStatusTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('completed');
    });
  });

  describe('Task Prioritization and Urgency', () => {
    const weekEvent = createWeekEvent(new Date('2025-03-03T00:00:00.000Z'));

    it('should handle tasks with different priority levels', () => {
      const tasks = [
        createTodo({
          id: 'p0-task',
          title: 'Critical Task',
          status: 'pending',
          priority: 'P0',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'p1-task',
          title: 'High Priority Task',
          status: 'pending',
          priority: 'P1',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'p4-task',
          title: 'Low Priority Task',
          status: 'pending',
          priority: 'P4',
          todo: new Date('2025-03-05T00:00:00.000Z')
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, TEST_DATE);
      expect(result).toHaveLength(3);
      expect(result.map(t => t.priority)).toContain('P0');
      expect(result.map(t => t.priority)).toContain('P1');
      expect(result.map(t => t.priority)).toContain('P4');
    });

    it('should handle tasks with different urgency levels', () => {
      const tasks = [
        createTodo({
          id: 'urgent-task',
          title: 'Urgent Task',
          status: 'pending',
          urgency: 'high',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'medium-task',
          title: 'Medium Task',
          status: 'pending',
          urgency: 'medium',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'low-task',
          title: 'Low Task',
          status: 'pending',
          urgency: 'low',
          todo: new Date('2025-03-05T00:00:00.000Z')
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, TEST_DATE);
      expect(result).toHaveLength(3);
      expect(result.map(t => t.urgency)).toContain('high');
      expect(result.map(t => t.urgency)).toContain('medium');
      expect(result.map(t => t.urgency)).toContain('low');
    });

    it('should handle tasks with combined priority and urgency', () => {
      const tasks = [
        createTodo({
          id: 'critical-urgent',
          title: 'Critical Urgent Task',
          status: 'pending',
          priority: 'P0',
          urgency: 'high',
          todo: new Date('2025-03-05T00:00:00.000Z')
        }),
        createTodo({
          id: 'low-not-urgent',
          title: 'Low Non-Urgent Task',
          status: 'pending',
          priority: 'P4',
          urgency: 'low',
          todo: new Date('2025-03-05T00:00:00.000Z')
        })
      ];

      const result = getOpenTodosUpToCurrentWeek(weekEvent, tasks, TEST_DATE);
      expect(result).toHaveLength(2);
      const criticalTask = result.find(t => t.id === 'critical-urgent');
      const lowTask = result.find(t => t.id === 'low-not-urgent');

      expect(criticalTask?.priority).toBe('P0');
      expect(criticalTask?.urgency).toBe('high');
      expect(lowTask?.priority).toBe('P4');
      expect(lowTask?.urgency).toBe('low');
    });
  });

  describe('Task Description and Content', () => {
    const weekEvent = createWeekEvent(new Date('2025-03-03T00:00:00.000Z'));

    it('should handle tasks with long descriptions', () => {
      const longDescTask = createTodo({
        id: 'long-desc',
        title: 'Task with Long Description',
        description: 'A'.repeat(1000), // 1000 character description
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [longDescTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('long-desc');
      expect(result[0].description?.length).toBe(1000);
    });

    it('should handle tasks with special characters in description', () => {
      const specialCharsTask = createTodo({
        id: 'special-chars',
        title: 'Task with Special Characters',
        description: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [specialCharsTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('special-chars');
      expect(result[0].description).toBe('!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`');
    });

    it('should handle tasks with HTML-like content in description', () => {
      const htmlContentTask = createTodo({
        id: 'html-content',
        title: 'Task with HTML Content',
        description: '<div>This is a <strong>test</strong> with <em>HTML</em> content</div>',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [htmlContentTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('html-content');
      expect(result[0].description).toBe('<div>This is a <strong>test</strong> with <em>HTML</em> content</div>');
    });

    it('should handle tasks with markdown content in description', () => {
      const markdownContentTask = createTodo({
        id: 'markdown-content',
        title: 'Task with Markdown Content',
        description: '# Heading\n\n- List item 1\n- List item 2\n\n**Bold** and *italic* text',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [markdownContentTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('markdown-content');
      expect(result[0].description).toBe('# Heading\n\n- List item 1\n- List item 2\n\n**Bold** and *italic* text');
    });
  });

  describe('Task Emoji Handling', () => {
    const weekEvent = createWeekEvent(new Date('2025-03-03T00:00:00.000Z'));

    it('should handle tasks with single emoji', () => {
      const singleEmojiTask = createTodo({
        id: 'single-emoji',
        title: 'Task with Single Emoji',
        emoji: '🚀',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [singleEmojiTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('single-emoji');
      expect(result[0].emoji).toBe('🚀');
    });

    it('should handle tasks with compound emoji', () => {
      const compoundEmojiTask = createTodo({
        id: 'compound-emoji',
        title: 'Task with Compound Emoji',
        emoji: '👨‍👩‍👧‍👦',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [compoundEmojiTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('compound-emoji');
      expect(result[0].emoji).toBe('👨‍👩‍👧‍👦');
    });

    it('should handle tasks with emoji modifiers', () => {
      const modifiedEmojiTask = createTodo({
        id: 'modified-emoji',
        title: 'Task with Modified Emoji',
        emoji: '👋🏽',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [modifiedEmojiTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('modified-emoji');
      expect(result[0].emoji).toBe('👋🏽');
    });

    it('should handle tasks with null emoji', () => {
      const nullEmojiTask = createTodo({
        id: 'null-emoji',
        title: 'Task with Null Emoji',
        emoji: null,
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [nullEmojiTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('null-emoji');
      expect(result[0].emoji).toBeNull();
    });
  });

  describe('Task Path Validation', () => {
    const weekEvent = createWeekEvent(new Date('2025-03-03T00:00:00.000Z'));

    it('should handle tasks with invalid paths', () => {
      const invalidPathTask = createTodo({
        id: 'invalid-path',
        title: 'Task with Invalid Path',
        path: 'root..invalid..path',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [invalidPathTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('invalid-path');
      expect(result[0].path).toBe('root..invalid..path');
    });

    it('should handle tasks with extremely long paths', () => {
      const longPathTask = createTodo({
        id: 'long-path',
        title: 'Task with Long Path',
        path: 'root.' + 'a'.repeat(500) + '.b'.repeat(500),
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [longPathTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('long-path');
      expect(result[0].path.length).toBe(1505); // Actual length: 'root.' (5) + 500 'a's + '.b'.repeat(500) + 500 'b's
    });

    it('should handle tasks with special characters in path', () => {
      const specialCharsPathTask = createTodo({
        id: 'special-chars-path',
        title: 'Task with Special Characters in Path',
        path: 'root.!@#$%^&*()_+-=[]{};:\'",.<>?/~`',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [specialCharsPathTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('special-chars-path');
      expect(result[0].path).toBe('root.!@#$%^&*()_+-=[]{};:\'",.<>?/~`');
    });

    it('should handle tasks with unicode characters in path', () => {
      const unicodePathTask = createTodo({
        id: 'unicode-path',
        title: 'Task with Unicode Characters in Path',
        path: 'root.🚀.émoji.アジア文字.Русский',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [unicodePathTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('unicode-path');
      expect(result[0].path).toBe('root.🚀.émoji.アジア文字.Русский');
    });

    it('should handle tasks with empty path segments', () => {
      const emptySegmentsPathTask = createTodo({
        id: 'empty-segments',
        title: 'Task with Empty Path Segments',
        path: 'root...path',
        todo: new Date('2025-03-05T00:00:00.000Z')
      });

      const result = getOpenTodosUpToCurrentWeek(weekEvent, [emptySegmentsPathTask], TEST_DATE);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('empty-segments');
      expect(result[0].path).toBe('root...path');
    });
  });
}); 
