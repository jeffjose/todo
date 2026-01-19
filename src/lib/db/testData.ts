import { createTask, clearAllTasks } from './tasks';
import type { NewTask, TaskPriority } from '$lib/types';

const taskTitles = [
	'Review quarterly report',
	'Update project documentation',
	'Fix login bug',
	'Prepare presentation slides',
	'Send invoice to client',
	'Schedule team meeting',
	'Deploy new feature',
	'Write unit tests',
	'Code review PR #42',
	'Update dependencies',
	'Research new framework',
	'Create wireframes',
	'Set up CI/CD pipeline',
	'Optimize database queries',
	'Draft marketing email',
	'Respond to customer feedback',
	'Plan sprint backlog',
	'Refactor auth module',
	'Design new logo',
	'Configure monitoring alerts',
	'Write API documentation',
	'Test payment flow',
	'Update privacy policy',
	'Onboard new team member',
	'Archive old projects'
];

const priorities: TaskPriority[] = ['P0', 'P1', 'P2', 'P3'];

function randomDate(startOffset: number, endOffset: number): Date {
	const now = new Date();
	const start = new Date(now);
	start.setDate(start.getDate() + startOffset);
	const end = new Date(now);
	end.setDate(end.getDate() + endOffset);

	const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
	date.setHours(0, 0, 0, 0);
	return date;
}

function randomChoice<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export async function generateTestData(count: number = 15): Promise<void> {
	// Clear existing tasks first
	await clearAllTasks();

	const usedTitles = new Set<string>();

	for (let i = 0; i < count; i++) {
		// Get a unique title
		let title: string;
		do {
			title = randomChoice(taskTitles);
		} while (usedTitles.has(title) && usedTitles.size < taskTitles.length);
		usedTitles.add(title);

		// Randomly decide which date field to set (can have multiple)
		const hasDeadline = Math.random() < 0.4;
		const hasFinishBy = Math.random() < 0.4;
		const hasTodo = Math.random() < 0.3;

		// If no date, give it a todo date
		const needsDate = !hasDeadline && !hasFinishBy && !hasTodo;

		const task: NewTask = {
			title,
			status: Math.random() < 0.2 ? 'completed' : 'pending',
			priority: randomChoice(priorities),
			deadline: hasDeadline ? randomDate(-7, 14) : undefined,
			finishBy: hasFinishBy ? randomDate(-7, 14) : undefined,
			todo: hasTodo || needsDate ? randomDate(-3, 7) : undefined,
			tags: []
		};

		// If completed, set completed date
		if (task.status === 'completed') {
			task.completed = randomDate(-7, 0);
		}

		await createTask(task);
	}
}
