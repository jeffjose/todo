import { describe, it, expect } from 'vitest';
import {
  generateRandomTodoData,
  generateId,
  buildPath,
  PATH_SEPARATOR,
  ROOT_PATH,
  getNextBusinessDay,
  getRandomBusinessTime
} from './dexie';

describe('Utility Functions', () => {
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
  });

  describe('ID Generation', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      const id3 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1).not.toBe(id3);
      expect(id2).not.toBe(id3);
    });

    it('should generate IDs with correct format', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
      expect(/^[a-z0-9]+$/.test(id)).toBe(true); // Only lowercase letters and numbers
    });

    it('should generate IDs with sufficient entropy', () => {
      const ids = new Set();
      for (let i = 0; i < 1000; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(1000); // All IDs should be unique
    });
  });

  describe('Date and Time Functions', () => {
    it('should get next business day', () => {
      // Test with a Monday
      const monday = new Date('2024-03-18T00:00:00Z'); // Monday
      const nextDay = new Date('2024-03-19T00:00:00Z'); // Tuesday
      expect(getNextBusinessDay(monday).getTime()).toBe(nextDay.getTime());

      // Test with a Friday
      const friday = new Date('2024-03-22T00:00:00Z'); // Friday
      const nextMonday = new Date('2024-03-25T00:00:00Z'); // Monday
      const result = getNextBusinessDay(friday);
      expect(result.getTime()).toBe(nextMonday.getTime());

      // Test with a Saturday
      const saturday = new Date('2024-03-23T00:00:00Z'); // Saturday
      expect(getNextBusinessDay(saturday).getTime()).toBe(nextMonday.getTime());

      // Test with a Sunday
      const sunday = new Date('2024-03-24T00:00:00Z'); // Sunday
      expect(getNextBusinessDay(sunday).getTime()).toBe(nextMonday.getTime());
    });

    it('should get random business time', () => {
      const date = new Date('2024-03-18'); // Monday
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

  describe('Random Data Generation', () => {
    it('should generate random todo data', () => {
      // Use a fixed date for testing
      const now = new Date('2024-01-01T00:00:00Z');
      const todoData = generateRandomTodoData(now, new Date('2024-12-31T23:59:59Z'));

      // Check required fields
      expect(todoData.title).toBeDefined();
      expect(todoData.description).toBeDefined();
      expect(todoData.status).toBeDefined();
      expect(todoData.priority).toBeDefined();
      expect(todoData.urgency).toBeDefined();
      expect(todoData.deadline).toBeDefined();
      expect(todoData.finishBy).toBeDefined();
      expect(todoData.tags).toBeDefined();
      expect(todoData.attachments).toBeDefined();
      expect(todoData.comments).toBeDefined();
      expect(todoData.subtasks).toBeDefined();

      // Check business rules
      expect(todoData.deadline.getTime()).toBeGreaterThan(now.getTime());
      expect(todoData.finishBy.getTime()).toBeLessThan(todoData.deadline.getTime());
      expect(todoData.finishBy.getTime()).toBeGreaterThan(now.getTime());
      expect(todoData.tags.length).toBeGreaterThan(0);
      expect(todoData.tags.length).toBeLessThanOrEqual(3);
    });
  });
}); 
