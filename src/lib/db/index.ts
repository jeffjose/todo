import Dexie, { type EntityTable } from 'dexie';
import type { Task, WeekEvent } from '$lib/types';

// Database schema
const db = new Dexie('TodoDB') as Dexie & {
	tasks: EntityTable<Task, 'id'>;
	weekEvents: EntityTable<WeekEvent, 'id'>;
};

db.version(1).stores({
	tasks: 'id, title, status, priority, path, level, parentId, deadline, finishBy, todo, completed, createdAt, updatedAt',
	weekEvents: 'id, weekStart'
});

export { db };
