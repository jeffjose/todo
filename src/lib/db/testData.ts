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

// Different task scenarios for realistic test data
type TaskScenario = 'slipped' | 'urgent' | 'current' | 'upcoming' | 'future';

function getScenarioDates(scenario: TaskScenario, now: Date): { todo: Date; finishBy: Date; deadline: Date } {
	switch (scenario) {
		case 'slipped':
			// Todo was last week, deadline is today or this week (you're behind!)
			const slippedTodo = addDays(now, randomInt(-14, -7));
			const slippedFinishBy = addDays(slippedTodo, randomInt(3, 6));
			const slippedDeadline = addDays(slippedFinishBy, randomInt(2, 5));
			return { todo: slippedTodo, finishBy: slippedFinishBy, deadline: slippedDeadline };

		case 'urgent':
			// Todo was a few days ago, deadline is today or tomorrow
			const urgentTodo = addDays(now, randomInt(-5, -2));
			const urgentFinishBy = addDays(urgentTodo, randomInt(2, 4));
			const urgentDeadline = addDays(now, randomInt(0, 2)); // deadline around now
			return { todo: urgentTodo, finishBy: urgentFinishBy, deadline: urgentDeadline };

		case 'current':
			// Todo is this week, deadline is next week
			const currentTodo = addDays(now, randomInt(-2, 3));
			const currentFinishBy = addDays(currentTodo, randomInt(2, 4));
			const currentDeadline = addDays(currentFinishBy, randomInt(2, 4));
			return { todo: currentTodo, finishBy: currentFinishBy, deadline: currentDeadline };

		case 'upcoming':
			// Todo is next week
			const upcomingTodo = addDays(now, randomInt(4, 10));
			const upcomingFinishBy = addDays(upcomingTodo, randomInt(2, 5));
			const upcomingDeadline = addDays(upcomingFinishBy, randomInt(2, 4));
			return { todo: upcomingTodo, finishBy: upcomingFinishBy, deadline: upcomingDeadline };

		case 'future':
			// Todo is 2+ weeks out
			const futureTodo = addDays(now, randomInt(11, 18));
			const futureFinishBy = addDays(futureTodo, randomInt(3, 5));
			const futureDeadline = addDays(futureFinishBy, randomInt(2, 4));
			return { todo: futureTodo, finishBy: futureFinishBy, deadline: futureDeadline };
	}
}

export async function generateTestData(count: number = 20): Promise<void> {
	// Clear existing tasks first
	await clearAllTasks();

	const usedTitles = new Set<string>();
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	// Distribution of scenarios for realistic mix
	const scenarios: TaskScenario[] = [
		'slipped', 'slipped', 'slipped',     // 3 slipped (past week todo, deadline now-ish)
		'urgent', 'urgent',                   // 2 urgent (deadline today/tomorrow)
		'current', 'current', 'current', 'current', 'current', 'current',  // 6 current week
		'upcoming', 'upcoming', 'upcoming', 'upcoming',  // 4 upcoming
		'future', 'future', 'future'          // 3 future
	];

	const taskCount = Math.min(count, scenarios.length, taskTitles.length);

	for (let i = 0; i < taskCount; i++) {
		// Get a unique title
		let title: string;
		do {
			title = randomChoice(taskTitles);
		} while (usedTitles.has(title) && usedTitles.size < taskTitles.length);
		usedTitles.add(title);

		const scenario = scenarios[i];
		const { todo, finishBy, deadline } = getScenarioDates(scenario, now);

		// Slipped and urgent tasks are more likely to be high priority
		let priority: TaskPriority;
		if (scenario === 'slipped' || scenario === 'urgent') {
			priority = randomChoice(['P0', 'P0', 'P1', 'P1', 'P2']);
		} else {
			priority = randomChoice(priorities);
		}

		const task: NewTask = {
			title,
			status: Math.random() < 0.1 ? 'completed' : 'pending',
			priority,
			todo,
			finishBy,
			deadline,
			tags: []
		};

		// If completed, set completed date
		if (task.status === 'completed') {
			task.completed = addDays(now, randomInt(-5, 0));
		}

		await createTask(task);
	}
}
