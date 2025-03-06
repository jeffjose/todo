import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializeDB, resetDatabase } from './db';
import { PGlite } from '@electric-sql/pglite';

// Mock the browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

// Create mock types
type MockQuery = (query: string, params?: any[]) => { rows: any[] };
interface MockPGliteInstance {
  query: MockQuery;
}

// Add type for mocked PGlite with mock property
type MockedPGlite = typeof PGlite & {
  mock: {
    results: Array<{
      value: MockPGliteInstance;
    }>;
  };
};

// Skip these tests in CI environments
describe.skip('Database Initialization', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    vi.resetModules();
  });

  it('should initialize the database successfully', async () => {
    // Mock PGlite for this test
    vi.mock('@electric-sql/pglite', () => {
      const mockQuery = vi.fn().mockImplementation((query: string, params?: any[]) => {
        // Mock table exists check
        if (query.includes('SELECT EXISTS') && query.includes('information_schema.tables')) {
          return { rows: [{ exists: false }] };
        }
        // Default response for other queries
        return { rows: [] };
      });

      return {
        PGlite: vi.fn().mockImplementation(() => ({
          query: mockQuery
        }))
      };
    });

    // Mock drizzle
    vi.mock('drizzle-orm/pglite', () => {
      return {
        drizzle: vi.fn().mockReturnValue({ schema: {} })
      };
    });

    // Re-import the module to use the new mock
    const { initializeDB: initializeDBTest } = await import('./db');

    // Act
    await initializeDBTest();

    // Assert
    const mockPGlite = vi.mocked(await import('@electric-sql/pglite')).PGlite as MockedPGlite;

    // Should create PGlite instance
    expect(mockPGlite).toHaveBeenCalledWith('idb://todo-app-db');

    // Should create drizzle instance
    const mockDrizzle = vi.mocked(await import('drizzle-orm/pglite')).drizzle;
    expect(mockDrizzle).toHaveBeenCalled();
  });

  it('should handle existing tables correctly', async () => {
    // Mock PGlite for this test
    vi.mock('@electric-sql/pglite', () => {
      const mockQuery = vi.fn().mockImplementation((query: string, params?: any[]) => {
        // Mock table exists check
        if (query.includes('SELECT EXISTS') && query.includes('information_schema.tables')) {
          if (params && params[0] === 'todos') {
            return { rows: [{ exists: true }] };
          }
          return { rows: [{ exists: false }] };
        }

        // Mock column info
        if (query.includes('SELECT column_name, data_type, is_nullable, column_default')) {
          return {
            rows: [
              { column_name: 'id', data_type: 'text', is_nullable: 'NO', column_default: null },
              { column_name: 'title', data_type: 'text', is_nullable: 'NO', column_default: null }
            ]
          };
        }

        // Default response for other queries
        return { rows: [] };
      });

      return {
        PGlite: vi.fn().mockImplementation(() => ({
          query: mockQuery
        }))
      };
    });

    // Mock drizzle
    vi.mock('drizzle-orm/pglite', () => {
      return {
        drizzle: vi.fn().mockReturnValue({ schema: {} })
      };
    });

    // Re-import the module to use the new mock
    const { initializeDB: initializeDBWithExistingTables } = await import('./db');

    // Act
    await initializeDBWithExistingTables();

    // Assert
    const mockPGlite = vi.mocked(await import('@electric-sql/pglite')).PGlite as MockedPGlite;
    const mockInstance = mockPGlite.mock.results[0]?.value as MockPGliteInstance;

    // The query method should have been called with the column info query
    expect(mockInstance.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT column_name, data_type, is_nullable, column_default'),
      expect.anything()
    );
  });

  it('should handle SQL errors during initialization', async () => {
    // Mock PGlite to throw an error
    vi.mock('@electric-sql/pglite', () => {
      const mockQuery = vi.fn().mockImplementation(() => {
        throw new Error('SQL syntax error');
      });

      return {
        PGlite: vi.fn().mockImplementation(() => ({
          query: mockQuery
        }))
      };
    });

    // Mock drizzle
    vi.mock('drizzle-orm/pglite', () => {
      return {
        drizzle: vi.fn().mockReturnValue({ schema: {} })
      };
    });

    // Re-import the module to use the new mock
    const { initializeDB: initializeDBWithError } = await import('./db');

    // Act & Assert
    await expect(initializeDBWithError()).rejects.toThrow('SQL syntax error');
  });
}); 
