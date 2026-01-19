export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'blocked';
export type TaskPriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface Task {
	id: string;
	title: string;
	emoji?: string;

	// The 3 key dates
	deadline?: Date;
	finishBy?: Date;
	todo?: Date;

	// Status
	status: TaskStatus;
	priority: TaskPriority;

	// Hierarchy
	parentId?: string;
	path: string;
	level: number;

	// Metadata
	description?: string;
	tags: string[];
	completed?: Date;
	createdAt: Date;
	updatedAt: Date;
}

export interface WeekEvent {
	id: string;
	weekStart: Date;
	title: string;
	color?: string;
}

// Helper type for creating a new task
export type NewTask = Omit<Task, 'id' | 'path' | 'level' | 'createdAt' | 'updatedAt'> & {
	parentId?: string;
};
