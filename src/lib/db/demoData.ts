import type { Task, TaskPriority, TaskStatus } from '$lib/types';
import { nanoid } from 'nanoid';

function generateId(): string {
	return nanoid(10);
}

function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	result.setHours(0, 0, 0, 0);
	return result;
}

interface DemoTaskInput {
	title: string;
	priority: TaskPriority;
	status?: TaskStatus;
	todo?: Date;
	finishBy?: Date;
	deadline?: Date;
	completed?: Date;
	children?: DemoTaskInput[];
}

function createDemoTask(
	input: DemoTaskInput,
	parentPath?: string,
	level: number = 0
): Task[] {
	const now = new Date();
	const id = generateId();
	const path = parentPath ? `${parentPath}.${id}` : id;

	const task: Task = {
		id,
		title: input.title,
		status: input.status || 'pending',
		priority: input.priority,
		todo: input.todo,
		finishBy: input.finishBy,
		deadline: input.deadline,
		completed: input.completed,
		parentId: parentPath ? parentPath.split('.').pop() : undefined,
		path,
		level,
		tags: [],
		createdAt: now,
		updatedAt: now
	};

	const tasks: Task[] = [task];

	// Recursively create children
	if (input.children) {
		for (const child of input.children) {
			tasks.push(...createDemoTask(child, path, level + 1));
		}
	}

	return tasks;
}

