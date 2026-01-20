import type { Task, WeekEvent } from '$lib/types';
import { db } from './index';
import { nanoid } from 'nanoid';

// Export data structure
export interface ExportData {
	version: number;
	exportedAt: string;
	tasks: ExportTask[];
	weekEvents: ExportWeekEvent[];
}

// Simplified task for export (dates as ISO strings)
interface ExportTask {
	id: string;
	title: string;
	emoji?: string;
	deadline?: string;
	finishBy?: string;
	todo?: string;
	status: string;
	priority: string;
	parentId?: string;
	path: string;
	level: number;
	description?: string;
	tags: string[];
	completed?: string;
	createdAt: string;
	updatedAt: string;
}

interface ExportWeekEvent {
	id: string;
	weekStart: string;
	title: string;
	color?: string;
}

// Convert Task to export format
function taskToExport(task: Task): ExportTask {
	return {
		id: task.id,
		title: task.title,
		emoji: task.emoji,
		deadline: task.deadline?.toISOString(),
		finishBy: task.finishBy?.toISOString(),
		todo: task.todo?.toISOString(),
		status: task.status,
		priority: task.priority,
		parentId: task.parentId,
		path: task.path,
		level: task.level,
		description: task.description,
		tags: task.tags,
		completed: task.completed?.toISOString(),
		createdAt: task.createdAt.toISOString(),
		updatedAt: task.updatedAt.toISOString()
	};
}

// Convert export format back to Task
function exportToTask(data: ExportTask): Task {
	return {
		id: data.id,
		title: data.title,
		emoji: data.emoji,
		deadline: data.deadline ? new Date(data.deadline) : undefined,
		finishBy: data.finishBy ? new Date(data.finishBy) : undefined,
		todo: data.todo ? new Date(data.todo) : undefined,
		status: data.status as Task['status'],
		priority: data.priority as Task['priority'],
		parentId: data.parentId,
		path: data.path,
		level: data.level,
		description: data.description,
		tags: data.tags || [],
		completed: data.completed ? new Date(data.completed) : undefined,
		createdAt: new Date(data.createdAt),
		updatedAt: new Date(data.updatedAt)
	};
}

// Convert WeekEvent to export format
function eventToExport(event: WeekEvent): ExportWeekEvent {
	return {
		id: event.id,
		weekStart: event.weekStart.toISOString(),
		title: event.title,
		color: event.color
	};
}

// Convert export format back to WeekEvent
function exportToEvent(data: ExportWeekEvent): WeekEvent {
	return {
		id: data.id,
		weekStart: new Date(data.weekStart),
		title: data.title,
		color: data.color
	};
}

// Export all data to JSON
export async function exportToJSON(): Promise<string> {
	const tasks = await db.tasks.toArray();
	const weekEvents = await db.weekEvents.toArray();

	const exportData: ExportData = {
		version: 1,
		exportedAt: new Date().toISOString(),
		tasks: tasks.map(taskToExport),
		weekEvents: weekEvents.map(eventToExport)
	};

	return JSON.stringify(exportData, null, 2);
}

// Download export as file
export async function downloadExport(filename?: string): Promise<void> {
	const json = await exportToJSON();
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);

	const a = document.createElement('a');
	a.href = url;
	a.download = filename || `todo-export-${new Date().toISOString().split('T')[0]}.json`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

// Validation result
export interface ImportValidation {
	valid: boolean;
	errors: string[];
	data?: ExportData;
	summary?: {
		tasks: number;
		weekEvents: number;
	};
}

// Validate import data
export function validateImportData(jsonString: string): ImportValidation {
	const errors: string[] = [];

	try {
		const data = JSON.parse(jsonString);

		// Check version
		if (typeof data.version !== 'number') {
			errors.push('Missing or invalid version field');
		}

		// Check tasks array
		if (!Array.isArray(data.tasks)) {
			errors.push('Missing or invalid tasks array');
		} else {
			data.tasks.forEach((task: any, index: number) => {
				if (!task.id) errors.push(`Task ${index}: missing id`);
				if (!task.title) errors.push(`Task ${index}: missing title`);
				if (!task.status) errors.push(`Task ${index}: missing status`);
				if (!task.priority) errors.push(`Task ${index}: missing priority`);
			});
		}

		// Check weekEvents array
		if (!Array.isArray(data.weekEvents)) {
			errors.push('Missing or invalid weekEvents array');
		} else {
			data.weekEvents.forEach((event: any, index: number) => {
				if (!event.id) errors.push(`WeekEvent ${index}: missing id`);
				if (!event.title) errors.push(`WeekEvent ${index}: missing title`);
				if (!event.weekStart) errors.push(`WeekEvent ${index}: missing weekStart`);
			});
		}

		if (errors.length > 0) {
			return { valid: false, errors };
		}

		return {
			valid: true,
			errors: [],
			data: data as ExportData,
			summary: {
				tasks: data.tasks.length,
				weekEvents: data.weekEvents.length
			}
		};
	} catch (e) {
		return {
			valid: false,
			errors: [`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`]
		};
	}
}

// Import mode
export type ImportMode = 'replace' | 'merge';

// Import data from JSON
export async function importFromJSON(
	jsonString: string,
	mode: ImportMode = 'replace'
): Promise<{ success: boolean; imported: { tasks: number; weekEvents: number }; errors: string[] }> {
	const validation = validateImportData(jsonString);

	if (!validation.valid || !validation.data) {
		return { success: false, imported: { tasks: 0, weekEvents: 0 }, errors: validation.errors };
	}

	const data = validation.data;

	try {
		if (mode === 'replace') {
			// Clear existing data
			await db.tasks.clear();
			await db.weekEvents.clear();
		}

		// Import tasks
		const tasks = data.tasks.map(exportToTask);
		if (mode === 'merge') {
			// Generate new IDs for merge to avoid conflicts
			const idMap = new Map<string, string>();
			tasks.forEach(task => {
				const newId = nanoid(10);
				idMap.set(task.id, newId);
				task.id = newId;
			});
			// Update parentIds
			tasks.forEach(task => {
				if (task.parentId && idMap.has(task.parentId)) {
					task.parentId = idMap.get(task.parentId);
				}
			});
			// Update paths
			tasks.forEach(task => {
				let newPath = task.path;
				idMap.forEach((newId, oldId) => {
					newPath = newPath.replace(oldId, newId);
				});
				task.path = newPath;
			});
		}
		await db.tasks.bulkAdd(tasks);

		// Import week events
		const events = data.weekEvents.map(exportToEvent);
		if (mode === 'merge') {
			events.forEach(event => {
				event.id = nanoid(10);
			});
		}
		await db.weekEvents.bulkAdd(events);

		return {
			success: true,
			imported: { tasks: tasks.length, weekEvents: events.length },
			errors: []
		};
	} catch (e) {
		return {
			success: false,
			imported: { tasks: 0, weekEvents: 0 },
			errors: [`Import failed: ${e instanceof Error ? e.message : 'Unknown error'}`]
		};
	}
}

// Read file as text
export function readFileAsText(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
	});
}
