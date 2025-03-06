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

// Mock the Dexie functions
vi.mock('$lib/client/dexie', () => ({
	initializeDB: vi.fn().mockResolvedValue(undefined),
	getAllTodos: vi.fn().mockResolvedValue([]),
	clearAllTodos: vi.fn().mockResolvedValue({ success: true, message: 'Database reset successfully' }),
	createRandomTodo: vi.fn().mockResolvedValue({ id: '1', title: 'Test Todo', status: 'pending' }),
	createMultipleRandomTodos: vi.fn().mockResolvedValue([
		{ id: '1', title: 'Test Todo 1', status: 'pending' },
		{ id: '2', title: 'Test Todo 2', status: 'pending' }
	])
}));

describe('/+page.svelte', () => {
	test('should render h1', () => {
		render(Page);
		// Use getAllByRole instead of getByRole since there are multiple h1 elements
		const headings = screen.getAllByRole('heading', { level: 1 });
		expect(headings.length).toBeGreaterThan(0);
	});
});
