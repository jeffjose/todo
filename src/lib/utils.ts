import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type TaskStatus = { type: 'overdue'; daysOverdue: number } | { type: 'slipped' } | null;

/**
 * Determines the status of a task based on its deadline and finishBy dates
 * @param todo The task to check
 * @param weekStartDate The start date of the week being displayed
 * @returns { type: 'overdue', daysOverdue: number } if task has past deadline
 *          { type: 'slipped' } if task has past finishBy date but future/no deadline
 *          null if task is completed or has no status indicators
 */
export function getTaskStatus(todo: {
	status: string;
	deadline: Date | null;
	finishBy: Date | null;
}, weekStartDate: Date): TaskStatus {
	// Show overdue status even for completed tasks
	const now = new Date();
	now.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison

	// Task is overdue if it has a deadline in the past
	if (todo.deadline && todo.deadline < now) {
		const daysOverdue = Math.ceil((now.getTime() - todo.deadline.getTime()) / (1000 * 60 * 60 * 24));
		return { type: 'overdue', daysOverdue };
	}

	// Task is slipped if it has a finishBy date in the past but either:
	// 1. Has no deadline, or
	// 2. Has a deadline that's in the future
	if (todo.finishBy && todo.finishBy < now) {
		if (!todo.deadline || todo.deadline >= now) {
			return { type: 'slipped' };
		}
	}

	return null;
}
