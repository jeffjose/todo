import { pgTable, text, integer, timestamp, boolean, json } from 'drizzle-orm/pg-core';
import { env } from '$env/dynamic/private';

// Get table name from environment variable or use default
const todoTableName = env.TODO_TABLE_NAME || 'todos';

export const todos = pgTable(todoTableName, {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	deadline: timestamp('deadline', { withTimezone: true, mode: 'date' }),
	status: text('status').notNull().default('pending'),
	tags: json('tags').$type<string[]>().default([]),
	attachments: json('attachments').$type<{ name: string; url: string }[]>().default([]),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow()
});

export type Todo = typeof todos.$inferSelect;
