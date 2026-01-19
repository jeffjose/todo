import { nanoid } from 'nanoid';
import { db } from './index';
import type { Task, NewTask, TaskStatus } from '$lib/types';

// Generate a unique ID
function generateId(): string {
	return nanoid(10);
}

// Generate path for a task
async function generatePath(parentId?: string): Promise<{ path: string; level: number }> {
	if (!parentId) {
		return { path: generateId(), level: 0 };
	}

	const parent = await db.tasks.get(parentId);
	if (!parent) {
		return { path: generateId(), level: 0 };
	}

	return {
		path: `${parent.path}.${generateId()}`,
		level: parent.level + 1
	};
}

// Create a new task
export async function createTask(data: NewTask): Promise<Task> {
	const now = new Date();
	const { path, level } = await generatePath(data.parentId);

	const task: Task = {
		id: generateId(),
		title: data.title,
		emoji: data.emoji,
		deadline: data.deadline,
		finishBy: data.finishBy,
		todo: data.todo,
		status: data.status,
		priority: data.priority,
		parentId: data.parentId,
		path,
		level,
		description: data.description,
		tags: data.tags || [],
		completed: data.completed,
		createdAt: now,
		updatedAt: now
	};

	await db.tasks.add(task);
	return task;
}

// Get all tasks
export async function getAllTasks(): Promise<Task[]> {
	return db.tasks.toArray();
}

// Get a task by ID
export async function getTask(id: string): Promise<Task | undefined> {
	return db.tasks.get(id);
}

// Update a task
export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
	await db.tasks.update(id, {
		...updates,
		updatedAt: new Date()
	});
}

// Delete a task
export async function deleteTask(id: string): Promise<void> {
	// Also delete all children
	const task = await db.tasks.get(id);
	if (task) {
		// Delete children (tasks whose path starts with this task's path)
		const children = await db.tasks.where('path').startsWith(task.path + '.').toArray();
		const childIds = children.map((c) => c.id);
		await db.tasks.bulkDelete([id, ...childIds]);
	} else {
		await db.tasks.delete(id);
	}
}

// Toggle task status between pending and completed
export async function toggleTaskStatus(id: string): Promise<void> {
	const task = await db.tasks.get(id);
	if (!task) return;

	const now = new Date();
	const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
	const completed = newStatus === 'completed' ? now : undefined;

	await db.tasks.update(id, {
		status: newStatus,
		completed,
		updatedAt: now
	});
}

// Cycle task priority (P0 -> P1 -> P2 -> P3 -> P0)
export async function cycleTaskPriority(id: string): Promise<void> {
	const task = await db.tasks.get(id);
	if (!task) return;

	const priorities = ['P0', 'P1', 'P2', 'P3'] as const;
	const currentIndex = priorities.indexOf(task.priority);
	const nextIndex = (currentIndex + 1) % priorities.length;

	await db.tasks.update(id, {
		priority: priorities[nextIndex],
		updatedAt: new Date()
	});
}

// Clear all tasks
export async function clearAllTasks(): Promise<void> {
	await db.tasks.clear();
}
