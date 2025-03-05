import { drizzle } from 'drizzle-orm/pglite';
import { PGlite } from '@electric-sql/pglite';
import * as schema from './schema';

// Initialize PGLite in-memory (will use IndexedDB in browser)
const client = new PGlite();

// Create Drizzle database instance
export const db = drizzle({ client, schema });
