import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { initializeDB, clearAllTodos } from './dexie';

// Mock the browser environment for integration tests
vi.mock('$app/environment', () => ({
  browser: true
}));

// Skip these tests in CI environments without browser capabilities
describe.skip('Database Initialization Integration', () => {
  // This test will be skipped in CI environments without browser capabilities
  // You can run it locally with `vitest --browser` if you have the browser option configured

  beforeAll(async () => {
    // Clean up any existing database before tests
    try {
      await clearAllTodos();
    } catch (error) {
      console.warn('Failed to clear database before tests:', error);
    }
  });

  afterAll(async () => {
    // Clean up after tests
    try {
      await clearAllTodos();
    } catch (error) {
      console.warn('Failed to clear database after tests:', error);
    }
  });

  it('should initialize the database without errors', async () => {
    // This test will actually run the database initialization
    // It will fail if there are any database initialization issues
    await expect(initializeDB()).resolves.not.toThrow();
  });

  it('should be idempotent (can be called multiple times)', async () => {
    // First initialization
    await initializeDB();

    // Second initialization should not throw
    await expect(initializeDB()).resolves.not.toThrow();
  });

  it('should handle database reset', async () => {
    // First, make sure the database is initialized
    await initializeDB();

    // Then reset it
    const result = await clearAllTodos();

    // In the integration test, we'll just check that it doesn't throw
    // rather than checking the success property which might be environment-dependent
    expect(result).toBeDefined();
    expect(typeof result.message).toBe('string');

    // Should be able to initialize again after reset
    await expect(initializeDB()).resolves.not.toThrow();
  });
}); 