export function generateDemoData(): Task[] {
	const now = new Date();
	now.setHours(0, 0, 0, 0);

	const demoTasks: DemoTaskInput[] = [
		// === PROJECT 1: Q1 Product Launch (overdue, urgent) ===
		{
			title: 'Q1 Product Launch',
			priority: 'P0',
			todo: addDays(now, -14),
			finishBy: addDays(now, -3),
			deadline: addDays(now, 2),
			children: [
				{
					title: 'Finalize feature list',
					priority: 'P0',
					status: 'completed',
					todo: addDays(now, -14),
					finishBy: addDays(now, -10),
					deadline: addDays(now, -7),
					completed: addDays(now, -8)
				},
				{
					title: 'Complete development',
					priority: 'P0',
					todo: addDays(now, -10),
					finishBy: addDays(now, -5),
					deadline: addDays(now, -2),
					children: [
						{
							title: 'Implement auth flow',
							priority: 'P0',
							status: 'completed',
							todo: addDays(now, -10),
							finishBy: addDays(now, -7),
							deadline: addDays(now, -5),
							completed: addDays(now, -6)
						},
						{
							title: 'Build dashboard UI',
							priority: 'P1',
							status: 'completed',
							todo: addDays(now, -8),
							finishBy: addDays(now, -5),
							deadline: addDays(now, -3),
							completed: addDays(now, -4)
						},
						{
							title: 'Fix payment integration bug',
							priority: 'P0',
							todo: addDays(now, -5),
							finishBy: addDays(now, -2),
							deadline: addDays(now, 0) // Due today!
						}
					]
				},
				{
					title: 'QA testing',
					priority: 'P1',
					todo: addDays(now, -3),
					finishBy: addDays(now, 0),
					deadline: addDays(now, 1),
					children: [
						{
							title: 'Write test cases',
							priority: 'P1',
							status: 'completed',
							todo: addDays(now, -3),
							finishBy: addDays(now, -2),
							deadline: addDays(now, -1),
							completed: addDays(now, -1)
						},
						{
							title: 'Run regression tests',
							priority: 'P1',
							todo: addDays(now, -1),
							finishBy: addDays(now, 0),
							deadline: addDays(now, 1)
						}
					]
				},
				{
					title: 'Prepare launch materials',
					priority: 'P2',
					todo: addDays(now, 0),
					finishBy: addDays(now, 1),
					deadline: addDays(now, 2)
				}
			]
		},

		// === PROJECT 2: Website Redesign (current week) ===
		{
			title: 'Website Redesign',
			priority: 'P1',
			todo: addDays(now, -7),
			finishBy: addDays(now, 5),
			deadline: addDays(now, 10),
			children: [
				{
					title: 'Design mockups',
					priority: 'P1',
					status: 'completed',
					todo: addDays(now, -7),
					finishBy: addDays(now, -3),
					deadline: addDays(now, -1),
					completed: addDays(now, -2)
				},
				{
					title: 'Implement homepage',
					priority: 'P1',
					todo: addDays(now, -2),
					finishBy: addDays(now, 2),
					deadline: addDays(now, 4),
					children: [
						{
							title: 'Hero section',
							priority: 'P1',
							status: 'completed',
							todo: addDays(now, -2),
							finishBy: addDays(now, 0),
							deadline: addDays(now, 1),
							completed: addDays(now, -1)
						},
						{
							title: 'Features grid',
							priority: 'P2',
							todo: addDays(now, 0),
							finishBy: addDays(now, 1),
							deadline: addDays(now, 3)
						},
						{
							title: 'Testimonials carousel',
							priority: 'P2',
							todo: addDays(now, 1),
							finishBy: addDays(now, 2),
							deadline: addDays(now, 4)
						}
					]
				},
				{
					title: 'Mobile responsive fixes',
					priority: 'P2',
					todo: addDays(now, 3),
					finishBy: addDays(now, 5),
					deadline: addDays(now, 7)
				},
				{
					title: 'Final review & deploy',
					priority: 'P1',
					todo: addDays(now, 6),
					finishBy: addDays(now, 8),
					deadline: addDays(now, 10)
				}
			]
		},

		// === PROJECT 3: API Documentation (next week) ===
		{
			title: 'API Documentation',
			priority: 'P2',
			todo: addDays(now, 4),
			finishBy: addDays(now, 10),
			deadline: addDays(now, 14),
			children: [
				{
					title: 'Document auth endpoints',
					priority: 'P2',
					todo: addDays(now, 4),
					finishBy: addDays(now, 6),
					deadline: addDays(now, 8)
				},
				{
					title: 'Document CRUD endpoints',
					priority: 'P2',
					todo: addDays(now, 6),
					finishBy: addDays(now, 8),
					deadline: addDays(now, 10)
				},
				{
					title: 'Add code examples',
					priority: 'P3',
					todo: addDays(now, 8),
					finishBy: addDays(now, 10),
					deadline: addDays(now, 12)
				},
				{
					title: 'Review & publish',
					priority: 'P2',
					todo: addDays(now, 10),
					finishBy: addDays(now, 12),
					deadline: addDays(now, 14)
				}
			]
		},

		// === STANDALONE TASKS ===
		{
			title: 'Team standup notes',
			priority: 'P3',
			todo: addDays(now, 0),
			finishBy: addDays(now, 0),
			deadline: addDays(now, 0)
		},
		{
			title: 'Review pull request #247',
			priority: 'P1',
			todo: addDays(now, -1),
			finishBy: addDays(now, 0),
			deadline: addDays(now, 1)
		},
		{
			title: 'Update npm dependencies',
			priority: 'P3',
			todo: addDays(now, 2),
			finishBy: addDays(now, 5),
			deadline: addDays(now, 7)
		},
		{
			title: 'Blocked - waiting on design assets',
			priority: 'P2',
			status: 'blocked',
			todo: addDays(now, -3),
			finishBy: addDays(now, 2),
			deadline: addDays(now, 5)
		},

		// === OVERDUE STANDALONE ===
		{
			title: 'Expense report (3 days overdue)',
			priority: 'P1',
			todo: addDays(now, -10),
			finishBy: addDays(now, -5),
			deadline: addDays(now, -3)
		},
		{
			title: 'Reply to client email',
			priority: 'P0',
			todo: addDays(now, -2),
			finishBy: addDays(now, -1),
			deadline: addDays(now, 0) // Due today
		}
	];

	// Generate all tasks
	const allTasks: Task[] = [];
	for (const taskInput of demoTasks) {
		allTasks.push(...createDemoTask(taskInput));
	}

	return allTasks;
}
