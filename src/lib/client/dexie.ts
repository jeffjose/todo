import Dexie, { type Table } from 'dexie';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import { customAlphabet } from 'nanoid';
import type { User, Session } from '$lib/server/auth';
import { load } from 'js-yaml';

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

export interface UrlMetadata {
  url: string;
  title: string | null;
  favicon: string | null;
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
  urls: UrlMetadata[];  // New field for URLs with metadata
  comments: Comment[];
  subtasks: SubTask[];
  path: string;
  level: number;
  parentId: string | null;
  completed: Date | null;  // Track when the task was completed
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
    this.version(4).stores({  // Increment version for schema change
      todos: '++id, title, status, priority, urgency, path, level, parentId, createdAt, updatedAt, deadline, finishBy, todo, tags, completed',
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
  const emoji = theme.emoji[Math.floor(Math.random() * theme.emoji.length)];

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
    // Calculate number of business days between today and deadline
    let numBusinessDays = 0;
    let currentDate = new Date();
    while (currentDate <= deadline) {
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        numBusinessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    const maxBusinessDaysBeforeDeadline = Math.min(5, numBusinessDays - 1);
    const numBusinessDaysBeforeDeadline = Math.floor(Math.random() * maxBusinessDaysBeforeDeadline) + 1;
    for (let i = 0; i < numBusinessDaysBeforeDeadline; i++) {
      finishBy = getNextBusinessDay(finishBy);
    }
  }
  finishBy = getRandomBusinessTime(finishBy);

  // Ensure finishBy is before or equal to deadline
  if (finishBy.getTime() > deadline.getTime()) {
    finishBy = new Date(deadline);
    finishBy = getRandomBusinessTime(finishBy);
  }

  // 10% chance to set a todo date between now and finishBy
  let todo: Date | null = null;
  if (Math.random() < 0.1) {
    // Start with finishBy and work backwards
    todo = new Date(finishBy);
    const maxDaysBack = Math.floor((finishBy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (maxDaysBack > 0) {
      const daysBack = Math.floor(Math.random() * maxDaysBack);
      todo.setDate(todo.getDate() - daysBack);
      while (todo.getDay() === 0 || todo.getDay() === 6) {
        todo = getNextBusinessDay(todo);
      }
    }
    todo = getRandomBusinessTime(todo);

    // Final safety check
    if (todo.getTime() > finishBy.getTime()) {
      todo = new Date(finishBy);
      todo = getRandomBusinessTime(todo);
    }
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

  // Generate random URLs with metadata
  const numUrls = Math.floor(Math.random() * 3);
  const urls: UrlMetadata[] = [];
  const sampleUrls = [
    {
      url: 'https://github.com',
      title: 'GitHub: Where the world builds software',
      favicon: 'https://github.githubassets.com/favicons/favicon.svg',
    },
    {
      url: 'https://stackoverflow.com',
      title: 'Stack Overflow - Where Developers Learn & Share',
      favicon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico',
    },
    {
      url: 'https://www.notion.so',
      title: 'Notion – One workspace. Every team.',
      favicon: 'https://www.notion.so/images/favicon.ico',
    },
    {
      url: 'https://www.figma.com',
      title: 'Figma: The Collaborative Interface Design Tool',
      favicon: 'https://static.figma.com/app/icon/1/favicon.svg',
    }
  ];

  for (let i = 0; i < numUrls; i++) {
    const sampleUrl = sampleUrls[Math.floor(Math.random() * sampleUrls.length)];
    urls.push({
      url: sampleUrl.url,
      title: sampleUrl.title,
      favicon: sampleUrl.favicon
    });
  }

  return {
    title,
    description,
    emoji,
    deadline,
    finishBy,
    todo,
    status,
    priority,
    urgency,
    tags,
    attachments,
    urls,  // Add the URLs array
    comments,
    subtasks: [],
    path: `root.${generateId()}`,
    level: 0,
    parentId: null,
    completed: null
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
    const allTodos: Todo[] = [];

    // First try to load from YAML
    try {
      const yamlResponse = await fetch('/data/initial_tasks.yaml');
      if (yamlResponse.ok) {
        const yamlText = await yamlResponse.text();
        const data = load(yamlText);
        const tasks = data.tasks;

        // Process YAML tasks
        for (const task of tasks) {
          const id = generateId();
          const now = new Date();
          const todo: Todo = {
            id,
            title: task.title,
            status: task.status || 'pending',
            deadline: task.deadline ? new Date(task.deadline) : null,
            finishBy: task.finishBy ? new Date(task.finishBy) : (task.deadline ? new Date(task.deadline) : null),
            todo: task.todo ? new Date(task.todo) : null,
            priority: task.priority || 'P3',
            emoji: task.emoji || null,
            description: task.description || null,
            urgency: task.urgency || 'medium',
            tags: task.tags || [],
            attachments: [],
            comments: [],
            subtasks: [],
            path: `root.${id}`,
            level: 0,
            parentId: null,
            completed: task.completed ? new Date(task.completed) : null,
            createdAt: now,
            updatedAt: now
          };
          allTodos.push(todo);

          // Process subtasks if they exist
          if (task.subtasks) {
            for (const subtask of task.subtasks) {
              const subtaskId = generateId();
              const subtaskTodo: Todo = {
                id: subtaskId,
                title: subtask.title,
                status: subtask.status || 'pending',
                deadline: subtask.deadline ? new Date(subtask.deadline) : null,
                finishBy: subtask.finishBy ? new Date(subtask.finishBy) : null,
                todo: subtask.todo ? new Date(subtask.todo) : null,
                priority: subtask.priority || 'P3',
                emoji: subtask.emoji || null,
                description: subtask.description || null,
                urgency: subtask.urgency || 'medium',
                tags: subtask.tags || [],
                attachments: [],
                comments: [],
                subtasks: [],
                path: `root.${id}.${subtaskId}`,
                level: 1,
                parentId: id,
                completed: subtask.completed ? new Date(subtask.completed) : null,
                createdAt: now,
                updatedAt: now
              };
              allTodos.push(subtaskTodo);
            }
          }
        }
      } else {
        console.warn('Failed to load YAML file:', yamlResponse.statusText);
      }
    } catch (error) {
      console.warn('Failed to load YAML tasks:', error);
    }

    // Then try to load from JSON only if it exists and has content
    try {
      const response = await fetch('/data/tasks.json');
      if (response.ok) {
        const text = await response.text();
        if (text.trim()) {  // Only process if the file has content
          const testData = JSON.parse(text);
          const processedData = testData.map((todo: any) => ({
            ...todo,
            deadline: todo.deadline ? new Date(todo.deadline) : null,
            finishBy: todo.finishBy ? new Date(todo.finishBy) : null,
            todo: todo.todo ? new Date(todo.todo) : null,
            completed: null,
            createdAt: new Date(todo.createdAt),
            updatedAt: new Date(todo.updatedAt)
          }));
          allTodos.push(...processedData);
        }
      }
    } catch (error) {
      console.warn('Failed to load JSON tasks:', error);
    }

    // Clear existing todos and add all loaded todos
    await db.todos.clear();
    await db.todos.bulkPut(allTodos);

    return {
      success: true,
      message: `Loaded ${allTodos.length} todos successfully`,
      todos: allTodos
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

// Helper function to parse CSV string
function parseCSV(csv: string): any[] {
  const lines = csv.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: any = {};

    headers.forEach((header, index) => {
      let value = values[index];

      // Handle quoted values
      if (value?.startsWith('"') && value?.endsWith('"')) {
        value = value.slice(1, -1);
      }

      // Handle empty values
      if (value === '') {
        value = null;
      }

      // Handle array values (like tags)
      if (header === 'tags' && value) {
        value = value.split(',').map((tag: string) => tag.trim());
      }

      row[header] = value;
    });

    return row;
  });
}

export async function loadInitialTasks(): Promise<{ success: boolean; message: string; todos: Todo[] }> {
  try {
    const db = await getDB();

    // Clear existing todos first
    await db.todos.clear();

    // Fetch the YAML file
    const yamlResponse = await fetch('/data/initial_tasks.yaml');
    if (yamlResponse.ok) {
      const yamlText = await yamlResponse.text();
      console.log('DEBUG - Raw YAML text:', yamlText);
      const data = load(yamlText);
      console.log('DEBUG - Parsed YAML data:', data);
      const tasks = data.tasks;
      console.log('DEBUG - Parsed YAML tasks:', tasks);

      // Process YAML tasks
      const allTodos: Todo[] = [];
      for (const task of tasks) {
        const id = generateId();
        const now = new Date();

        // Process URLs if they exist in the YAML
        const urls: UrlMetadata[] = [];
        if (task.urls && Array.isArray(task.urls)) {
          for (const urlData of task.urls) {
            urls.push({
              url: urlData.url,
              title: urlData.title || null,
              favicon: urlData.favicon || null
            });
          }
        }

        const todo: Todo = {
          id,
          title: task.title,
          status: task.status || 'pending',
          deadline: task.deadline ? new Date(task.deadline) : null,
          finishBy: task.finishBy ? new Date(task.finishBy) : (task.deadline ? new Date(task.deadline) : null),
          todo: task.todo ? new Date(task.todo) : null,
          priority: task.priority || 'P3',
          emoji: task.emoji || null,
          description: task.description || null,
          urgency: task.urgency || 'medium',
          tags: task.tags || [],
          attachments: [],
          urls,  // Add the URLs array
          comments: [],
          subtasks: [],
          path: `root.${id}`,
          level: 0,
          parentId: null,
          completed: null,
          createdAt: now,
          updatedAt: now
        };
        console.log('DEBUG - Processed YAML task:', todo);
        allTodos.push(todo);
      }

      // Add all todos to the database
      await db.todos.bulkAdd(allTodos);

      return {
        success: true,
        message: `Successfully loaded ${allTodos.length} tasks`,
        todos: allTodos
      };
    } else {
      throw new Error('Failed to fetch initial tasks YAML file');
    }
  } catch (error) {
    console.error('Error loading initial tasks:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error loading initial tasks',
      todos: []
    };
  }
}

// Helper function to toggle todo status
export async function toggleTodoStatus(id: string): Promise<Todo> {
  const todo = await getTodoById(id);
  if (!todo) {
    throw new Error(`Todo with id ${id} not found`);
  }

  // Toggle between pending and completed
  const newStatus = todo.status === 'completed' ? 'pending' : 'completed';
  const completed = newStatus === 'completed' ? new Date() : null;

  return updateTodo(id, {
    status: newStatus,
    completed
  });
}

// Helper function to cycle through priorities
export async function cycleTodoPriority(id: string): Promise<Todo> {
  const todo = await getTodoById(id);
  if (!todo) {
    throw new Error(`Todo with id ${id} not found`);
  }

  // Get current priority index
  const priorities = RANDOM_DATA.priorities;
  const currentIndex = priorities.indexOf(todo.priority);

  // Get next priority (cycle back to start if at end)
  const nextIndex = (currentIndex + 1) % priorities.length;
  const newPriority = priorities[nextIndex];

  return updateTodo(id, { priority: newPriority });
}

export async function importFromYaml(yamlText: string): Promise<void> {
  try {
    const data = load(yamlText);
    const tasks = data?.tasks || [];

    for (const task of tasks) {
      const todo = {
        title: task.title,
        status: task.status || 'pending',
        deadline: task.deadline ? new Date(task.deadline) : null,
        finishBy: task.finishBy ? new Date(task.finishBy) : (task.deadline ? new Date(task.deadline) : null),
        todo: task.todo ? new Date(task.todo) : null,
        priority: task.priority || 'P2',
        emoji: task.emoji || '📝',
        description: task.description || '',
        urgency: task.urgency || 'medium',
        tags: task.tags || [],
        completed: task.completed ? new Date(task.completed) : null,
        subtasks: task.subtasks || []
      };

      await db.todos.add(todo);
    }
  } catch (error) {
    console.error('Error importing YAML:', error);
    throw error;
  }
}
