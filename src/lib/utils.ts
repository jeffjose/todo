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
	completed: Date | null;
	title?: string;
}, weekStartDate: Date): TaskStatus {
	const now = new Date();
	now.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison

	// Debug logging for GDC tasks
	if (todo.title && (todo.title.toLowerCase().includes('gdc') || todo.title.toLowerCase().includes('slides'))) {
		console.log('\nTask:', todo.title);
		console.log('Status:', todo.status);
		console.log('Deadline:', todo.deadline?.toISOString());
		console.log('Completed:', todo.completed?.toISOString());
	}

	// Task is overdue if it has a deadline in the past
	if (todo.deadline && todo.deadline < now) {
		// For completed tasks, only show overdue if completed after deadline
		if (todo.status === 'completed' && todo.completed) {
			const completedDate = new Date(todo.completed);
			const deadlineDate = new Date(todo.deadline);

			// Debug logging for GDC tasks
			if (todo.title && (todo.title.toLowerCase().includes('gdc') || todo.title.toLowerCase().includes('slides'))) {
				console.log('Comparing dates:');
				console.log('Completed timestamp:', completedDate.getTime());
				console.log('Deadline timestamp:', deadlineDate.getTime());
				console.log('Is overdue:', completedDate.getTime() > deadlineDate.getTime());
			}

			// Compare the full timestamps to handle time components correctly
			if (completedDate.getTime() > deadlineDate.getTime()) {
				const daysOverdue = Math.ceil((completedDate.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60 * 24));
				if (todo.title && (todo.title.toLowerCase().includes('gdc') || todo.title.toLowerCase().includes('slides'))) {
					console.log('Days overdue:', daysOverdue);
				}
				return { type: 'overdue', daysOverdue };
			}
		} else if (todo.status !== 'completed') {
			const daysOverdue = Math.ceil((now.getTime() - todo.deadline.getTime()) / (1000 * 60 * 60 * 24));
			return { type: 'overdue', daysOverdue };
		}
	}

	// Task is slipped if it has a finishBy date in the past
	if (todo.finishBy && todo.finishBy < now && todo.status !== 'completed') {
		return { type: 'slipped' };
	}

	return null;
}
