import { createTask, clearAllTasks } from './tasks';
import type { NewTask, TaskPriority } from '$lib/types';

const taskTitles = [
	'Review Q4 quarterly report',
	'Update API documentation',
	'Fix login redirect bug',
	'Prepare board presentation',
	'Send January invoice',
	'Schedule design review',
	'Deploy auth feature',
	'Write integration tests',
	'Review PR #142 - payments',
	'Update npm dependencies',
	'Research React 19 features',
	'Create mobile wireframes',
	'Set up GitHub Actions',
	'Optimize slow queries',
	'Draft newsletter email',
	'Review user feedback survey',
	'Plan Q1 sprint backlog',
	'Refactor user service',
	'Design app icon variants',
	'Configure Datadog alerts',
	'Document REST endpoints',
	'Test Stripe integration',
	'Update cookie consent',
	'Onboard Sarah (frontend)',
	'Archive 2024 projects',
	'Migrate to PostgreSQL 16',
	'Add dark mode toggle',
	'Fix mobile nav overflow',
	'Create admin dashboard',
	'Setup Redis caching'
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

// Descriptive test data with self-explanatory titles
export async function generateDescriptiveTestData(): Promise<void> {
	await clearAllTasks();

	const now = new Date();
	now.setHours(0, 0, 0, 0);

	// Helper to get day name
	const getDayName = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long' });

	const descriptiveTasks: NewTask[] = [
		// === OVERDUE (deadline passed) ===
		{
			title: `Deadline was 3 days ago (overdue)`,
			status: 'pending',
			priority: 'P0',
			todo: addDays(now, -10),
			finishBy: addDays(now, -5),
			deadline: addDays(now, -3),
			tags: []
		},
		{
			title: `Deadline was yesterday (overdue)`,
			status: 'pending',
			priority: 'P1',
			todo: addDays(now, -7),
			finishBy: addDays(now, -3),
			deadline: addDays(now, -1),
			tags: []
		},

		// === SLIPPED (finishBy passed, deadline still future) ===
		{
			title: `Should have finished 5 days ago (slipped)`,
			status: 'pending',
			priority: 'P1',
			todo: addDays(now, -12),
			finishBy: addDays(now, -5),
			deadline: addDays(now, 2),
			tags: []
		},
		{
			title: `FinishBy was 2 days ago (slipped)`,
			status: 'pending',
			priority: 'P2',
			todo: addDays(now, -8),
			finishBy: addDays(now, -2),
			deadline: addDays(now, 5),
			tags: []
		},

		// === TODO PASSED (promoted, shown with dot) ===
		{
			title: `Todo was last week, still on track`,
			status: 'pending',
			priority: 'P2',
			todo: addDays(now, -7),
			finishBy: addDays(now, 3),
			deadline: addDays(now, 7),
			tags: []
		},
		{
			title: `Should have started 3 days ago`,
			status: 'pending',
			priority: 'P3',
			todo: addDays(now, -3),
			finishBy: addDays(now, 4),
			deadline: addDays(now, 8),
			tags: []
		},

		// === DUE TODAY ===
		{
			title: `Deadline is TODAY`,
			status: 'pending',
			priority: 'P0',
			todo: addDays(now, -5),
			finishBy: addDays(now, -1),
			deadline: now,
			tags: []
		},
		{
			title: `Must finish TODAY (finishBy)`,
			status: 'pending',
			priority: 'P1',
			todo: addDays(now, -3),
			finishBy: now,
			deadline: addDays(now, 3),
			tags: []
		},

		// === DUE TOMORROW ===
		{
			title: `Deadline tomorrow`,
			status: 'pending',
			priority: 'P1',
			todo: addDays(now, -4),
			finishBy: addDays(now, 0),
			deadline: addDays(now, 1),
			tags: []
		},

		// === DUE THIS WEEK ===
		{
			title: `Due ${getDayName(addDays(now, 3))} (3 days)`,
			status: 'pending',
			priority: 'P2',
			todo: addDays(now, -1),
			finishBy: addDays(now, 1),
			deadline: addDays(now, 3),
			tags: []
		},
		{
			title: `Due ${getDayName(addDays(now, 5))} (5 days)`,
			status: 'pending',
			priority: 'P2',
			todo: addDays(now, 0),
			finishBy: addDays(now, 3),
			deadline: addDays(now, 5),
			tags: []
		},

		// === DUE NEXT WEEK ===
		{
			title: `Due next ${getDayName(addDays(now, 8))} (8 days)`,
			status: 'pending',
			priority: 'P3',
			todo: addDays(now, 2),
			finishBy: addDays(now, 5),
			deadline: addDays(now, 8),
			tags: []
		},
		{
			title: `Due in 10 days`,
			status: 'pending',
			priority: 'P3',
			todo: addDays(now, 3),
			finishBy: addDays(now, 7),
			deadline: addDays(now, 10),
			tags: []
		},

		// === FUTURE (2+ weeks) ===
		{
			title: `Due in 2 weeks`,
			status: 'pending',
			priority: 'P3',
			todo: addDays(now, 7),
			finishBy: addDays(now, 11),
			deadline: addDays(now, 14),
			tags: []
		},

		// === COMPLETED ===
		{
			title: `Completed yesterday`,
			status: 'completed',
			priority: 'P1',
			todo: addDays(now, -7),
			finishBy: addDays(now, -3),
			deadline: addDays(now, -1),
			completed: addDays(now, -1),
			tags: []
		},
		{
			title: `Completed 3 days ago`,
			status: 'completed',
			priority: 'P2',
			todo: addDays(now, -10),
			finishBy: addDays(now, -5),
			deadline: addDays(now, -3),
			completed: addDays(now, -3),
			tags: []
		},
		{
			title: `Completed last week (was overdue)`,
			status: 'completed',
			priority: 'P0',
			todo: addDays(now, -14),
			finishBy: addDays(now, -10),
			deadline: addDays(now, -8),
			completed: addDays(now, -6),
			tags: []
		},

		// === BLOCKED ===
		{
			title: `Blocked - waiting on API team`,
			status: 'blocked',
			priority: 'P1',
			todo: addDays(now, -5),
			finishBy: addDays(now, 2),
			deadline: addDays(now, 5),
			tags: []
		},

		// === NO DATES (edge case) ===
		{
			title: `Task with no dates (unscheduled)`,
			status: 'pending',
			priority: 'P3',
			tags: []
		},

		// === ONLY TODO (suggestion only) ===
		{
			title: `Only has todo date (today)`,
			status: 'pending',
			priority: 'P2',
			todo: now,
			tags: []
		},
		{
			title: `Only has todo date (past)`,
			status: 'pending',
			priority: 'P3',
			todo: addDays(now, -4),
			tags: []
		}
	];

	for (const task of descriptiveTasks) {
		await createTask(task);
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
