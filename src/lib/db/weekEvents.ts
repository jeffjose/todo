import { nanoid } from 'nanoid';
import { db } from './index';
import type { WeekEvent } from '$lib/types';
import { getWeekStart } from '$lib/utils/dates';

// Generate a unique ID
function generateId(): string {
	return nanoid(10);
}

// Create a new week event
export async function createWeekEvent(data: Omit<WeekEvent, 'id'>): Promise<WeekEvent> {
	const event: WeekEvent = {
		id: generateId(),
		weekStart: getWeekStart(data.weekStart), // Normalize to week start
		title: data.title,
		color: data.color
	};

	await db.weekEvents.add(event);
	return event;
}

// Get all week events
export async function getAllWeekEvents(): Promise<WeekEvent[]> {
	return db.weekEvents.toArray();
}

// Get events for a specific week
export async function getWeekEvents(weekStart: Date): Promise<WeekEvent[]> {
	const normalizedStart = getWeekStart(weekStart);
	return db.weekEvents.where('weekStart').equals(normalizedStart).toArray();
}

// Update a week event
export async function updateWeekEvent(id: string, updates: Partial<WeekEvent>): Promise<void> {
	await db.weekEvents.update(id, updates);
}

// Delete a week event
export async function deleteWeekEvent(id: string): Promise<void> {
	await db.weekEvents.delete(id);
}

// Clear all week events
export async function clearAllWeekEvents(): Promise<void> {
	await db.weekEvents.clear();
}
