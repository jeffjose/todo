import { describe, it, expect } from 'vitest';
import { generateId, buildPath, PATH_SEPARATOR, ROOT_PATH, getNextBusinessDay, getRandomBusinessTime } from './dexie';
import { getTaskStatus } from '$lib/utils';
import { vi } from 'vitest';

// Mock the validateUsername function
const validateUsername = (username: unknown): boolean => {
  if (typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 31) return false;
  return /^[a-z0-9_-]+$/.test(username);
};

describe('Todo Utilities', () => {
  describe('Username Validation', () => {
    it('should validate correct usernames', () => {
      expect(validateUsername('user123')).toBe(true);
      expect(validateUsername('test_user')).toBe(true);
      expect(validateUsername('john-doe')).toBe(true);
      expect(validateUsername('abc')).toBe(true);
    });

    it('should reject invalid usernames', () => {
      expect(validateUsername('')).toBe(false);
      expect(validateUsername('ab')).toBe(false); // too short
      expect(validateUsername('a'.repeat(32))).toBe(false); // too long
      expect(validateUsername('User123')).toBe(false); // uppercase not allowed
      expect(validateUsername('user@123')).toBe(false); // special chars not allowed
      expect(validateUsername('user name')).toBe(false); // spaces not allowed
      expect(validateUsername(123)).toBe(false); // wrong type
      expect(validateUsername(null)).toBe(false); // null
      expect(validateUsername(undefined)).toBe(false); // undefined
    });
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(1000); // All IDs should be unique
    });

    it('should generate IDs with correct format', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      expect(/^[a-z0-9]+$/.test(id)).toBe(true); // Only lowercase letters and numbers
    });
  });

  describe('Path Management', () => {
    it('should build root path when parent path is null', () => {
      const path = buildPath(null, 'test-id');
      expect(path).toBe(ROOT_PATH);
    });

    it('should build path with separator when parent path exists', () => {
      const parentPath = 'parent';
      const id = 'test-id';
      const path = buildPath(parentPath, id);
      expect(path).toBe(`${parentPath}${PATH_SEPARATOR}${id}`);
    });

    it('should handle nested paths correctly', () => {
      const parentPath = 'parent.child';
      const id = 'test-id';
      const path = buildPath(parentPath, id);
      expect(path).toBe(`${parentPath}${PATH_SEPARATOR}${id}`);
    });

    it('should handle deep nesting levels', () => {
      const level1 = buildPath(ROOT_PATH, 'task1');
      const level2 = buildPath(level1, 'task2');
      const level3 = buildPath(level2, 'task3');

      expect(level1).toBe('root.task1');
      expect(level2).toBe('root.task1.task2');
      expect(level3).toBe('root.task1.task2.task3');
    });

    it('should maintain path hierarchy', () => {
      const paths = [
        ROOT_PATH,
        buildPath(ROOT_PATH, 'task1'),
        buildPath(buildPath(ROOT_PATH, 'task1'), 'subtask1'),
        buildPath(buildPath(buildPath(ROOT_PATH, 'task1'), 'subtask1'), 'subsubtask1')
      ];

      expect(paths).toEqual([
        'root',
        'root.task1',
        'root.task1.subtask1',
        'root.task1.subtask1.subsubtask1'
      ]);
    });
  });

  describe('Date and Time Functions', () => {
    it('should get next business day', () => {
      // Test with a Monday
      const monday = new Date('2024-03-18T00:00:00Z');
      const nextDay = new Date('2024-03-19T00:00:00Z');
      expect(getNextBusinessDay(monday).getTime()).toBe(nextDay.getTime());

      // Test with a Friday
      const friday = new Date('2024-03-22T00:00:00Z');
      const nextMonday = new Date('2024-03-25T00:00:00Z');
      expect(getNextBusinessDay(friday).getTime()).toBe(nextMonday.getTime());

      // Test with a Saturday
      const saturday = new Date('2024-03-23T00:00:00Z');
      expect(getNextBusinessDay(saturday).getTime()).toBe(nextMonday.getTime());

      // Test with a Sunday
      const sunday = new Date('2024-03-24T00:00:00Z');
      expect(getNextBusinessDay(sunday).getTime()).toBe(nextMonday.getTime());
    });

    it('should get random business time', () => {
      const date = new Date('2024-03-18');
      const time = getRandomBusinessTime(date);

      // Check that the time is between 9 AM and 5 PM
      expect(time.getHours()).toBeGreaterThanOrEqual(9);
      expect(time.getHours()).toBeLessThan(17);

      // Check that minutes are between 0 and 59
      expect(time.getMinutes()).toBeGreaterThanOrEqual(0);
      expect(time.getMinutes()).toBeLessThan(60);

      // Check that seconds and milliseconds are 0
      expect(time.getSeconds()).toBe(0);
      expect(time.getMilliseconds()).toBe(0);
    });
  });

  describe('Task Status Functions', () => {
    it('should correctly identify overdue tasks', () => {
      // Mock current date to 2024-03-18
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      // Task due yesterday
      const overdueTask = {
        deadline: new Date('2024-03-17T00:00:00Z'),
        finishBy: new Date('2024-03-17T00:00:00Z'),
        status: 'open'
      };

      const status = getTaskStatus(overdueTask);
      expect(status).toBeDefined();
      expect(status?.type).toBe('overdue');
      expect(status?.daysOverdue).toBeGreaterThan(0);

      // Reset system time
      vi.setSystemTime(new Date());
    });

    it('should correctly identify slipped tasks', () => {
      // Mock current date to 2024-03-18
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      // Task with finishBy date in past week
      const slippedTask = {
        deadline: new Date('2024-03-25T00:00:00Z'),
        finishBy: new Date('2024-03-15T00:00:00Z'),
        status: 'open'
      };

      const status = getTaskStatus(slippedTask);
      expect(status).toBeDefined();
      expect(status?.type).toBe('slipped');

      // Reset system time
      vi.setSystemTime(new Date());
    });

    it('should not show status for completed tasks', () => {
      // Mock current date to 2024-03-18
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      // Overdue task that is completed
      const completedTask = {
        deadline: new Date('2024-03-17T00:00:00Z'),
        finishBy: new Date('2024-03-17T00:00:00Z'),
        status: 'completed'
      };

      const status = getTaskStatus(completedTask);
      expect(status).toBeNull();

      // Reset system time
      vi.setSystemTime(new Date());
    });

    it('should not show status for future tasks', () => {
      // Mock current date to 2024-03-18
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      // Task with future dates
      const futureTask = {
        deadline: new Date('2024-03-25T00:00:00Z'),
        finishBy: new Date('2024-03-25T00:00:00Z'),
        status: 'open'
      };

      const status = getTaskStatus(futureTask);
      expect(status).toBeNull();

      // Reset system time
      vi.setSystemTime(new Date());
    });

    it('should handle tasks with no dates', () => {
      // Mock current date to 2024-03-18
      const mockDate = new Date('2024-03-18T00:00:00Z');
      vi.setSystemTime(mockDate);

      // Task with no dates
      const noDateTask = {
        deadline: null,
        finishBy: null,
        status: 'open'
      };

      const status = getTaskStatus(noDateTask);
      expect(status).toBeNull();

      // Reset system time
      vi.setSystemTime(new Date());
    });

    describe('Badge Behavior', () => {
      describe('Deadline Column Badges', () => {
        it('should show overdue badge for tasks with past deadline', () => {
          // Mock current date to 2024-03-18
          const mockDate = new Date('2024-03-18T00:00:00Z');
          vi.setSystemTime(mockDate);

          const task = {
            deadline: new Date('2024-03-16T00:00:00Z'),
            finishBy: null,
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeDefined();
          expect(status?.type).toBe('overdue');
          expect(status?.daysOverdue).toBe(2);

          // Reset system time
          vi.setSystemTime(new Date());
        });

        it('should not show overdue badge for tasks with future deadline', () => {
          // Mock current date to 2024-03-18
          const mockDate = new Date('2024-03-18T00:00:00Z');
          vi.setSystemTime(mockDate);

          const task = {
            deadline: new Date('2024-03-20T00:00:00Z'),
            finishBy: null,
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeNull();

          // Reset system time
          vi.setSystemTime(new Date());
        });

        it('should not show overdue badge for completed tasks with past deadline', () => {
          // Mock current date to 2024-03-18
          const mockDate = new Date('2024-03-18T00:00:00Z');
          vi.setSystemTime(mockDate);

          const task = {
            deadline: new Date('2024-03-16T00:00:00Z'),
            finishBy: null,
            status: 'completed'
          };

          const status = getTaskStatus(task);
          expect(status).toBeNull();

          // Reset system time
          vi.setSystemTime(new Date());
        });
      });

      describe('Finish By Column Badges', () => {
        it('should show slipped badge for tasks with past finishBy date', () => {
          const task = {
            deadline: null,
            finishBy: new Date('2024-03-16T00:00:00Z'),
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeDefined();
          expect(status?.type).toBe('slipped');
        });

        it('should not show slipped badge for tasks with future finishBy date', () => {
          const task = {
            deadline: null,
            finishBy: new Date('2024-03-20T00:00:00Z'),
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeNull();
        });

        it('should not show slipped badge for completed tasks with past finishBy date', () => {
          const task = {
            deadline: null,
            finishBy: new Date('2024-03-16T00:00:00Z'),
            status: 'completed'
          };

          const status = getTaskStatus(task);
          expect(status).toBeNull();
        });
      });

      describe('Badge Priority', () => {
        it('should show overdue badge instead of slipped when both deadline and finishBy are past', () => {
          const task = {
            deadline: new Date('2024-03-16T00:00:00Z'),
            finishBy: new Date('2024-03-15T00:00:00Z'),
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeDefined();
          expect(status?.type).toBe('overdue');
          expect(status?.daysOverdue).toBe(2);
        });

        it('should show slipped badge when finishBy is past but deadline is future', () => {
          const task = {
            deadline: new Date('2024-03-20T00:00:00Z'),
            finishBy: new Date('2024-03-16T00:00:00Z'),
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeDefined();
          expect(status?.type).toBe('slipped');
        });
      });

      describe('Edge Cases', () => {
        it('should handle tasks with same day deadline', () => {
          const task = {
            deadline: new Date('2024-03-18T00:00:00Z'),
            finishBy: null,
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeNull();
        });

        it('should handle tasks with same day finishBy', () => {
          const task = {
            deadline: null,
            finishBy: new Date('2024-03-18T00:00:00Z'),
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeNull();
        });

        it('should handle tasks with no dates', () => {
          const task = {
            deadline: null,
            finishBy: null,
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeNull();
        });

        it('should handle tasks with invalid dates', () => {
          const task = {
            deadline: new Date('invalid'),
            finishBy: new Date('invalid'),
            status: 'open'
          };

          const status = getTaskStatus(task);
          expect(status).toBeNull();
        });
      });
    });
  });
}); 
