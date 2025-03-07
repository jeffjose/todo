import { describe, it, expect } from 'vitest';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';

// Fixed date for all tests to ensure deterministic behavior
const TEST_DATE = new Date('2025-03-07T00:00:00.000Z');

describe('WeeklyView Basic Tests', () => {
  // Helper function to create a WeekEvent
  function createWeekEvent(startDate: Date): WeekEvent {
    const endDate = new Date(startDate);
    endDate.setUTCDate(startDate.getUTCDate() + 6);
    endDate.setUTCHours(7, 59, 59, 999); // Set to 7:59:59.999 UTC to match the component's behavior
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

  describe('Basic Todo Tests', () => {
    it('should create a todo with default values', () => {
      const todo = createTodo();
      expect(todo.id).toBe('test-todo');
      expect(todo.status).toBe('pending');
      expect(todo.createdAt).toBe(TEST_DATE);
      expect(todo.updatedAt).toBe(TEST_DATE);
    });

    it('should create a todo with custom values', () => {
      const todo = createTodo({
        id: 'custom-todo',
        title: 'Custom Todo',
        status: 'completed'
      });
      expect(todo.id).toBe('custom-todo');
      expect(todo.status).toBe('completed');
      expect(todo.createdAt).toBe(TEST_DATE);
      expect(todo.updatedAt).toBe(TEST_DATE);
    });
  });

  describe('Basic WeekEvent Tests', () => {
    it('should create a week event with correct dates', () => {
      const startDate = new Date('2025-03-03T00:00:00.000Z');
      const weekEvent = createWeekEvent(startDate);
      expect(weekEvent.startDate).toEqual(startDate);
      expect(weekEvent.endDate.toISOString()).toBe('2025-03-09T07:59:59.999Z');
      expect(weekEvent.createdAt).toBe(TEST_DATE);
      expect(weekEvent.updatedAt).toBe(TEST_DATE);
    });
  });
}); 
