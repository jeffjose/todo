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
  todo: Date | null;  // Explicit todo date for task
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
    this.version(2).stores({
      todos: '++id, title, status, priority, urgency, path, level, parentId, createdAt, updatedAt, deadline, finishBy, todo, tags',
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
  themes: {
    space: {
      emoji: ['🚀', '🛸', '🌠', '🌍', '🌌', '👨‍🚀', '🛰️', '🌑', '☄️', '🌟'],
      titles: [
        'Launch Mars Rocket',
        'Comprehensive Analysis of Recent Deep Space Signals',
        'Fix Telescope',
        'Track Multiple Satellite Trajectories in LEO',
        'Plan ISS Maintenance Schedule for Q2 2024',
        'Analyze Recent Asteroid Samples from Mission XR-7',
        'Update Mission Control',
        'Test New Space Suits',
        'Map Distant Galaxies',
        'Scout Moon Landing Sites',
        'Design Self-Sustaining Habitat System for Mars Colony',
        'Plot Course',
        'Research Advanced Quantum Propulsion Methods',
        'Check Life Support',
        'Log Signals',
        'Train New Crew Members for Extended Space Missions',
        'Test Zero-G Equipment',
        'Monitor Solar Activity',
        'Deploy Probe Alpha',
        'Plan Next Mission'
      ]
    },
    tech: {
      emoji: ['💻', '🖥️', '📱', '⌨️', '🔌', '🤖', '🎮', '📡', '🔋', '💾'],
      titles: [
        'Fix Critical Production Bug',
        'Optimize Database Query Performance for Large Datasets',
        'Ship Features',
        'Update Technical Documentation for API v2',
        'Configure High-Availability Production Server Cluster',
        'Train AI Model',
        'Speed Up App',
        'Setup Development Environment for New Team Members',
        'Review Security',
        'Add Auth',
        'Fix Memory Leak',
        'Update All Dependencies to Latest Stable Versions',
        'Write Integration Tests',
        'Design New Microservices Architecture',
        'Balance Load',
        'Monitor System Health',
        'Backup Data',
        'Research New Tech Stack',
        'Deploy Code',
        'Debug Production Issues'
      ]
    },
    creative: {
      emoji: ['🎨', '🎭', '🎬', '📸', '🎼', '✏️', '🎪', '🎯', '🎹', '🖌️'],
      titles: [
        'Design UI',
        'Edit Video',
        'Write Post',
        'Create Content',
        'Sketch Character',
        'Write Music',
        'Plan Shoot',
        'Record Show',
        'Paint Scene',
        'Make Animation',
        'Design New Brand Logo Options',
        'Draft Story',
        'Mix Tracks',
        'Draw',
        'Plan Exhibition Layout',
        'Create Marketing Assets',
        'Update Brand Guidelines',
        'Edit Photos',
        'Animate Graphics',
        'Write Script'
      ]
    },
    health: {
      emoji: ['🏃‍♂️', '🧘‍♀️', '🥗', '💪', '🌱', '🧠', '❤️', '🥑', '💊', '🌿'],
      titles: [
        'Do Yoga',
        'Cook Lunch',
        'Drink Water',
        'See Doctor',
        'Plan Next Week Workout Schedule',
        'Meditate',
        'Research Diet',
        'Take Meds',
        'Evening Walk',
        'Be Mindful',
        'Try Recipe',
        'Dental Visit',
        'Track Sleep',
        'Join Gym',
        'Prep Meals for the Week',
        'Book Appointment',
        'New Workout',
        'Learn Stress Management Techniques',
        'Eye Test',
        'Log Progress'
      ]
    },
    adventure: {
      emoji: ['🏔️', '🏕️', '🗺️', '🧗‍♀️', '🏄‍♂️', '🚵‍♂️', '⛺️', '🛶', '🏹', '🪂'],
      titles: [
        'Plan Hike',
        'Find Camp',
        'Book Jump',
        'Get Gear',
        'Scout River Route',
        'Learn Survival',
        'Map Trail',
        'Surf Lesson',
        'Climb Rocks',
        'Check Rapids',
        'Pack Tent',
        'Plan Desert Trek',
        'Explore Caves',
        'Schedule Paragliding Session',
        'Plan Mountain Bike Route',
        'Research Dive Sites',
        'Pack First Aid',
        'Plan Wildlife Photo Trip',
        'Book Zip Line',
        'Hire Guide'
      ]
    },
    learning: {
      emoji: ['📚', '🎓', '✏️', '🔬', '🗣️', '🧮', '📝', '🎯', '🔍', '📖'],
      titles: [
        'Learn Spanish',
        'Take Course',
        'Read Paper',
        'Code More',
        'Practice Piano',
        'Study History',
        'Give Speech',
        'Learn Stats',
        'Study Art',
        'Write Essay',
        'Master Photography Basics',
        'Read Physics',
        'Play Chess',
        'Learn Cooking',
        'Read Philosophy',
        'Study Digital Marketing Fundamentals',
        'Try Meditation',
        'Research Psychology',
        'Learn Design',
        'Practice Debate'
      ]
    },
    home: {
      emoji: ['🏠', '🧹', '🪴', '🛋️', '🧺', '🔨', '🏡', '🪑', '🧰', '🗑️'],
      titles: [
        'Clean Kitchen',
        'Sort Garage',
        'Plant Herbs',
        'Fix Tap',
        'Clean Out Master Bedroom Closet',
        'Paint Room',
        'Change Filters',
        'File Papers',
        'Fix Fence',
        'Update Decor',
        'Clean Gutters',
        'Sort Basement',
        'Service AC',
        'Wash Windows',
        'Organize Food',
        'Replace Handle',
        'Steam Clean All Carpets',
        'Install Lights',
        'Sort Tools',
        'Plan Renovation'
      ]
    },
    social: {
      emoji: ['👥', '🎉', '🎊', '🎈', '🎂', '🤝', '💝', '🎁', '📧', '💌'],
      titles: [
        'Plan Party',
        'Team Build',
        'Family Dinner',
        'Plan Shower',
        'Organize Annual Charity Event',
        'Holiday Plans',
        'Coffee Meet',
        'Book Club',
        'Game Night',
        'Call Mom',
        'Surprise Party',
        'Plan Reunion',
        'Lunch Group',
        'Movie Night',
        'Plan Fundraiser Details',
        'Beach Day',
        'Group Hike',
        'Host Dinner',
        'Run Workshop',
        'Network Event'
      ]
    },
    business: {
      emoji: ['💼', '📊', '📈', '🤝', '💰', '📱', '📑', '🗂️', '📅', '✍️'],
      titles: [
        'Review Q4',
        'Make Slides',
        'Client Call',
        'Update Plan',
        'Analyze Market Trends Report',
        'Check Budget',
        'Plan Campaign',
        'Sales Report',
        'Study Rivals',
        'Do Taxes',
        'Review Contract',
        'Product Launch',
        'Update Prices',
        'Team Review',
        'Process Feedback',
        'Plan Expansion Strategy',
        'Update Policy',
        'Check Stock',
        'Train Team',
        'Set Goals'
      ]
    },
    travel: {
      emoji: ['✈️', '🗺️', '🎒', '🏰', '🗽', '🏖️', '🚂', '🏔️', '🚗', '🛳️'],
      titles: [
        'Book Flight',
        'Find Hotel',
        'Plan Route',
        'Get Insurance',
        'Reserve Train Tickets Online',
        'Research Food',
        'Book Tours',
        'Rent Car',
        'Find Sites',
        'Map Trails',
        'Book Room',
        'Check Transit',
        'Museum List',
        'Get Shots',
        'Learn Customs',
        'Plan Beach Days',
        'Book Guide',
        'Find Restaurants',
        'Shop List',
        'Apply Visa'
      ]
    }
  },
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
export function generateRandomTodoData(startDate?: Date, endDate?: Date): Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date();

  // Pick a random theme
  const themes = Object.keys(RANDOM_DATA.themes);
  const theme = RANDOM_DATA.themes[themes[Math.floor(Math.random() * themes.length)]];

  // Get random title and emoji from the theme
  const titleIndex = Math.floor(Math.random() * theme.titles.length);
  const title = theme.titles[titleIndex];
  // 50% chance to have an emoji
  const emoji = Math.random() < 0.5 ? theme.emoji[Math.floor(Math.random() * theme.emoji.length)] : null;

  const description = `This is a randomly generated todo item for ${title.toLowerCase()}.`;

  // Set deadline to be between startDate and endDate if provided, otherwise between now and now + 14 business days
  let deadline = new Date(startDate || now);
  if (startDate && endDate) {
    const timeDiff = endDate.getTime() - startDate.getTime();
    const randomDays = Math.floor(Math.random() * (timeDiff / (1000 * 60 * 60 * 24)));
    deadline = new Date(startDate.getTime() + randomDays * (1000 * 60 * 60 * 24));
    while (deadline.getDay() === 0 || deadline.getDay() === 6) {
      deadline = getNextBusinessDay(deadline);
    }
  } else {
    const numBusinessDays = Math.floor(Math.random() * 14) + 1;
    for (let i = 0; i < numBusinessDays; i++) {
      deadline = getNextBusinessDay(deadline);
    }
  }
  deadline = getRandomBusinessTime(deadline);

  // Set finishBy to be between startDate and deadline
  let finishBy = new Date(startDate || now);
  if (startDate) {
    const timeDiff = deadline.getTime() - startDate.getTime();
    const randomDays = Math.floor(Math.random() * (timeDiff / (1000 * 60 * 60 * 24)));
    finishBy = new Date(startDate.getTime() + randomDays * (1000 * 60 * 60 * 24));
    while (finishBy.getDay() === 0 || finishBy.getDay() === 6) {
      finishBy = getNextBusinessDay(finishBy);
    }
  } else {
    const maxBusinessDaysBeforeDeadline = Math.min(5, numBusinessDays - 1);
    const numBusinessDaysBeforeDeadline = Math.floor(Math.random() * maxBusinessDaysBeforeDeadline) + 1;
    for (let i = 0; i < numBusinessDaysBeforeDeadline; i++) {
      finishBy = getNextBusinessDay(finishBy);
    }
  }
  finishBy = getRandomBusinessTime(finishBy);

  // Ensure finishBy is before deadline
  if (finishBy.getTime() >= deadline.getTime()) {
    finishBy = new Date(deadline);
    finishBy.setDate(deadline.getDate() - 1);
    while (finishBy.getDay() === 0 || finishBy.getDay() === 6) {
      finishBy.setDate(finishBy.getDate() - 1);
    }
    finishBy = getRandomBusinessTime(finishBy);
  }

  // 10% chance to set a todo date between now and finishBy
  let todo: Date | null = null;
  if (Math.random() < 0.1) {
    todo = new Date(now);
    const timeDiff = finishBy.getTime() - now.getTime();
    const randomDays = Math.floor(Math.random() * (timeDiff / (1000 * 60 * 60 * 24)));
    todo = new Date(now.getTime() + randomDays * (1000 * 60 * 60 * 24));
    while (todo.getDay() === 0 || todo.getDay() === 6) {
      todo = getNextBusinessDay(todo);
    }
    todo = getRandomBusinessTime(todo);
  }

  const status = (() => {
    const now = new Date();
    const isTaskInPast = deadline.getTime() < now.getTime();

    if (isTaskInPast) {
      // For past tasks: 60% completed, 5% in-progress, 2% blocked, 33% pending
      const rand = Math.random();
      if (rand < 0.60) return 'completed';      // 60% chance
      if (rand < 0.65) return 'in-progress';    // 5% chance
      if (rand < 0.67) return 'blocked';        // 2% chance
      return 'pending';                         // 33% chance (remaining)
    } else {
      // For future tasks: equal 25% probability for each status
      const rand = Math.random();
      if (rand < 0.25) return 'completed';      // 25% chance
      if (rand < 0.50) return 'in-progress';    // 25% chance
      if (rand < 0.75) return 'blocked';        // 25% chance
      return 'pending';                         // 25% chance
    }
  })();
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
    todo,
    tags,
    attachments,
    comments,
    subtasks,
    emoji
  };
}

