import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  initializeDB,
  createTodo,
  getTodo,
  getAllTodos,
  updateTodo,
  deleteTodo,
  clearAllTodos,
  createRandomTodo,
  createMultipleRandomTodos,
  getTodosByStatus,
  getTodosByPriority,
  getTodosByUrgency,
  getTodosByPath,
  getTodosByParentId,
  getTodosByTag,
  getTodosByDateRange,
  createKnownEvent,
  getKnownEvent,
  updateKnownEvent,
  deleteKnownEvent,
  getAllKnownEvents,
  getKnownEventsByDateRange,
  generateRandomTodoData,
  getDB,
  generateId,
  buildPath,
  PATH_SEPARATOR,
  ROOT_PATH
} from './dexie';

// Mock the browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

// Mock the environment module
vi.mock('$env/dynamic/public', () => ({
  env: {
    PUBLIC_TODO_TABLE_NAME: 'todos'
  }
}));

describe('Dexie Database Operations', () => {
  beforeEach(async () => {
    await initializeDB();
  });

  afterEach(async () => {
    await clearAllTodos();
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

  describe('Database Initialization', () => {
    it('should initialize the database without errors', async () => {
      await expect(initializeDB()).resolves.not.toThrow();
    });

    it('should be idempotent (can be called multiple times)', async () => {
      // First initialization
      await initializeDB();

      // Second initialization should not throw
      await expect(initializeDB()).resolves.not.toThrow();
    });

    it('should return the same database instance', async () => {
      // First initialization
      const db1 = await getDB();

      // Second initialization
      const db2 = await getDB();

      // Should be the same instance
      expect(db1).toBe(db2);
    });

    it('should handle database reset', async () => {
      // First, make sure the database is initialized
      await initializeDB();

      // Create some test data
      await createTodo({
        title: 'Test Todo',
        status: 'pending',
        priority: 'P3',
        urgency: 'medium',
        path: 'root',
        level: 0,
        tags: ['test']
      });

      // Then reset it
      const result = await clearAllTodos();
      expect(result).toBeDefined();
      expect(typeof result.message).toBe('string');

      // Should be able to initialize again after reset
      await expect(initializeDB()).resolves.not.toThrow();

      // Database should be empty
      const todos = await getAllTodos();
      expect(todos).toHaveLength(0);
    });
  });

  describe('Helper Functions', () => {
    it('should get next business day', () => {
      // Test with a Monday
      const monday = new Date('2024-03-18'); // Monday
      const nextDay = new Date('2024-03-19'); // Tuesday
      expect(getNextBusinessDay(monday).toDateString()).toBe(nextDay.toDateString());

      // Test with a Friday
      const friday = new Date('2024-03-22'); // Friday
      const nextMonday = new Date('2024-03-25'); // Monday
      expect(getNextBusinessDay(friday).toDateString()).toBe(nextMonday.toDateString());

      // Test with a Saturday
      const saturday = new Date('2024-03-23'); // Saturday
      const nextMonday2 = new Date('2024-03-25'); // Monday
      expect(getNextBusinessDay(saturday).toDateString()).toBe(nextMonday2.toDateString());

      // Test with a Sunday
      const sunday = new Date('2024-03-24'); // Sunday
      const nextMonday3 = new Date('2024-03-25'); // Monday
      expect(getNextBusinessDay(sunday).toDateString()).toBe(nextMonday3.toDateString());
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

    it('should generate random todo data', () => {
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

  describe('CRUD Operations', () => {
    it('should create and retrieve a todo', async () => {
      const todo = await createTodo({
        title: 'Test Todo',
        status: 'pending',
        priority: 'P3',
        urgency: 'medium',
        path: 'root',
        level: 0,
        tags: ['test']
      });

      const retrieved = await getTodo(todo.id);
      expect(retrieved).toEqual(todo);
    });

    it('should update a todo', async () => {
      const todo = await createTodo({
        title: 'Test Todo',
        status: 'pending',
        priority: 'P3',
        urgency: 'medium',
        path: 'root',
        level: 0,
        tags: ['test']
      });

      const updated = await updateTodo(todo.id, { status: 'completed' });
      expect(updated?.status).toBe('completed');
    });

    it('should delete a todo', async () => {
      const todo = await createTodo({
        title: 'Test Todo',
        status: 'pending',
        priority: 'P3',
        urgency: 'medium',
        path: 'root',
        level: 0,
        tags: ['test']
      });

      await deleteTodo(todo.id);
      const retrieved = await getTodo(todo.id);
      expect(retrieved).toBeUndefined();
    });

    it('should get all todos', async () => {
      const todo1 = await createTodo({
        title: 'Test Todo 1',
        status: 'pending',
        priority: 'P3',
        urgency: 'medium',
        path: 'root',
        level: 0,
        tags: ['test']
      });

      const todo2 = await createTodo({
        title: 'Test Todo 2',
        status: 'completed',
        priority: 'P2',
        urgency: 'high',
        path: 'root',
        level: 0,
        tags: ['test']
      });

      const todos = await getAllTodos();
      expect(todos).toHaveLength(2);
      expect(todos).toContainEqual(todo1);
      expect(todos).toContainEqual(todo2);
    });
  });

  describe('Random Todo Generation', () => {
    it('should create a random todo', async () => {
      const todo = await createRandomTodo();
      expect(todo).toBeDefined();
      expect(todo.title).toBeDefined();
      expect(todo.status).toBeDefined();
      expect(todo.priority).toBeDefined();
      expect(todo.urgency).toBeDefined();
    });

    it('should create multiple random todos', async () => {
      const count = 5;
      const todos = await createMultipleRandomTodos(count);
      expect(todos).toHaveLength(count);
      todos.forEach(todo => {
        expect(todo).toBeDefined();
        expect(todo.title).toBeDefined();
        expect(todo.status).toBeDefined();
        expect(todo.priority).toBeDefined();
        expect(todo.urgency).toBeDefined();
      });
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      // Create test todos with different attributes
      await createTodo({
        title: 'Test Todo 1',
        status: 'pending',
        priority: 'P3',
        urgency: 'medium',
        path: 'root',
        level: 0,
        tags: ['test']
      });

      await createTodo({
        title: 'Test Todo 2',
        status: 'completed',
        priority: 'P2',
        urgency: 'high',
        path: 'subfolder',
        level: 1,
        tags: ['test', 'important']
      });
    });

    it('should get todos by status', async () => {
      const pendingTodos = await getTodosByStatus('pending');
      expect(pendingTodos).toHaveLength(1);
      expect(pendingTodos[0].status).toBe('pending');
    });

    it('should get todos by priority', async () => {
      const p2Todos = await getTodosByPriority('P2');
      expect(p2Todos).toHaveLength(1);
      expect(p2Todos[0].priority).toBe('P2');
    });

    it('should get todos by urgency', async () => {
      const highUrgencyTodos = await getTodosByUrgency('high');
      expect(highUrgencyTodos).toHaveLength(1);
      expect(highUrgencyTodos[0].urgency).toBe('high');
    });

    it('should get todos by path', async () => {
      const subfolderTodos = await getTodosByPath('subfolder');
      expect(subfolderTodos).toHaveLength(1);
      expect(subfolderTodos[0].path).toBe('subfolder');
    });

    it('should get todos by parent ID', async () => {
      // Create a parent todo
      const parentTodo = await createTodo({
        title: 'Parent Todo',
        status: 'pending',
        priority: 'P3',
        urgency: 'medium',
        path: 'root',
        level: 0,
        tags: ['test']
      });

      // Create a child todo
      await createTodo({
        title: 'Child Todo',
        status: 'pending',
        priority: 'P3',
        urgency: 'medium',
        path: 'root',
        level: 1,
        parentId: parentTodo.id,
        tags: ['test']
      });

      const childTodos = await getTodosByParentId(parentTodo.id);
      expect(childTodos).toHaveLength(1);
      expect(childTodos[0].parentId).toBe(parentTodo.id);
    });

    it('should get todos by tag', async () => {
      const importantTodos = await getTodosByTag('important');
      expect(importantTodos).toHaveLength(1);
      expect(importantTodos[0].tags).toContain('important');
    });

    it('should get todos by date range', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const todo = await createTodo({
        title: 'Test Todo 3',
        status: 'pending',
        priority: 'P3',
        urgency: 'medium',
        path: 'root',
        level: 0,
        tags: ['test'],
        deadline: tomorrow
      });

      const todos = await getTodosByDateRange(now, nextWeek);
      expect(todos).toHaveLength(1);
      expect(todos[0].id).toBe(todo.id);
    });
  });

  describe('Known Events Operations', () => {
    beforeEach(async () => {
      // Create test events with different dates
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await createKnownEvent({
        startDate: now,
        endDate: tomorrow,
        description: 'Test Event 1'
      });

      await createKnownEvent({
        startDate: tomorrow,
        endDate: nextWeek,
        description: 'Test Event 2'
      });
    });

    it('should create and retrieve a known event', async () => {
      const event = await createKnownEvent({
        startDate: new Date(),
        endDate: new Date(),
        description: 'Test Event'
      });

      const retrieved = await getKnownEvent(event.id);
      expect(retrieved).toEqual(event);
    });

    it('should update a known event', async () => {
      const event = await createKnownEvent({
        startDate: new Date(),
        endDate: new Date(),
        description: 'Test Event'
      });

      const updated = await updateKnownEvent(event.id, { description: 'Updated Event' });
      expect(updated?.description).toBe('Updated Event');
    });

    it('should delete a known event', async () => {
      const event = await createKnownEvent({
        startDate: new Date(),
        endDate: new Date(),
        description: 'Test Event'
      });

      await deleteKnownEvent(event.id);
      const retrieved = await getKnownEvent(event.id);
      expect(retrieved).toBeUndefined();
    });

    it('should get all known events', async () => {
      const events = await getAllKnownEvents();
      expect(events).toHaveLength(2);
    });

    it('should get known events by date range', async () => {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const events = await getKnownEventsByDateRange(now, nextWeek);
      expect(events).toHaveLength(2);
      expect(events[0].description).toBe('Test Event 1');
      expect(events[1].description).toBe('Test Event 2');
    });
  });
}); 
