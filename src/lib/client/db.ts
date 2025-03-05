import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  status: string;
  tags: string[];
  attachments: { name: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
}

let db: ReturnType<typeof drizzle>;
let client: PGlite;
let initialized = false;
let initPromise: Promise<void> | null = null;

// Get table name from environment variable or use default
const todoTableName = env.TODO_TABLE_NAME || 'todos';

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

export async function loadTodos(): Promise<Todo[]> {
  if (!initialized || !client) return [];
  const result = await client.query(`SELECT * FROM "${todoTableName}" ORDER BY "created_at" DESC`);
  return result.rows as Todo[];
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

      // Check and create todos table
      const todosTableExists = await tableExists(todoTableName);
      console.log('Todos table exists:', todosTableExists);

      if (!todosTableExists) {
        console.log(`Creating ${todoTableName} table...`);
        await client.query(`
          CREATE TABLE IF NOT EXISTS "${todoTableName}" (
            "id" text PRIMARY KEY,
            "title" text NOT NULL,
            "description" text,
            "deadline" timestamptz,
            "status" text NOT NULL DEFAULT 'pending',
            "tags" json DEFAULT '[]',
            "attachments" json DEFAULT '[]',
            "created_at" timestamptz NOT NULL DEFAULT NOW(),
            "updated_at" timestamptz NOT NULL DEFAULT NOW()
          )
        `);
        console.log(`${todoTableName} table created`);
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

// Function to add a new todo item
export async function addNewTodo() {
  if (!initialized || !client) {
    throw new Error('Database not initialized');
  }

  try {
    // Generate random todo data
    const todoId = `todo-${Date.now()}`;

    // Random title options
    const todoTitles = [
      'Complete project proposal',
      'Review documentation',
      'Prepare presentation',
      'Schedule meeting',
      'Research new technologies',
      'Fix bugs in application',
      'Update dependencies',
      'Create user documentation',
      'Design new feature',
      'Implement feedback changes'
    ];

    // Random status options
    const statusOptions = ['pending', 'in-progress', 'completed', 'blocked'];

    // Random tag options
    const tagOptions = ['work', 'personal', 'urgent', 'low-priority', 'bug', 'feature', 'documentation', 'meeting', 'research', 'design'];

    // Generate random data
    const title = todoTitles[Math.floor(Math.random() * todoTitles.length)];
    const description = `This is a randomly generated todo item for ${title.toLowerCase()}.`;

    // Random deadline between today and 14 days from now
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 14);
    const deadline = new Date(today.getTime() + Math.random() * (futureDate.getTime() - today.getTime()));

    // Random status
    const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

    // Random tags (1-3 tags)
    const numTags = Math.floor(Math.random() * 3) + 1;
    const tags = [];
    for (let i = 0; i < numTags; i++) {
      const randomTag = tagOptions[Math.floor(Math.random() * tagOptions.length)];
      if (!tags.includes(randomTag)) {
        tags.push(randomTag);
      }
    }

    // Random attachments (0-2 attachments)
    const numAttachments = Math.floor(Math.random() * 3);
    const attachments = [];
    for (let i = 0; i < numAttachments; i++) {
      attachments.push({
        name: `attachment-${i + 1}.${['pdf', 'doc', 'jpg'][Math.floor(Math.random() * 3)]}`,
        url: `https://example.com/attachments/${todoId}/${i + 1}`
      });
    }

    await client.query(
      `INSERT INTO "${todoTableName}" (id, title, description, deadline, status, tags, attachments, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
      [todoId, title, description, deadline.toISOString(), status, JSON.stringify(tags), JSON.stringify(attachments)]
    );

    return {
      success: true,
      message: `New todo "${title}" added successfully`
    };
  } catch (error) {
    console.error('Error adding new todo:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to add multiple todo items at once
export async function addMultipleTodos(count: number): Promise<{ success: boolean; message: string }> {
  if (!initialized || !client) {
    throw new Error('Database not initialized');
  }

  try {
    const startTime = Date.now();
    let successCount = 0;

    // Random data options
    const todoTitles = [
      'Complete project proposal',
      'Review documentation',
      'Prepare presentation',
      'Schedule meeting',
      'Research new technologies',
      'Fix bugs in application',
      'Update dependencies',
      'Create user documentation',
      'Design new feature',
      'Implement feedback changes'
    ];

    const statusOptions = ['pending', 'in-progress', 'completed', 'blocked'];
    const tagOptions = ['work', 'personal', 'urgent', 'low-priority', 'bug', 'feature', 'documentation', 'meeting', 'research', 'design'];

    // Batch insert for better performance
    const batchSize = 50;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const batchCount = Math.min(batchSize, count - (batch * batchSize));
      const values = [];
      const placeholders = [];
      const params = [];

      for (let i = 0; i < batchCount; i++) {
        const todoId = `todo-${Date.now()}-${batch * batchSize + i}`;

        // Generate random data
        const title = todoTitles[Math.floor(Math.random() * todoTitles.length)];
        const description = `This is a randomly generated todo item for ${title.toLowerCase()}.`;

        // Random deadline between today and 14 days from now
        const today = new Date();
        const futureDate = new Date();
        futureDate.setDate(today.getDate() + 14);
        const deadline = new Date(today.getTime() + Math.random() * (futureDate.getTime() - today.getTime()));

        // Random status
        const status = statusOptions[Math.floor(Math.random() * statusOptions.length)];

        // Random tags (1-3 tags)
        const numTags = Math.floor(Math.random() * 3) + 1;
        const tags = [];
        for (let j = 0; j < numTags; j++) {
          const randomTag = tagOptions[Math.floor(Math.random() * tagOptions.length)];
          if (!tags.includes(randomTag)) {
            tags.push(randomTag);
          }
        }

        // Random attachments (0-2 attachments)
        const numAttachments = Math.floor(Math.random() * 3);
        const attachments = [];
        for (let j = 0; j < numAttachments; j++) {
          attachments.push({
            name: `attachment-${j + 1}.${['pdf', 'doc', 'jpg'][Math.floor(Math.random() * 3)]}`,
            url: `https://example.com/attachments/${todoId}/${j + 1}`
          });
        }

        // Add to batch
        placeholders.push(`($${params.length + 1}, $${params.length + 2}, $${params.length + 3}, $${params.length + 4}, $${params.length + 5}, $${params.length + 6}, $${params.length + 7}, NOW(), NOW())`);
        params.push(todoId, title, description, deadline.toISOString(), status, JSON.stringify(tags), JSON.stringify(attachments));
      }

      // Execute batch insert
      if (placeholders.length > 0) {
        const query = `
          INSERT INTO "${todoTableName}" (id, title, description, deadline, status, tags, attachments, created_at, updated_at) 
          VALUES ${placeholders.join(', ')}
        `;

        await client.query(query, params);
        successCount += batchCount;
      }
    }

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds

    return {
      success: true,
      message: `Added ${successCount} todo items in ${duration.toFixed(2)} seconds`
    };
  } catch (error) {
    console.error('Error adding multiple todos:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Function to clear all todos
export async function clearAllTodos(): Promise<{ success: boolean; message: string }> {
  if (!initialized || !client) {
    throw new Error('Database not initialized');
  }

  try {
    const startTime = Date.now();

    // Get the count before deletion
    const countResult = await client.query(`SELECT COUNT(*) FROM "${todoTableName}"`);
    const count = parseInt((countResult.rows[0] as { count: string }).count, 10);

    // Delete all records
    await client.query(`DELETE FROM "${todoTableName}"`);

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // in seconds

    return {
      success: true,
      message: `Cleared ${count} todo items in ${duration.toFixed(2)} seconds`
    };
  } catch (error) {
    console.error('Error clearing todos:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 
