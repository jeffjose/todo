import { describe, it, expect } from 'vitest';
import type { WeekEvent } from './WeeklyView.svelte';

// Fixed date for all tests to ensure deterministic behavior
const TEST_DATE = new Date('2025-03-07T00:00:00.000Z');

describe('WeeklyView Date Tests', () => {
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

  describe('Date Formatting Functions', () => {
    function formatDate(date: Date): string {
      if (isNaN(date.getTime())) return 'Invalid Date';
      // Use UTC methods to avoid timezone issues
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
      // Use UTC methods to avoid timezone issues
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

  describe('Month-Related Logic', () => {
    function isStartOfMonth(weekEvent: WeekEvent): boolean {
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekEvent.startDate);
        date.setDate(date.getDate() + i);
        if (date.getDate() === 1) {
          return true;
        }
      }
      return false;
    }

    function shouldShowMonthHeader(weekEvent: WeekEvent, index: number): boolean {
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekEvent.startDate);
        date.setDate(date.getDate() + i);
        if (date.getDate() === 1) {
          return true;
        }
      }
      return index === 0;
    }

    function getMonthYear(date: Date, weekEvent: WeekEvent): string {
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(weekEvent.startDate);
        checkDate.setDate(checkDate.getDate() + i);
        if (checkDate.getDate() === 1) {
          return checkDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
      }
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    it('should identify start of month', () => {
      const weekEvent = createWeekEvent(new Date('2025-02-24T00:00:00.000Z')); // Week containing March 1st
      expect(isStartOfMonth(weekEvent)).toBe(true);
    });

    it('should identify mid-month week', () => {
      const weekEvent = createWeekEvent(new Date('2025-03-10T00:00:00.000Z')); // Mid-March week
      expect(isStartOfMonth(weekEvent)).toBe(false);
    });

    it('should show month header for first week', () => {
      const weekEvent = createWeekEvent(new Date('2025-03-15T00:00:00.000Z'));
      expect(shouldShowMonthHeader(weekEvent, 0)).toBe(true);
    });

    it('should show month header for week containing first of month', () => {
      const weekEvent = createWeekEvent(new Date('2025-02-24T00:00:00.000Z')); // Week containing March 1
      expect(shouldShowMonthHeader(weekEvent, 2)).toBe(true);
    });

    it('should not show month header for regular week', () => {
      const weekEvent = createWeekEvent(new Date('2025-03-15T00:00:00.000Z'));
      expect(shouldShowMonthHeader(weekEvent, 2)).toBe(false);
    });

    it('should format month year for week containing first of month', () => {
      const weekEvent = createWeekEvent(new Date('2025-02-24T00:00:00.000Z')); // Week containing March 1
      const date = new Date('2025-02-24T00:00:00.000Z');
      expect(getMonthYear(date, weekEvent)).toBe('March 2025');
    });

    it('should format month year for regular week', () => {
      const weekEvent = createWeekEvent(new Date('2025-03-15T00:00:00.000Z'));
      const date = new Date('2025-03-15T00:00:00.000Z');
      expect(getMonthYear(date, weekEvent)).toBe('March 2025');
    });

    it('should handle year transitions', () => {
      const weekEvent = createWeekEvent(new Date('2025-12-29T00:00:00.000Z')); // Week containing January 1
      const date = new Date('2025-12-29T00:00:00.000Z');
      expect(getMonthYear(date, weekEvent)).toBe('January 2026');
    });

    it('should handle week spanning three months', () => {
      const weekEvent = createWeekEvent(new Date('2025-07-30T00:00:00.000Z'));
      expect(isStartOfMonth(weekEvent)).toBe(true);
      expect(getMonthYear(weekEvent.startDate, weekEvent)).toBe('August 2025');
    });

    it('should handle first week of the year', () => {
      const weekEvent = createWeekEvent(new Date('2024-12-30T00:00:00.000Z'));
      expect(isStartOfMonth(weekEvent)).toBe(true);
      expect(getMonthYear(weekEvent.startDate, weekEvent)).toBe('January 2025');
    });

    it('should handle last week of the year', () => {
      const weekEvent = createWeekEvent(new Date('2025-12-29T00:00:00.000Z'));
      expect(isStartOfMonth(weekEvent)).toBe(true);
      expect(getMonthYear(weekEvent.startDate, weekEvent)).toBe('January 2026');
    });

    it('should handle leap year February transition', () => {
      const weekEvent = createWeekEvent(new Date('2024-02-26T00:00:00.000Z'));
      expect(isStartOfMonth(weekEvent)).toBe(true);
      expect(getMonthYear(weekEvent.startDate, weekEvent)).toBe('March 2024');
    });

    it('should handle non-leap year February transition', () => {
      const weekEvent = createWeekEvent(new Date('2025-02-24T00:00:00.000Z'));
      expect(isStartOfMonth(weekEvent)).toBe(true);
      expect(getMonthYear(weekEvent.startDate, weekEvent)).toBe('March 2025');
    });

    it('should handle DST transition weeks', () => {
      const dstWeekEvent = createWeekEvent(new Date('2024-03-04T00:00:00.000Z'));
      expect(shouldShowMonthHeader(dstWeekEvent, 1)).toBe(false);
    });

    it('should show month header for first week of dataset', () => {
      const firstWeek = createWeekEvent(new Date('2025-01-06T00:00:00.000Z'));
      expect(shouldShowMonthHeader(firstWeek, 0)).toBe(true);
    });

    it('should handle months starting on different days of the week', () => {
      const sundayStart = createWeekEvent(new Date('2024-09-01T00:00:00.000Z')); // September 1, 2024 is a Sunday
      const wednesdayStart = createWeekEvent(new Date('2025-01-01T00:00:00.000Z')); // January 1, 2025 is a Wednesday
      const saturdayStart = createWeekEvent(new Date('2024-06-01T00:00:00.000Z')); // June 1, 2024 is a Saturday

      expect(isStartOfMonth(sundayStart)).toBe(true);
      expect(isStartOfMonth(wednesdayStart)).toBe(true);
      expect(isStartOfMonth(saturdayStart)).toBe(true);
    });
  });
}); 