// CRUD operations for todos
export async function createTodo(todoData: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>): Promise<Todo> {
  const db = await getDB();
  const now = new Date();
  const todo: Todo = {
    id: generateId(),
    ...todoData,
    createdAt: now,
    updatedAt: now
  };
  await db.todos.add(todo);
  return todo;
}

export async function getTodoById(id: string): Promise<Todo | undefined> {
  const db = await getDB();
  return db.todos.get(id);
}

export async function updateTodo(id: string, todoData: Partial<Todo>): Promise<Todo> {
  const db = await getDB();
  const todo = await getTodoById(id);
  if (!todo) {
    throw new Error(`Todo with id ${id} not found`);
  }

  const updatedTodo: Todo = {
    ...todo,
    ...todoData,
    id, // Ensure ID doesn't change
    updatedAt: new Date()
  };

  await db.todos.put(updatedTodo);
  return updatedTodo;
}

export async function deleteTodo(id: string): Promise<void> {
  const db = await getDB();
  await db.todos.delete(id);
}

// Database operations
export async function getAllTodos(): Promise<Todo[]> {
  const db = await getDB();
  return db.todos.toArray();
}

export async function createRandomTodo(startDate?: Date, endDate?: Date): Promise<Todo> {
  const db = await getDB();
  const todoData = generateRandomTodoData(startDate, endDate);

  // 85% chance to create a subtask if there are existing todos
  const existingTodos = await getAllTodos();
  if (existingTodos.length > 0 && Math.random() < 0.85) {
    const parentTodo = existingTodos[Math.floor(Math.random() * existingTodos.length)];
    todoData.parentId = parentTodo.id;
    todoData.path = buildPath(parentTodo.path, todoData.parentId);
    todoData.level = parentTodo.level + 1;
  }

  return createTodo(todoData);
}

