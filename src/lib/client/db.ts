import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from './schema';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { customAlphabet } from 'nanoid';

// Custom alphabet for nanoid - using only lowercase letters and numbers, excluding confusing characters
const CUSTOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const generateId = customAlphabet(CUSTOM_ALPHABET);

// Types
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  status: string;
  priority: string;
  urgency: string;
  tags: string[];
  attachments: { name: string; url: string }[];
  path: string;
  level: number;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ColumnDefinition = {
  type: string;
  nullable: boolean;
  defaultValue?: string;
  primaryKey?: boolean;
};

type SchemaDefinition = {
  [key: string]: ColumnDefinition;
};

type ColumnInfo = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
};

type TodoRow = {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: string;
  priority: string;
  urgency: string;
  tags: string[];
  attachments: { name: string; url: string }[];
  path: string;
  level: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
};

// Database schema definition
const DESIRED_SCHEMA: SchemaDefinition = {
  id: { type: 'text', primaryKey: true, nullable: false },
  title: { type: 'text', nullable: false },
  description: { type: 'text', nullable: true },
  deadline: { type: 'timestamptz', nullable: true },
  status: { type: 'text', nullable: false, defaultValue: 'pending' },
  priority: { type: 'text', nullable: false, defaultValue: 'P3' },
  urgency: { type: 'text', nullable: false, defaultValue: 'medium' },
  tags: { type: 'json', nullable: false, defaultValue: '[]' },
  attachments: { type: 'json', nullable: false, defaultValue: '[]' },
  path: { type: 'text', nullable: false, defaultValue: 'root' },
  level: { type: 'integer', nullable: false, defaultValue: '0' },
  parent_id: { type: 'text', nullable: true },
  created_at: { type: 'timestamptz', nullable: false },
  updated_at: { type: 'timestamptz', nullable: false }
};

// Helper functions for path management
const PATH_SEPARATOR = '.';
const ROOT_PATH = 'root';

function buildPath(parentPath: string | null, id: string): string {
  return parentPath ? `${parentPath}${PATH_SEPARATOR}${id}` : ROOT_PATH;
}

function getLevel(path: string): number {
  return path === ROOT_PATH ? 0 : path.split(PATH_SEPARATOR).length - 1;
}

function getParentPath(path: string): string | null {
  if (path === ROOT_PATH) return null;
  const parts = path.split(PATH_SEPARATOR);
  parts.pop();
  return parts.join(PATH_SEPARATOR);
}

function getParentId(path: string): string | null {
  if (path === ROOT_PATH) return null;
  const parts = path.split(PATH_SEPARATOR);
  return parts[parts.length - 2] || null;
}

// Random data options
const RANDOM_DATA = {
  titles: [
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
  ],
  statuses: ['pending', 'in-progress', 'completed', 'blocked'],
  priorities: ['P0', 'P1', 'P2', 'P3'],
  urgencies: ['high', 'medium', 'low'],
  tags: ['work', 'personal', 'urgent', 'low-priority', 'bug', 'feature', 'documentation', 'meeting', 'research', 'design']
};

class DatabaseClient {
  private client: PGlite | null = null;
  private db: ReturnType<typeof drizzle> | null = null;
  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private readonly tableName: string;

  constructor(tableName: string = env.PUBLIC_TODO_TABLE_NAME || 'todos') {
    this.tableName = tableName;
  }

