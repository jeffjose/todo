import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';
import { browser } from '$app/environment';

let db: ReturnType<typeof drizzle>;
let initialized = false;

export async function initializeDB() {
  if (!browser || initialized) return;

  try {
    const client = new PGlite();
    db = drizzle({ client, schema });

    // Initialize tables
    await client.query(`
            CREATE TABLE IF NOT EXISTS "user" (
                "id" text PRIMARY KEY,
                "age" integer,
                "username" text NOT NULL UNIQUE,
                "password_hash" text NOT NULL
            );

            CREATE TABLE IF NOT EXISTS "session" (
                "id" text PRIMARY KEY,
                "user_id" text NOT NULL REFERENCES "user"("id"),
                "expires_at" timestamptz NOT NULL
            );
        `);

    initialized = true;
    console.log('IndexedDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

export function getClientDB() {
  if (!initialized) {
    throw new Error('Database not initialized. Call initializeDB() first');
  }
  return db;
} 
