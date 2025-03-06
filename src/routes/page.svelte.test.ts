import { describe, test, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/svelte';
import Page from './+page.svelte';

// Mock the environment module
vi.mock('$env/dynamic/public', () => ({
	env: {
		PUBLIC_TODO_TABLE_NAME: 'todos'
	}
}));

// Mock the database functions
vi.mock('../lib/client/db', () => ({
	initializeDB: vi.fn().mockResolvedValue(undefined),
	loadTodos: vi.fn().mockResolvedValue([]),
	resetDatabase: vi.fn().mockResolvedValue({ success: true, message: 'Database reset successfully' }),
	addNewTodo: vi.fn().mockResolvedValue({ success: true, message: 'Todo added successfully' }),
	addMultipleTodos: vi.fn().mockResolvedValue({ success: true, message: 'Todos added successfully' }),
	loadWeekEvents: vi.fn().mockResolvedValue([])
}));

describe('/+page.svelte', () => {
	test('should render h1', () => {
		render(Page);
		// Use getAllByRole instead of getByRole since there are multiple h1 elements
		const headings = screen.getAllByRole('heading', { level: 1 });
		expect(headings.length).toBeGreaterThan(0);
	});
});