  private async tableExists(): Promise<boolean> {
    if (!this.client) throw new Error('Database not initialized');
    const result = await this.client.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [this.tableName]
    );
    return (result.rows[0] as { exists: boolean })?.exists ?? false;
  }

  private async addColumn(column: string, def: ColumnDefinition): Promise<void> {
    if (!this.client) throw new Error('Database not initialized');

    // Add column as nullable
    await this.client.query(`
      ALTER TABLE "${this.tableName}"
      ADD COLUMN "${column}" ${def.type}
    `);

    // Set default value if specified
    if (def.defaultValue) {
      const defaultValue = def.type === 'json' ? `'${def.defaultValue}'` : `'${def.defaultValue}'`;
      await this.client.query(`
        UPDATE "${this.tableName}"
        SET "${column}" = ${defaultValue}
        WHERE "${column}" IS NULL
      `);
    }

    // Make column non-nullable if specified
    if (!def.nullable && column !== 'created_at' && column !== 'updated_at') {
      await this.client.query(`
        ALTER TABLE "${this.tableName}"
        ALTER COLUMN "${column}" SET NOT NULL
      `);
    }
  }

  private async updateColumn(column: string, def: ColumnDefinition): Promise<void> {
    if (!this.client) throw new Error('Database not initialized');

    // Drop and recreate column
    await this.client.query(`
      ALTER TABLE "${this.tableName}"
      DROP COLUMN "${column}"
    `);

    await this.addColumn(column, def);
  }

  private async handleTimestampColumns(): Promise<void> {
    if (!this.client) throw new Error('Database not initialized');

    const now = new Date().toISOString();

    // Update existing rows
    await this.client.query(`
      UPDATE "${this.tableName}"
      SET "created_at" = $1,
          "updated_at" = $1
      WHERE "created_at" IS NULL OR "updated_at" IS NULL
    `, [now]);

    // Make columns non-nullable
    await this.client.query(`
      ALTER TABLE "${this.tableName}"
      ALTER COLUMN "created_at" SET NOT NULL,
      ALTER COLUMN "updated_at" SET NOT NULL
    `);
  }

  private async updateDataDefaults(): Promise<void> {
    if (!this.client) throw new Error('Database not initialized');

    // Update priority values
    await this.client.query(`
      UPDATE "${this.tableName}"
      SET "priority" = 'P3'
      WHERE "priority" NOT IN ('P0', 'P1', 'P2', 'P3')
    `);

    // Update urgency values
    await this.client.query(`
      UPDATE "${this.tableName}"
      SET "urgency" = 'medium'
      WHERE "urgency" NOT IN ('high', 'medium', 'low')
    `);

    // Update status values
    await this.client.query(`
      UPDATE "${this.tableName}"
      SET "status" = 'pending'
      WHERE "status" NOT IN ('pending', 'in-progress', 'completed', 'blocked')
    `);

    // Update JSON columns
    await this.client.query(`
      UPDATE "${this.tableName}"
      SET "tags" = '[]'::json
      WHERE "tags" IS NULL
    `);

    await this.client.query(`
      UPDATE "${this.tableName}"
      SET "attachments" = '[]'::json
      WHERE "attachments" IS NULL
    `);
  }

  private async updateDescendantPaths(oldPath: string, newPath: string): Promise<void> {
    if (!this.client) throw new Error('Database not initialized');

    // Update paths of all descendants
    await this.client.query(`
      UPDATE "${this.tableName}"
      SET path = $1 || SUBSTRING(path FROM LENGTH($2) + 1),
          level = LENGTH(path) - LENGTH(REPLACE(path, '.', ''))
      WHERE path LIKE $2 || '.%'
    `, [newPath, oldPath]);
  }

  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    if (!browser) {
      console.log('Not in browser environment, skipping initialization');
      return;
    }
    if (this.initialized) {
      console.log('Database already initialized');
      return;
    }

    this.initPromise = (async () => {
      try {
        console.log('Starting IndexedDB initialization...');
        this.client = new PGlite('idb://todo-app-db');
        this.db = drizzle({ client: this.client, schema });
        console.log('Database client created');

        const tableExists = await this.tableExists();
        console.log('Table exists:', tableExists);

        if (!tableExists) {
          // Create new table
          const createTableSQL = `
            CREATE TABLE IF NOT EXISTS "${this.tableName}" (
              ${Object.entries(DESIRED_SCHEMA)
              .map(([column, def]) => {
                const nullable = def.nullable ? '' : ' NOT NULL';
                const defaultValue = def.defaultValue ? ` DEFAULT ${def.defaultValue}` : '';
                const primaryKey = def.primaryKey ? ' PRIMARY KEY' : '';
                return `"${column}" ${def.type}${nullable}${defaultValue}${primaryKey}`;
              })
              .join(',\n              ')}
            )
          `;
          await this.client.query(createTableSQL);
          console.log('Table created');
        } else {
          // Get current structure
          const currentColumns = await this.client.query<ColumnInfo>(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [this.tableName]);

          const currentColumnNames = new Set(currentColumns.rows.map(row => row.column_name));

          // Add missing columns
          for (const [column, def] of Object.entries(DESIRED_SCHEMA)) {
            if (!currentColumnNames.has(column)) {
              await this.addColumn(column, def);
            }
          }

          // Update existing columns
          for (const [column, def] of Object.entries(DESIRED_SCHEMA)) {
            if (currentColumnNames.has(column)) {
              const currentCol = currentColumns.rows.find(row => row.column_name === column);
              if (currentCol) {
                const needsUpdate =
                  currentCol.data_type !== def.type ||
                  (currentCol.is_nullable === 'YES' && !def.nullable);

                if (needsUpdate) {
                  await this.updateColumn(column, def);
                }
              }
            }
          }

          // Handle timestamps and defaults
          await this.handleTimestampColumns();
          await this.updateDataDefaults();
        }

        this.initialized = true;
        console.log('Database initialized successfully');

      } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  async loadTodos(): Promise<Todo[]> {
    if (!this.initialized || !this.client) return [];

    const result = await this.client.query<TodoRow>(`
      SELECT 
        "id", "title", "description", "deadline", "status", "priority", "urgency", 
        "tags", "attachments", "path", "level", "parent_id", "created_at", "updated_at"
      FROM "${this.tableName}" 
      ORDER BY "created_at" DESC
    `);

    const todos = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      deadline: row.deadline ? new Date(row.deadline) : null,
      status: row.status,
      priority: row.priority,
      urgency: row.urgency,
      tags: row.tags,
      attachments: row.attachments,
      path: row.path,
      level: row.level,
      parentId: row.parent_id,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));

    // Debug logging
    console.log('Todos loaded from DB:', todos.map(t => ({
      id: t.id,
      title: t.title,
      createdAt: new Date(t.createdAt).toISOString(),
      path: t.path
    })));

    return todos;
  }

  async addNewTodo(parentId: string | null = null): Promise<{ success: boolean; message: string }> {
    if (!this.initialized || !this.client) {
      throw new Error('Database not initialized');
    }

    try {
      const todoId = generateId();
      const now = new Date().toISOString();

      // Get parent path if parentId is provided
      let parentPath = ROOT_PATH;
      if (parentId) {
        const parentResult = await this.client.query<{ path: string }>(
          `SELECT path FROM "${this.tableName}" WHERE id = $1`,
          [parentId]
        );
        if (parentResult.rows.length > 0) {
          parentPath = parentResult.rows[0].path;
        }
      }

      const path = buildPath(parentPath, todoId);
      const level = getLevel(path);
      const title = RANDOM_DATA.titles[Math.floor(Math.random() * RANDOM_DATA.titles.length)];
      const description = `This is a randomly generated todo item for ${title.toLowerCase()}.`;

      // Generate random data
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + 14);
      const deadline = new Date(today.getTime() + Math.random() * (futureDate.getTime() - today.getTime()));

      const status = RANDOM_DATA.statuses[Math.floor(Math.random() * RANDOM_DATA.statuses.length)];
      const priority = RANDOM_DATA.priorities[Math.floor(Math.random() * RANDOM_DATA.priorities.length)];
      const urgency = RANDOM_DATA.urgencies[Math.floor(Math.random() * RANDOM_DATA.urgencies.length)];

      // Generate random tags
      const numTags = Math.floor(Math.random() * 3) + 1;
      const tags: string[] = [];
      for (let i = 0; i < numTags; i++) {
        const randomTag = RANDOM_DATA.tags[Math.floor(Math.random() * RANDOM_DATA.tags.length)];
        if (!tags.includes(randomTag)) {
          tags.push(randomTag);
        }
      }

      // Generate random attachments
      const numAttachments = Math.floor(Math.random() * 3);
      const attachments = Array.from({ length: numAttachments }, (_, i) => ({
        name: `attachment-${i + 1}.${['pdf', 'doc', 'jpg'][Math.floor(Math.random() * 3)]}`,
        url: `https://example.com/attachments/${todoId}/${i + 1}`
      }));

      await this.client.query(
        `INSERT INTO "${this.tableName}" (
          "id", "title", "description", "deadline", "status", "priority", "urgency", 
          "tags", "attachments", "path", "level", "parent_id", "created_at", "updated_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)`,
        [
          todoId, title, description, deadline.toISOString(), status, priority, urgency,
          JSON.stringify(tags), JSON.stringify(attachments), path, level, parentId, now
        ]
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

  async addMultipleTodos(count: number, parentId: string | null = null): Promise<{ success: boolean; message: string }> {
    if (!this.initialized || !this.client) {
      throw new Error('Database not initialized');
    }

    try {
      const batchSize = count > 1000 ? 200 : (count > 500 ? 150 : (count > 100 ? 100 : 50));
      const batches = Math.ceil(count / batchSize);
      let successCount = 0;

      // Get parent path if parentId is provided
      let parentPath = ROOT_PATH;
      if (parentId) {
        const parentResult = await this.client.query<{ path: string }>(
          `SELECT path FROM "${this.tableName}" WHERE id = $1`,
          [parentId]
        );
        if (parentResult.rows.length > 0) {
          parentPath = parentResult.rows[0].path;
        }
      }

      for (let batch = 0; batch < batches; batch++) {
        const batchCount = Math.min(batchSize, count - (batch * batchSize));
        const placeholders = [];
        const params = [];

        for (let i = 0; i < batchCount; i++) {
          const todoId = generateId();
          const path = buildPath(parentPath, todoId);
          const level = getLevel(path);
          const title = RANDOM_DATA.titles[Math.floor(Math.random() * RANDOM_DATA.titles.length)];
          const description = `This is a randomly generated todo item for ${title.toLowerCase()}.`;

          // Generate random data
          const today = new Date();
          const futureDate = new Date();
          futureDate.setDate(today.getDate() + 14);
          const deadline = new Date(today.getTime() + Math.random() * (futureDate.getTime() - today.getTime()));

          const status = RANDOM_DATA.statuses[Math.floor(Math.random() * RANDOM_DATA.statuses.length)];
          const priority = RANDOM_DATA.priorities[Math.floor(Math.random() * RANDOM_DATA.priorities.length)];
          const urgency = RANDOM_DATA.urgencies[Math.floor(Math.random() * RANDOM_DATA.urgencies.length)];

          // Generate random tags
          const numTags = Math.floor(Math.random() * 3) + 1;
          const tags: string[] = [];
          for (let j = 0; j < numTags; j++) {
            const randomTag = RANDOM_DATA.tags[Math.floor(Math.random() * RANDOM_DATA.tags.length)];
            if (!tags.includes(randomTag)) {
              tags.push(randomTag);
            }
          }

          // Generate random attachments
          const numAttachments = Math.floor(Math.random() * 3);
          const attachments = Array.from({ length: numAttachments }, (_, j) => ({
            name: `attachment-${j + 1}.${['pdf', 'doc', 'jpg'][Math.floor(Math.random() * 3)]}`,
            url: `https://example.com/attachments/${todoId}/${j + 1}`
          }));

          const paramIndex = params.length;
          const now = new Date().toISOString();
          placeholders.push(`($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 13})`);
          params.push(
            todoId, title, description, deadline.toISOString(), status, priority, urgency,
            JSON.stringify(tags), JSON.stringify(attachments), path, level, parentId, now
          );
        }

        if (placeholders.length > 0) {
          const query = `
            INSERT INTO "${this.tableName}" (
              "id", "title", "description", "deadline", "status", "priority", "urgency", 
              "tags", "attachments", "path", "level", "parent_id", "created_at", "updated_at"
            ) VALUES ${placeholders.join(', ')}
          `;
          await this.client.query(query, params);
          successCount += batchCount;
        }
      }

      return {
        success: true,
        message: `Successfully added ${successCount} todo items`
      };
    } catch (error) {
      console.error('Error adding multiple todos:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async clearAllTodos(): Promise<{ success: boolean; message: string }> {
    if (!this.initialized || !this.client) {
      throw new Error('Database not initialized');
    }

    try {
      const countResult = await this.client.query<{ count: string }>(`SELECT COUNT(*) FROM "${this.tableName}"`);
      const count = parseInt(countResult.rows[0].count);

      if (count === 0) {
        return {
          success: true,
          message: 'No todo items to clear'
        };
      }

      if (count > 10000) {
        // Drop and recreate table for large datasets
        await this.client.query(`
          DROP TABLE IF EXISTS "${this.tableName}";
          CREATE TABLE "${this.tableName}" (
            "id" TEXT PRIMARY KEY,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "deadline" TEXT,
            "status" TEXT NOT NULL,
            "priority" TEXT NOT NULL,
            "urgency" TEXT NOT NULL,
            "tags" JSONB NOT NULL,
            "attachments" JSONB NOT NULL,
            "path" TEXT NOT NULL,
            "level" INTEGER NOT NULL,
            "parent_id" TEXT,
            "created_at" TIMESTAMP NOT NULL,
            "updated_at" TIMESTAMP NOT NULL
          );
        `);
      } else {
        await this.client.query(`DELETE FROM "${this.tableName}"`);
      }

      return {
        success: true,
        message: `Cleared ${count} todo items`
      };
    } catch (error) {
      console.error('Error clearing todos:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Create singleton instance
const db = new DatabaseClient();

// Export functions that use the singleton
export const initializeDB = () => db.initialize();
export const loadTodos = () => db.loadTodos();
export const addNewTodo = (parentId: string | null = null) => db.addNewTodo(parentId);
export const addMultipleTodos = (count: number, parentId: string | null = null) => db.addMultipleTodos(count, parentId);
export const clearAllTodos = () => db.clearAllTodos(); 
