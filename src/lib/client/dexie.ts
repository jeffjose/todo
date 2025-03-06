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
      todos: '++id, title, status, priority, urgency, path, level, parentId, createdAt, updatedAt, deadline, finishBy, tags',
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

// Helper function to generate random todo data
function generateRandomTodoData(): Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date();
  const title = RANDOM_DATA.titles[Math.floor(Math.random() * RANDOM_DATA.titles.length)];
  const description = `This is a randomly generated todo item for ${title.toLowerCase()}.`;

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
    url: `https://example.com/attachments/${generateId()}/${i + 1}`
  }));

  return {
    title,
    description,
    emoji: RANDOM_DATA.emojis[Math.floor(Math.random() * RANDOM_DATA.emojis.length)],
    deadline,
    finishBy,
    status,
    priority,
    urgency,
    tags,
    attachments,
    path: 'root',
    level: 0,
    parentId: null
  };
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

export async function createRandomTodo(): Promise<Todo> {
  return createTodo(generateRandomTodoData());
}

export async function createMultipleRandomTodos(count: number): Promise<Todo[]> {
  const db = await getDB();
  const todos: Todo[] = [];

  for (let i = 0; i < count; i++) {
    const todo = await createRandomTodo();
    todos.push(todo);
  }

  return todos;
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
