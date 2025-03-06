import Dexie, { type Table } from 'dexie';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { customAlphabet } from 'nanoid';
import type { User, Session } from '$lib/server/auth';

// Custom alphabet for nanoid - using only lowercase letters and numbers, excluding confusing characters
const CUSTOM_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const generateId = customAlphabet(CUSTOM_ALPHABET);

// Types
export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  createdAt: Date;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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
  attachments: Attachment[];
  comments: Comment[];
  subtasks: SubTask[];
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
export function getNextBusinessDay(date: Date): Date {
  const nextDay = new Date(date);
  // Convert to UTC to avoid timezone issues
  const utcNextDay = new Date(Date.UTC(nextDay.getUTCFullYear(), nextDay.getUTCMonth(), nextDay.getUTCDate() + 1));
  while (utcNextDay.getUTCDay() === 0 || utcNextDay.getUTCDay() === 6) {
    utcNextDay.setUTCDate(utcNextDay.getUTCDate() + 1);
  }
  return utcNextDay;
}

// Helper function to get random time between 9 AM and 5 PM
export function getRandomBusinessTime(date: Date): Date {
  const time = new Date(date);
  const hours = 9 + Math.floor(Math.random() * 8); // Random hour between 9 and 16
  const minutes = Math.floor(Math.random() * 60);
  time.setHours(hours, minutes, 0, 0);
  return time;
}

// Helper function to generate random todo data
export function generateRandomTodoData(): Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> {
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

  // Ensure finishBy is before deadline
  if (finishBy.getTime() >= deadline.getTime()) {
    // If finishBy is after or equal to deadline, set it to 1 business day before deadline
    finishBy = new Date(deadline);
    finishBy.setDate(deadline.getDate() - 1);
    while (finishBy.getDay() === 0 || finishBy.getDay() === 6) {
      finishBy.setDate(finishBy.getDate() - 1);
    }
    finishBy = getRandomBusinessTime(finishBy);
  }

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
  const attachments: Attachment[] = [];
  for (let i = 0; i < numAttachments; i++) {
    attachments.push({
      id: generateId(),
      name: `attachment-${i + 1}.txt`,
      type: 'text/plain',
      size: Math.floor(Math.random() * 1000),
      url: `https://example.com/attachment-${i + 1}.txt`,
      createdAt: new Date()
    });
  }

  // Generate random comments
  const numComments = Math.floor(Math.random() * 3);
  const comments: Comment[] = [];
  for (let i = 0; i < numComments; i++) {
    comments.push({
      id: generateId(),
      content: `This is a random comment ${i + 1}`,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Generate random subtasks
  const numSubtasks = Math.floor(Math.random() * 3);
  const subtasks: SubTask[] = [];
  for (let i = 0; i < numSubtasks; i++) {
    subtasks.push({
      id: generateId(),
      title: `Subtask ${i + 1}`,
      completed: Math.random() > 0.5,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Generate random emoji
  const emoji = RANDOM_DATA.emojis[Math.floor(Math.random() * RANDOM_DATA.emojis.length)];

  return {
    title,
    description,
    status,
    priority,
    urgency,
    path: 'root',
    level: 0,
    parentId: null,
    deadline,
    finishBy,
    tags,
    attachments,
    comments,
    subtasks,
    emoji
  };
}
