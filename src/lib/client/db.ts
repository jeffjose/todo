import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';
import { browser } from '$app/environment';
import { users, type User } from './stores';

let db: ReturnType<typeof drizzle>;
let client: PGlite;
let initialized = false;
let initPromise: Promise<void> | null = null;

async function tableExists(tableName: string): Promise<boolean> {
  const result = await client.query(
    `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
        )`,
    [tableName]
  );
  return (result.rows[0] as { exists: boolean })?.exists ?? false;
}

export async function loadUsers() {
  if (!initialized || !client) return;
  const result = await client.query('SELECT id, username, age FROM "user" ORDER BY username');
  users.set(result.rows as User[]);
}

export async function initializeDB() {
  if (initPromise) return initPromise;

  console.log('initializeDB called, browser:', browser, 'initialized:', initialized);

  if (!browser) {
    console.log('Not in browser environment, skipping initialization');
    return;
  }

  if (initialized) {
    console.log('Database already initialized');
    return;
  }

  initPromise = (async () => {
    try {
      console.log('Starting IndexedDB initialization...');
      client = new PGlite('idb://todo-app-db');
      console.log('PGLite client created');

      db = drizzle({ client, schema });
      console.log('Drizzle instance created');

      // Check and create user table
      const userTableExists = await tableExists('user');
      console.log('User table exists:', userTableExists);

      if (!userTableExists) {
        console.log('Creating user table...');
        await client.query(`
                CREATE TABLE IF NOT EXISTS "user" (
                    "id" text PRIMARY KEY,
                    "age" integer,
                    "username" text NOT NULL UNIQUE,
                    "password_hash" text NOT NULL
                )
            `);
        console.log('User table created');
      }

      // Check and create session table
      const sessionTableExists = await tableExists('session');
      console.log('Session table exists:', sessionTableExists);

      if (!sessionTableExists) {
        console.log('Creating session table...');
        await client.query(`
                CREATE TABLE IF NOT EXISTS "session" (
                    "id" text PRIMARY KEY,
                    "user_id" text NOT NULL REFERENCES "user"("id"),
                    "expires_at" timestamptz NOT NULL
                )
            `);
        console.log('Session table created');
      }

      initialized = true;
      console.log('IndexedDB initialized successfully');

      // List all tables
      const tables = await client.query(`
                SELECT table_name, (
                    SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_name = t.table_name
                ) as column_count
                FROM information_schema.tables t
                WHERE table_schema = 'public'
            `);
      console.log('Available tables:', tables.rows);

      // Load initial users
      await loadUsers();

    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      throw error;
    }
  })();

  return initPromise;
}

export function getClientDB() {
  if (!initialized) {
    throw new Error('Database not initialized. Call initializeDB() first');
  }
  return { query: client.query.bind(client) };
}

// Test function to verify data persistence
export async function testDataPersistence() {
  if (!initialized || !client) {
    throw new Error('Database not initialized');
  }

  try {
    // Insert a test user
    const testId = `test-${Date.now()}`;

    await client.query(
      `INSERT INTO "user" (id, username, age, password_hash) 
             VALUES ($1, $2, $3, $4)`,
      [testId, `test-user-${Date.now()}`, 25, 'test-hash']
    );

    // Reload users to update the UI
    await loadUsers();

    return {
      success: true,
      message: `Test user inserted successfully`
    };
  } catch (error) {
    console.error('Error in persistence test:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 
