import { describe, it, expect } from 'vitest';
import { generateId, buildPath, PATH_SEPARATOR, ROOT_PATH, getNextBusinessDay, getRandomBusinessTime, generateRandomTodoData } from './dexie';

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

  describe('Random Todo Data Generation', () => {
    it('should generate valid todo data', () => {
      const todoData = generateRandomTodoData();

      // Check required fields
      expect(todoData.title).toBeDefined();
      expect(todoData.description).toBeDefined();
      expect(todoData.emoji).toBeDefined();
      expect(todoData.deadline).toBeDefined();
      expect(todoData.finishBy).toBeDefined();
      expect(todoData.status).toBeDefined();
      expect(todoData.priority).toBeDefined();
      expect(todoData.urgency).toBeDefined();
      expect(todoData.tags).toBeDefined();
      expect(todoData.attachments).toBeDefined();
      expect(todoData.path).toBeDefined();
      expect(todoData.level).toBeDefined();
      expect(todoData.parentId).toBeDefined();

      // Check field types
      expect(typeof todoData.title).toBe('string');
      expect(typeof todoData.description).toBe('string');
      expect(typeof todoData.emoji).toBe('string');
      expect(todoData.deadline instanceof Date).toBe(true);
      expect(todoData.finishBy instanceof Date).toBe(true);
      expect(typeof todoData.status).toBe('string');
      expect(typeof todoData.priority).toBe('string');
      expect(typeof todoData.urgency).toBe('string');
      expect(Array.isArray(todoData.tags)).toBe(true);
      expect(Array.isArray(todoData.attachments)).toBe(true);
      expect(typeof todoData.path).toBe('string');
      expect(typeof todoData.level).toBe('number');
      expect(todoData.parentId).toBeNull();

      // Check business rules
      expect(todoData.deadline.getTime()).toBeGreaterThan(new Date().getTime());
      expect(todoData.finishBy.getTime()).toBeLessThan(todoData.deadline.getTime());
      expect(todoData.finishBy.getTime()).toBeGreaterThan(new Date().getTime());
      expect(todoData.tags.length).toBeGreaterThan(0);
      expect(todoData.tags.length).toBeLessThanOrEqual(3);
      expect(todoData.attachments.length).toBeLessThanOrEqual(3);
      expect(todoData.level).toBe(0);
    });
  });
}); 
