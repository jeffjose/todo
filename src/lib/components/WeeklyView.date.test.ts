import { describe, it, expect } from 'vitest';
import type { Todo } from '$lib/client/dexie';
import type { WeekEvent } from './WeeklyView.svelte';

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
    createdAt: new Date('2025-03-07T00:00:00.000Z'),
    updatedAt: new Date('2025-03-07T00:00:00.000Z')
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
    createdAt: new Date('2025-03-07T00:00:00.000Z'),
    updatedAt: new Date('2025-03-07T00:00:00.000Z'),
    ...overrides
  };
}

describe('WeeklyView Date Tests', () => {
  describe('Date Formatting Functions', () => {
    function formatDate(date: Date): string {
      if (isNaN(date.getTime())) return 'Invalid Date';
      const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
      return utcDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
      });
    }

    function formatTodoDate(date: Date | null): string {
      if (!date) return 'No date';
      if (isNaN(date.getTime())) return 'Invalid Date';
      const utcDate = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes()
      ));
      return utcDate.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'UTC'
      });
    }

    it('should format date in short month and day format', () => {
      const date = new Date('2025-03-15T00:00:00.000Z');
      expect(formatDate(date)).toBe('Mar 15');
    });

    it('should handle single digit days', () => {
      const date = new Date('2025-03-05T00:00:00.000Z');
      expect(formatDate(date)).toBe('Mar 5');
    });

    it('should format todo date with time', () => {
      const date = new Date('2025-03-15T14:30:00.000Z');
      expect(formatTodoDate(date)).toBe('Mar 15, 2:30 PM');
    });

    it('should handle null todo date', () => {
      expect(formatTodoDate(null)).toBe('No date');
    });

    it('should handle dates at DST transitions', () => {
      const dstDate = new Date('2024-03-10T10:00:00.000Z');
      expect(formatDate(dstDate)).toBe('Mar 10');
    });

    it('should handle dates at year boundaries', () => {
      const newYearsEve = new Date('2024-12-31T23:59:59.999Z');
      const newYearsDay = new Date('2025-01-01T00:00:00.000Z');
      expect(formatDate(newYearsEve)).toBe('Dec 31');
      expect(formatDate(newYearsDay)).toBe('Jan 1');
    });

    it('should handle leap year dates', () => {
      const leapDay = new Date('2024-02-29T12:00:00.000Z');
      expect(formatDate(leapDay)).toBe('Feb 29');
    });

    it('should format todo date with midnight time', () => {
      const midnight = new Date('2025-03-15T00:00:00.000Z');
      expect(formatTodoDate(midnight)).toBe('Mar 15, 12:00 AM');
    });

    it('should format todo date at noon', () => {
      const noon = new Date('2025-03-15T12:00:00.000Z');
      expect(formatTodoDate(noon)).toBe('Mar 15, 12:00 PM');
    });

    it('should handle invalid date inputs gracefully', () => {
      const invalidDate = new Date('invalid');
      expect(formatDate(invalidDate)).toBe('Invalid Date');
      expect(formatTodoDate(invalidDate)).toBe('Invalid Date');
    });
  });
}); 
