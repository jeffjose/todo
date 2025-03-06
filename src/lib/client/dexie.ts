import Dexie, { type Table } from 'dexie';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { customAlphabet } from 'nanoid';
import type { User, Session } from '$lib/server/auth';

// Custom alphabet for nanoid - using only lowercase letters and numbers, excluding confusing characters
const CUSTOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const generateId = customAlphabet(CUSTOM_ALPHABET);

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

export interface KnownEvent {
  id: string;
  startDate: Date;
  endDate: Date;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper functions for path management
export const PATH_SEPARATOR = '.';
export const ROOT_PATH = 'root';

export function buildPath(parentPath: string | null, id: string): string {
  return parentPath ? `${parentPath}${PATH_SEPARATOR}${id}` : ROOT_PATH;
}

export class TodoDatabase extends Dexie {
  todos!: Table<Todo>;
  knownEvents!: Table<KnownEvent>;
  users!: Table<User>;
  sessions!: Table<Session>;

  constructor() {
    super(env.PUBLIC_TODO_TABLE_NAME || 'todos');
    this.version(1).stores({
      todos: '++id, title, status, priority, urgency, path, level, parentId, createdAt, updatedAt',
      knownEvents: '++id, startDate, endDate, description, createdAt, updatedAt',
      users: '++id, username',
      sessions: '++id, userId, expiresAt'
    });
  }
}

// Database instance
let db: TodoDatabase | null = null;

export async function initializeDB(): Promise<void> {
  if (!browser) return;
  if (db) return;

  db = new TodoDatabase();
  await db.open();
}

export async function getDB(): Promise<TodoDatabase> {
  if (!db) {
    await initializeDB();
  }
  return db!;
}

// CRUD operations
export async function createTodo(todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
  const db = await getDB();
  const now = new Date();
  const newTodo: Todo = {
    ...todo,
    id: generateId(),
    createdAt: now,
    updatedAt: now
  };
  await db.todos.add(newTodo);
  return newTodo;
}

export async function getTodo(id: string): Promise<Todo | undefined> {
  const db = await getDB();
  return db.todos.get(id);
}

export async function updateTodo(id: string, updates: Partial<Todo>): Promise<Todo | undefined> {
  const db = await getDB();
  const todo = await db.todos.get(id);
  if (!todo) return undefined;

  const updatedTodo = {
    ...todo,
    ...updates,
    updatedAt: new Date()
  };
  await db.todos.put(updatedTodo);
  return updatedTodo;
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDB();
  await db.todos.delete(id);
}

export async function getAllTodos(): Promise<Todo[]> {
  const db = await getDB();
  return db.todos.toArray();
}

export async function getTodosByPath(path: string): Promise<Todo[]> {
  const db = await getDB();
  return db.todos.where('path').equals(path).toArray();
}

export async function getTodosByParentId(parentId: string): Promise<Todo[]> {
  const db = await getDB();
  return db.todos.where('parentId').equals(parentId).toArray();
}

export async function getTodosByStatus(status: string): Promise<Todo[]> {
  const db = await getDB();
  return db.todos.where('status').equals(status).toArray();
}

export async function getTodosByPriority(priority: string): Promise<Todo[]> {
  const db = await getDB();
  return db.todos.where('priority').equals(priority).toArray();
}

export async function getTodosByUrgency(urgency: string): Promise<Todo[]> {
  const db = await getDB();
  return db.todos.where('urgency').equals(urgency).toArray();
}

export async function getTodosByTag(tag: string): Promise<Todo[]> {
  const db = await getDB();
  return db.todos.filter(todo => todo.tags.includes(tag)).toArray();
}

export async function getTodosByDateRange(startDate: Date, endDate: Date): Promise<Todo[]> {
  const db = await getDB();
  return db.todos
    .filter(todo => {
      if (!todo.deadline) return false;
      return todo.deadline >= startDate && todo.deadline <= endDate;
    })
    .toArray();
}

export async function clearAllTodos(): Promise<{ success: boolean; message: string }> {
  const db = await getDB();
  try {
    const count = await db.todos.count();
    if (count === 0) {
      return {
        success: true,
        message: 'No todo items to clear'
      };
    }
    await db.todos.clear();
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

// Known events operations
export async function createKnownEvent(event: Omit<KnownEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<KnownEvent> {
  const db = await getDB();
  const now = new Date();
  const newEvent: KnownEvent = {
    ...event,
    id: generateId(),
    createdAt: now,
    updatedAt: now
  };
  await db.knownEvents.add(newEvent);
  return newEvent;
}

export async function getKnownEvent(id: string): Promise<KnownEvent | undefined> {
  const db = await getDB();
  return db.knownEvents.get(id);
}

export async function updateKnownEvent(id: string, updates: Partial<KnownEvent>): Promise<KnownEvent | undefined> {
  const db = await getDB();
  const event = await db.knownEvents.get(id);
  if (!event) return undefined;

  const updatedEvent = {
    ...event,
    ...updates,
    updatedAt: new Date()
  };
  await db.knownEvents.put(updatedEvent);
  return updatedEvent;
}

export async function deleteKnownEvent(id: string): Promise<void> {
  const db = await getDB();
  await db.knownEvents.delete(id);
}

export async function getAllKnownEvents(): Promise<KnownEvent[]> {
  const db = await getDB();
  return db.knownEvents.toArray();
}

export async function getKnownEventsByDateRange(startDate: Date, endDate: Date): Promise<KnownEvent[]> {
  const db = await getDB();
  return db.knownEvents
    .filter(event => event.startDate >= startDate && event.endDate <= endDate)
    .toArray();
} 
