import { pgTable, text, integer, timestamp, boolean, json } from 'drizzle-orm/pg-core';

// Get table name from environment variable or use default
let todoTableName = 'todos';
try {
  // Try to import env, but fallback to default if not available (e.g., in tests)
  import('$env/dynamic/public').then(({ env }) => {
    todoTableName = env.PUBLIC_TODO_TABLE_NAME || 'todos';
  }).catch(() => {
    // In test environments, the env module might not be available
    console.warn('Could not load environment variables, using default table name');
  });
} catch (error) {
  // In test environments, the env module might not be available
  console.warn('Could not load environment variables, using default table name');
}

export const todos = pgTable(todoTableName, {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  emoji: text('emoji'),
  deadline: timestamp('deadline', { withTimezone: true }),
  finish_by: timestamp('finish_by', { withTimezone: true }),
  status: text('status').notNull().default('pending'),
  priority: text('priority').notNull().default('P3'),
  urgency: text('urgency').notNull().default('medium'),
  tags: json('tags').$type<string[]>().default([]),
  attachments: json('attachments').$type<{ name: string; url: string }[]>().default([]),
  path: text('path').notNull().default('root'),
  level: integer('level').notNull().default(0),
  parent_id: text('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type Todo = typeof todos.$inferSelect; 
