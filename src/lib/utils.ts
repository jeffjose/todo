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
 * @param simulatedDate The simulated current date (defaults to actual current date)
 * @returns { type: 'overdue', daysOverdue: number } if task has past deadline
 *          { type: 'slipped' } if task has past finishBy date but future/no deadline
 *          null if task is completed or has no status indicators
 */
export function getTaskStatus(todo: {
	status: string;
	deadline: Date | null;
	finishBy: Date | null;
}, weekStartDate: Date, simulatedDate: Date = new Date()): TaskStatus {
	// Don't show any status for completed tasks
	if (todo.status === 'completed') return null;

	// Task is overdue if it has a deadline in the past
	if (todo.deadline && todo.deadline < weekStartDate) {
		const daysOverdue = Math.ceil((simulatedDate.getTime() - todo.deadline.getTime()) / (1000 * 60 * 60 * 24));
		return { type: 'overdue', daysOverdue };
	}

	// Task is slipped if it has a finishBy date in the past but either:
	// 1. Has no deadline, or
	// 2. Has a deadline that's in the future
	// AND the task is not completed
	if (todo.finishBy && todo.finishBy < weekStartDate) {
		if (!todo.deadline || todo.deadline >= weekStartDate) {
			return { type: 'slipped' };
		}
	}

	return null;
}
