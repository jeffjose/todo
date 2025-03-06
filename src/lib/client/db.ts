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
  emoji: string | null;
  deadline: Date | null;
  finishBy: Date | null;
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

export interface WeekEvent {
  id: string;
  startDate: Date;
  endDate: Date;
  description: string | null;
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
  emoji: string | null;
  deadline: string | null;
  finish_by: string | null;
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

type WeekEventRow = {
  id: string;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

// Database schema definition
const DESIRED_SCHEMA: SchemaDefinition = {
  id: { type: 'text', primaryKey: true, nullable: false },
  title: { type: 'text', nullable: false },
  description: { type: 'text', nullable: true },
  emoji: { type: 'text', nullable: true },
  deadline: { type: 'timestamptz', nullable: true },
  finish_by: { type: 'timestamptz', nullable: true },
  status: { type: 'text', nullable: false, defaultValue: "'pending'" },
  priority: { type: 'text', nullable: false, defaultValue: "'P3'" },
  urgency: { type: 'text', nullable: false, defaultValue: "'medium'" },
  tags: { type: 'json', nullable: false, defaultValue: "'[]'" },
  attachments: { type: 'json', nullable: false, defaultValue: "'[]'" },
  path: { type: 'text', nullable: false, defaultValue: "'root'" },
  level: { type: 'integer', nullable: false, defaultValue: '0' },
  parent_id: { type: 'text', nullable: true },
  created_at: { type: 'timestamptz', nullable: false },
  updated_at: { type: 'timestamptz', nullable: false }
};

const KNOWN_EVENTS_SCHEMA: SchemaDefinition = {
  id: { type: 'text', primaryKey: true, nullable: false },
  start_date: { type: 'timestamptz', nullable: false },
  end_date: { type: 'timestamptz', nullable: false },
  description: { type: 'text', nullable: false },
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

// Helper functions for week events
function generateWeekId(date: Date): string {
  // Get the week number (1-53)
  const weekNum = getWeekNumber(date);
  // Get the year
  const year = date.getFullYear();
  // Format: "YYYY-Www" (e.g., "2024-W01")
  return `${year}-W${weekNum.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  // Get the first day of the year
  const start = new Date(date.getFullYear(), 0, 1);
  // Get the first Monday of the year
  const firstMonday = new Date(start);
  firstMonday.setDate(start.getDate() + (8 - start.getDay()) % 7);
  // Calculate the week number
  const weekNum = Math.ceil((date.getTime() - firstMonday.getTime()) / (7 * 24 * 60 * 60 * 1000));
  return weekNum;
}

function getDateOfISOWeek(year: number, week: number, day: number): Date {
  // Get the first day of the year
  const start = new Date(year, 0, 1);
  // Get the first Monday of the year
  const firstMonday = new Date(start);
  firstMonday.setDate(start.getDate() + (8 - start.getDay()) % 7);
  // Calculate the target date
  const targetDate = new Date(firstMonday);
  targetDate.setDate(firstMonday.getDate() + (week - 1) * 7 + (day - 1));
  return targetDate;
}

function getWeekDates(weekId: string): { startDate: Date; endDate: Date } {
  // Parse year and week from ID
  const [year, week] = weekId.split('-W');
  // Calculate Monday and Friday dates
  const startDate = getDateOfISOWeek(parseInt(year), parseInt(week), 1); // 1 = Monday
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 4); // Add 4 days to get to Friday
  return { startDate, endDate };
}

function getWeeksInRange(startDate: Date, endDate: Date): string[] {
  const weeks: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    weeks.push(generateWeekId(currentDate));
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return weeks;
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
    'Implement feedback changes',
    'Optimize database queries',
    'Set up CI/CD pipeline',
    'Conduct code review',
    'Write unit tests',
    'Deploy to staging',
    'Monitor system performance',
    'Backup database',
    'Update security patches',
    'Configure load balancer',
    'Set up monitoring alerts',
    'Review pull requests',
    'Update API documentation',
    'Implement error logging',
    'Optimize frontend assets',
    'Set up automated testing',
    'Configure development environment',
    'Review system architecture',
    'Update user interface',
    'Implement caching strategy',
    'Set up data backup',
    'Configure firewall rules',
    'Review access controls',
    'Update SSL certificates',
    'Optimize database indexes',
    'Set up logging system',
    'Configure CDN settings',
    'Review security policies',
    'Update system dependencies',
    'Implement rate limiting',
    'Set up analytics tracking',
    'Configure email notifications',
    'Review data retention policies',
    'Update content management system',
    'Implement search functionality',
    'Set up user authentication',
    'Configure API endpoints',
    'Review performance metrics',
    'Update system configurations',
    'Implement data validation',
    'Set up automated backups'
  ],
  emojis: ['📝', '📋', '📅', '📊', '💡', '🔍', '⚡', '🎯', '📌', '✅', '📎', '📁', '📄', '📑', '📚', '📖', '📗', '📘', '📙', '📕'],
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
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    const query = `SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    )`;

    try {
      const result = await this.client.query(query, [this.tableName]);
      const exists = (result.rows[0] as { exists: boolean })?.exists ?? false;
      return exists;
    } catch (error) {
      console.error(`Error checking if table ${this.tableName} exists:`, error);
      throw error;
    }
  }

  private async addColumn(column: string, def: ColumnDefinition): Promise<void> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    try {
      // Add column as nullable
      const addColumnSQL = `
        ALTER TABLE "${this.tableName}"
        ADD COLUMN "${column}" ${def.type}
      `;
      await this.client.query(addColumnSQL);

      // Set default value if specified
      if (def.defaultValue) {
        // The defaultValue is already properly quoted in the schema definition
        const updateDefaultSQL = `
          UPDATE "${this.tableName}"
          SET "${column}" = ${def.defaultValue}
          WHERE "${column}" IS NULL
        `;
        await this.client.query(updateDefaultSQL);
      }

      // Set NOT NULL constraint if required
      if (!def.nullable) {
        const setNotNullSQL = `
          ALTER TABLE "${this.tableName}"
          ALTER COLUMN "${column}" SET NOT NULL
        `;
        await this.client.query(setNotNullSQL);
      }
    } catch (error) {
      console.error(`Error adding column "${column}" to table "${this.tableName}":`, error);
      throw error;
    }
  }

  private async updateColumn(column: string, def: ColumnDefinition): Promise<void> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    try {
      // Check if a temporary column already exists from a previous failed update
      const tempColumn = `${column}_temp`;
      const checkTempColumnSQL = `
        SELECT EXISTS (
          SELECT FROM information_schema.columns
          WHERE table_name = $1
          AND column_name = $2
        )
      `;
      const tempColumnExists = await this.client.query(checkTempColumnSQL, [this.tableName, tempColumn]);
      const tempColumnExistsValue = (tempColumnExists.rows[0] as { exists: boolean })?.exists ?? false;

      // Drop the temporary column if it exists
      if (tempColumnExistsValue) {
        console.info(`Found existing temporary column "${tempColumn}", dropping it first`);
        const dropTempColumnSQL = `
          ALTER TABLE "${this.tableName}"
          DROP COLUMN "${tempColumn}"
        `;
        await this.client.query(dropTempColumnSQL);
      }

      // First, get the current data
      const currentDataSQL = `SELECT "${column}" FROM "${this.tableName}" WHERE "${column}" IS NOT NULL`;
      const currentData = await this.client.query(currentDataSQL);

      // Create a temporary column with the new type
      const addTempColumnSQL = `
        ALTER TABLE "${this.tableName}"
        ADD COLUMN "${tempColumn}" ${def.type}
      `;
      await this.client.query(addTempColumnSQL);

      // Copy data to the temporary column
      if (currentData.rows.length > 0) {
        let copyDataSQL;
        if (def.type === 'timestamptz') {
          // For timestamps, ensure we preserve the timezone information
          copyDataSQL = `
            UPDATE "${this.tableName}"
            SET "${tempColumn}" = "${column}"::timestamptz
          `;
        } else {
          // For other types, do a direct copy
          copyDataSQL = `
            UPDATE "${this.tableName}"
            SET "${tempColumn}" = "${column}"
          `;
        }
        await this.client.query(copyDataSQL);
      }

      // Drop the old column
      const dropColumnSQL = `
        ALTER TABLE "${this.tableName}"
        DROP COLUMN "${column}"
      `;
      await this.client.query(dropColumnSQL);

      // Rename the temporary column to the original name
      const renameColumnSQL = `
        ALTER TABLE "${this.tableName}"
        RENAME COLUMN "${tempColumn}" TO "${column}"
      `;
      await this.client.query(renameColumnSQL);

      // Set default value if specified
      if (def.defaultValue) {
        // The defaultValue is already properly quoted in the schema definition
        const updateDefaultSQL = `
          UPDATE "${this.tableName}"
          SET "${column}" = ${def.defaultValue}
          WHERE "${column}" IS NULL
        `;
        await this.client.query(updateDefaultSQL);
      }

      // Make column non-nullable if specified
      if (!def.nullable && column !== 'created_at' && column !== 'updated_at') {
        const setNotNullSQL = `
          ALTER TABLE "${this.tableName}"
          ALTER COLUMN "${column}" SET NOT NULL
        `;
        await this.client.query(setNotNullSQL);
      }
    } catch (error) {
      console.error(`Error updating column "${column}" in table "${this.tableName}":`, error);
      throw error;
    }
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

  private async cleanupTemporaryColumns(): Promise<void> {
    if (!this.client) {
      throw new Error('Database not initialized');
    }

    try {
      // Find all columns that end with _temp
      const findTempColumnsSQL = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
        AND column_name LIKE '%\_temp'
      `;
      const tempColumns = await this.client.query(findTempColumnsSQL, [this.tableName]);

      if (tempColumns.rows.length > 0) {
        console.info(`Found ${tempColumns.rows.length} temporary columns to clean up`);

        // Drop each temporary column
        for (const row of tempColumns.rows) {
          const tempColumn = row.column_name;
          const dropTempColumnSQL = `
            ALTER TABLE "${this.tableName}"
            DROP COLUMN "${tempColumn}"
          `;
          await this.client.query(dropTempColumnSQL);
          console.info(`Dropped temporary column "${tempColumn}"`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temporary columns:', error);
      // Don't throw the error, just log it and continue
    }
  }

  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    if (!browser) {
      return;
    }
    if (this.initialized) {
      return;
    }

    console.info('Starting database initialization');
    this.initPromise = (async () => {
      try {
        this.client = new PGlite('idb://todo-app-db');
        this.db = drizzle({ client: this.client, schema });

        // Initialize todos table
        const todosTableExists = await this.tableExists();

        if (!todosTableExists) {
          // Create new todos table
          const createTodosTableSQL = `
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
          await this.client.query(createTodosTableSQL);
          console.info('Todos table created successfully');
        }

        // Initialize known_events table
        const eventsTableExistsQuery = `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'known_events'
          )
        `;
        const eventsTableExists = await this.client.query(eventsTableExistsQuery);
        const eventsTableExistsValue = (eventsTableExists.rows[0] as { exists: boolean })?.exists;

        if (!eventsTableExistsValue) {
          // Create new known_events table
          const createEventsTableSQL = `
            CREATE TABLE IF NOT EXISTS "known_events" (
              ${Object.entries(KNOWN_EVENTS_SCHEMA)
              .map(([column, def]) => {
                const nullable = def.nullable ? '' : ' NOT NULL';
                const defaultValue = def.defaultValue ? ` DEFAULT ${def.defaultValue}` : '';
                const primaryKey = def.primaryKey ? ' PRIMARY KEY' : '';
                return `"${column}" ${def.type}${nullable}${defaultValue}${primaryKey}`;
              })
              .join(',\n              ')}
            )
          `;
          await this.client.query(createEventsTableSQL);
          console.info('Known_events table created successfully');
        }

        // Update existing tables if needed
        if (todosTableExists) {
          console.info('Updating existing todos table structure if needed');
          // Get current structure
          const columnsQuery = `
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `;
          const currentColumns = await this.client.query<ColumnInfo>(columnsQuery, [this.tableName]);
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

        // Clean up temporary columns
        await this.cleanupTemporaryColumns();

        console.info('Database initialization completed successfully');
        this.initialized = true;

      } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  async loadTodos(): Promise<Todo[]> {
    if (!this.initialized || !this.client) {
      throw new Error('Database not initialized');
    }

    try {
      const result = await this.client.query<TodoRow>(
        `SELECT * FROM "${this.tableName}" ORDER BY "created_at" DESC`
      );

      if (!result.rows || result.rows.length === 0) {
        return [];
      }

      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        emoji: row.emoji,
        deadline: row.deadline ? new Date(row.deadline) : null,
        finishBy: row.finish_by ? new Date(row.finish_by) : null,
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
    } catch (error) {
      console.error('Error loading todos:', error);
      return [];
    }
  }

  async addNewTodo(parentId: string | null = null): Promise<{ success: boolean; message: string }> {
    if (!this.initialized || !this.client) {
      throw new Error('Database not initialized');
    }

    try {
      const todoId = generateId();
      const now = new Date();

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

      // Helper function to get next business day (Monday-Friday)
      function getNextBusinessDay(date: Date): Date {
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
          nextDay.setDate(nextDay.getDate() + 1);
        }
        return nextDay;
      }

      // Helper function to get random time between 9 AM and 5 PM
      function getRandomBusinessTime(date: Date): Date {
        const time = new Date(date);
        const hours = 9 + Math.floor(Math.random() * 8); // Random hour between 9 and 16
        const minutes = Math.floor(Math.random() * 60);
        time.setHours(hours, minutes, 0, 0);
        return time;
      }

      // Set deadline to be between now and now + 14 business days
      let deadline = new Date(now);
      const numBusinessDays = Math.floor(Math.random() * 14) + 1;
      for (let i = 0; i < numBusinessDays; i++) {
        deadline = getNextBusinessDay(deadline);
      }
      deadline = getRandomBusinessTime(deadline);

      // Set finishBy to be between now and deadline, but not more than 1 week before deadline
      let finishBy = new Date(now);
      const maxBusinessDaysBeforeDeadline = Math.min(5, numBusinessDays - 1); // At least 1 business day before deadline
      const numBusinessDaysBeforeDeadline = Math.floor(Math.random() * maxBusinessDaysBeforeDeadline) + 1;
      for (let i = 0; i < numBusinessDaysBeforeDeadline; i++) {
        finishBy = getNextBusinessDay(finishBy);
      }
      finishBy = getRandomBusinessTime(finishBy);

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

      const insertQuery = `
        INSERT INTO "${this.tableName}" (
          "id", "title", "description", "emoji", "deadline", "finish_by", "status", "priority", "urgency", 
          "tags", "attachments", "path", "level", "parent_id", "created_at", "updated_at"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `;

      const params = [
        todoId,
        title,
        description,
        RANDOM_DATA.emojis[Math.floor(Math.random() * RANDOM_DATA.emojis.length)],
        deadline.toISOString(),
        finishBy.toISOString(),
        status,
        priority,
        urgency,
        JSON.stringify(tags),
        JSON.stringify(attachments),
        path,
        level,
        parentId,
        now.toISOString(),
        now.toISOString()
      ];

      await this.client.query(insertQuery, params);

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
          const twoMonthsAgo = new Date();
          twoMonthsAgo.setMonth(today.getMonth() - 2);
          const createdAt = new Date(twoMonthsAgo.getTime() + Math.random() * (today.getTime() - twoMonthsAgo.getTime()));

          // Set deadline to be between createdAt and createdAt + 14 days
          const deadline = new Date(createdAt.getTime() + Math.random() * (14 * 24 * 60 * 60 * 1000));

          // Set finishBy to be between createdAt and deadline, but not more than 1 week before deadline
          const oneWeekBeforeDeadline = new Date(deadline.getTime() - 7 * 24 * 60 * 60 * 1000);
          const finishBy = new Date(
            Math.max(createdAt.getTime(), oneWeekBeforeDeadline.getTime()) +
            Math.random() * (deadline.getTime() - Math.max(createdAt.getTime(), oneWeekBeforeDeadline.getTime()))
          );

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
          placeholders.push(`($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15}, $${paramIndex + 16})`);
          params.push(
            todoId,
            title,
            description,
            RANDOM_DATA.emojis[Math.floor(Math.random() * RANDOM_DATA.emojis.length)],
            deadline.toISOString(),
            finishBy.toISOString(),
            status,
            priority,
            urgency,
            JSON.stringify(tags),
            JSON.stringify(attachments),
            path,
            level,
            parentId,
            createdAt.toISOString(),
            today.toISOString()
          );
        }

        if (placeholders.length > 0) {
          const query = `
            INSERT INTO "${this.tableName}" (
              "id", "title", "description", "emoji", "deadline", "finish_by", "status", "priority", "urgency", 
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

  async loadWeekEvents(startDate: Date, endDate: Date): Promise<WeekEvent[]> {
    if (!this.initialized || !this.client) return [];

    try {
      // Get all week IDs in the range
      const weekIds = getWeeksInRange(startDate, endDate);

      // Load known events for these weeks
      const result = await this.client.query<WeekEventRow>(`
        SELECT 
          "id", "start_date", "end_date", "description", "created_at", "updated_at"
        FROM "known_events"
        WHERE "id" = ANY($1)
        ORDER BY "start_date" ASC
      `, [weekIds]);

      // Create a map of known events
      const knownEvents = new Map(
        result.rows.map(row => [
          row.id,
          {
            id: row.id,
            startDate: new Date(row.start_date),
            endDate: new Date(row.end_date),
            description: row.description,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at)
          }
        ])
      );

      // Generate all weeks in the range, using known events where available
      const events: WeekEvent[] = weekIds.map(weekId => {
        if (knownEvents.has(weekId)) {
          return knownEvents.get(weekId)!;
        }

        // Generate a week event without description
        const { startDate, endDate } = getWeekDates(weekId);
        const now = new Date();
        return {
          id: weekId,
          startDate,
          endDate,
          description: null,
          createdAt: now,
          updatedAt: now
        };
      });

      return events;
    } catch (error) {
      console.error('Error loading week events:', error);
      return [];
    }
  }

  async addKnownEvent(description: string, date: Date): Promise<{ success: boolean; message: string }> {
    if (!this.initialized || !this.client) {
      throw new Error('Database not initialized');
    }

    try {
      const weekId = generateWeekId(date);
      const { startDate, endDate } = getWeekDates(weekId);
      const now = new Date().toISOString();

      await this.client.query(
        `INSERT INTO "known_events" (
          "id", "start_date", "end_date", "description", "created_at", "updated_at"
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO UPDATE SET
          "description" = EXCLUDED.description,
          "updated_at" = EXCLUDED.updated_at`,
        [weekId, startDate.toISOString(), endDate.toISOString(), description, now, now]
      );

      return {
        success: true,
        message: `Added event "${description}" for week ${weekId}`
      };
    } catch (error) {
      console.error('Error adding known event:', error);
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
            ${Object.entries(DESIRED_SCHEMA)
            .map(([column, def]) => {
              const nullable = def.nullable ? '' : ' NOT NULL';
              const defaultValue = def.defaultValue ? ` DEFAULT ${def.defaultValue}` : '';
              const primaryKey = def.primaryKey ? ' PRIMARY KEY' : '';
              return `"${column}" ${def.type}${nullable}${defaultValue}${primaryKey}`;
            })
            .join(',\n            ')}
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

  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    if (!browser) {
      return { success: false, message: 'Cannot reset database outside of browser environment' };
    }

    try {
      // Reset the initialized state
      this.initialized = false;

      // Create a new client if needed
      if (!this.client) {
        this.client = new PGlite('idb://todo-app-db');
      }

      // Drop the tables if they exist
      try {
        await this.client.query(`DROP TABLE IF EXISTS "${this.tableName}"`);
        await this.client.query(`DROP TABLE IF EXISTS "known_events"`);
      } catch (error) {
        console.error('Error dropping tables:', error);
      }

      // Re-initialize the database
      await this.initialize();

      return {
        success: true,
        message: 'Database reset successfully'
      };
    } catch (error) {
      console.error('Failed to reset database:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error resetting database'
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
export const loadWeekEvents = (startDate: Date, endDate: Date) => db.loadWeekEvents(startDate, endDate);
export const addKnownEvent = (description: string, date: Date) => db.addKnownEvent(description, date);
export const clearAllTodos = () => db.clearAllTodos();
export const resetDatabase = () => db.resetDatabase(); 