export async function createMultipleRandomTodos(count: number, startDate?: Date, endDate?: Date): Promise<Todo[]> {
  const todos: Todo[] = [];
  for (let i = 0; i < count; i++) {
    todos.push(await createRandomTodo(startDate, endDate));
  }
  return todos;
}

export async function clearAllTodos(): Promise<{ success: boolean; message: string }> {
  const db = await getDB();
  await db.todos.clear();
  return { success: true, message: 'All todos cleared successfully' };
}

export async function loadTestData(): Promise<{ success: boolean; message: string; todos: Todo[] }> {
  try {
    const db = await getDB();

    // Fetch the test data from the JSON file
    const response = await fetch('/data/tasks.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch test data: ${response.statusText}`);
    }

    const testData = await response.json();
    console.log('DEBUG - Raw test data from JSON:', testData);

    // Process dates in the test data
    const processedData = testData.map((todo: any) => {
      const processed = {
        ...todo,
        deadline: todo.deadline ? new Date(todo.deadline) : null,
        finishBy: todo.finishBy ? new Date(todo.finishBy) : null,
        todo: todo.todo ? new Date(todo.todo) : null,
        createdAt: new Date(todo.createdAt),
        updatedAt: new Date(todo.updatedAt)
      };
      console.log('DEBUG - Processed test data item:', {
        id: processed.id,
        title: processed.title,
        status: processed.status,
        deadline: processed.deadline ? processed.deadline.toISOString() : null,
        finishBy: processed.finishBy ? processed.finishBy.toISOString() : null,
        todo: processed.todo ? processed.todo.toISOString() : null
      });
      return processed;
    });

    // Add the test data to the database
    await db.todos.bulkPut(processedData);

    return {
      success: true,
      message: `Loaded ${processedData.length} test todos successfully`,
      todos: processedData
    };
  } catch (error) {
    console.error('Failed to load test data:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to load test data',
      todos: []
    };
  }
}
