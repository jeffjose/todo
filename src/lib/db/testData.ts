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

function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	result.setHours(0, 0, 0, 0);
	return result;
}

function randomChoice<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

export async function generateTestData(count: number = 15): Promise<void> {
	// Clear existing tasks first
	await clearAllTasks();

	const usedTitles = new Set<string>();
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	for (let i = 0; i < count; i++) {
		// Get a unique title
		let title: string;
		do {
			title = randomChoice(taskTitles);
		} while (usedTitles.has(title) && usedTitles.size < taskTitles.length);
		usedTitles.add(title);

		// Generate dates in logical order: todo <= finishBy <= deadline
		// Start todo somewhere between -3 days (past) and +7 days (future)
		const todoOffset = randomInt(-3, 7);
		const todo = addDays(now, todoOffset);

		// finishBy is 2-5 days after todo
		const finishByGap = randomInt(2, 5);
		const finishBy = addDays(todo, finishByGap);

		// deadline is 1-4 days after finishBy
		const deadlineGap = randomInt(1, 4);
		const deadline = addDays(finishBy, deadlineGap);

		const task: NewTask = {
			title,
			status: Math.random() < 0.15 ? 'completed' : 'pending',
			priority: randomChoice(priorities),
			todo,
			finishBy,
			deadline,
			tags: []
		};

		// If completed, set completed date (sometime before or on the deadline)
		if (task.status === 'completed') {
			const completedOffset = randomInt(-3, 0);
			task.completed = addDays(now, completedOffset);
		}

		await createTask(task);
	}
}
