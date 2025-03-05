import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';
import { browser } from '$app/environment';

export interface User {
  id: string;
  username: string;
  age: number;
}

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

export async function loadUsers(): Promise<User[]> {
  if (!initialized || !client) return [];
  const result = await client.query('SELECT id, username, age FROM "user" ORDER BY id DESC');
  return result.rows as User[];
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
    // Generate random user data
    const testId = `test-${Date.now()}`;
    const firstNames = ['emma', 'liam', 'olivia', 'noah', 'ava', 'ethan', 'sophia', 'mason', 'isabella', 'lucas', 'mia', 'james'];
    const lastNames = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis', 'rodriguez', 'martinez'];
    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const randomAge = Math.floor(Math.random() * 50) + 18; // Random age between 18 and 67

    const username = `${randomFirstName}-${randomLastName}-${randomNumber}`;

    await client.query(
      `INSERT INTO "user" (id, username, age, password_hash) 
             VALUES ($1, $2, $3, $4)`,
      [testId, username, randomAge, 'test-hash']
    );

    return {
      success: true,
      message: `Test user ${username} inserted successfully`
    };
  } catch (error) {
    console.error('Error in persistence test:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 
