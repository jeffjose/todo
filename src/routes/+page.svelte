<script lang="ts">
	import { onMount } from 'svelte';
	import {
		addNewTodo,
		addMultipleTodos,
		clearAllTodos,
		loadTodos,
		type Todo
	} from '$lib/client/db';
	import { Button } from '$lib/components/ui/button';
	import WeeklyView from '$lib/components/WeeklyView.svelte';
	import TodoList from '$lib/components/TodoList.svelte';

	let todos = $state<Todo[]>([]);
	let notification = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	let expandedTodoId = $state<string | null>(null);
	let isLoading = $state<boolean>(false);
	let showClearConfirm = $state<boolean>(false);
	let lastLoadTime = $state<number>(0);
	let showPerformanceStats = $state<boolean>(false);
	let performanceHistory = $state<
		{
			operation: string;
			count: number;
			time: number;
			timestamp: Date;
			details: Record<string, any>;
		}[]
	>([]);
	let isOptimizingRender = $state(false);

	onMount(async () => {
		await loadTodosWithTiming();
	});

	async function loadTodosWithTiming() {
		const startTime = performance.now();
		todos = await loadTodos();
		const endTime = performance.now();
		lastLoadTime = endTime - startTime;

		// Add to performance history
		addPerformanceStat('load', todos.length, lastLoadTime);

		// Update the document title with the count
		document.title = `Todo (${todos.length})`;
	}

	function addPerformanceStat(
		operation: string,
		count: number,
		time: number,
		details: Record<string, any> = {}
	) {
		performanceHistory = [
			{ operation, count, time, timestamp: new Date(), details },
			...performanceHistory.slice(0, 9) // Keep last 10 operations
		];
	}

	function togglePerformanceStats() {
		showPerformanceStats = !showPerformanceStats;
	}

	async function handleAddNewTodo() {
		try {
			const result = await addNewTodo();
			if (result.success) {
				await loadTodosWithTiming();
				notification = {
					message: result.message,
					type: 'success'
				};
				// Clear notification after 3 seconds
				setTimeout(() => {
					notification = null;
				}, 3000);
			} else {
				throw new Error(result.message);
			}
		} catch (error) {
			console.error('Failed to add todo:', error);
			notification = {
				message: error instanceof Error ? error.message : 'Failed to add todo',
				type: 'error'
			};
		}
	}

	async function handleAddMultipleTodos(count: number) {
		if (isLoading) return;

		try {
			isLoading = true;
			notification = {
				message: `Adding ${count} todo items...`,
				type: 'success'
			};

			const result = await addMultipleTodos(count);

			if (result.success) {
				// Extract the time from the result message if available
				const timeMatch = result.message.match(/in (\d+\.\d+) seconds/);
				if (timeMatch && timeMatch[1]) {
					const operationTime = parseFloat(timeMatch[1]) * 1000; // Convert to ms
					addPerformanceStat('add', count, operationTime);
				}

				// Always reload todos after adding items
				await loadTodosWithTiming();

				notification = {
					message: result.message,
					type: 'success'
				};
			} else {
				throw new Error(result.message);
			}
		} catch (error) {
			console.error(`Failed to add ${count} todos:`, error);
			notification = {
				message: error instanceof Error ? error.message : `Failed to add ${count} todos`,
				type: 'error'
			};
		} finally {
			isLoading = false;
			// Clear notification after 5 seconds
			setTimeout(() => {
				notification = null;
			}, 5000);
		}
	}

	async function handleClearAllTodos() {
		if (isLoading) return;

		try {
			isLoading = true;
			showClearConfirm = false;

			notification = {
				message: 'Clearing all todo items...',
				type: 'success'
			};

			const result = await clearAllTodos();

			if (result.success) {
				// Extract the time from the result message if available
				const countMatch = result.message.match(/Cleared (\d+) todo/);
				const timeMatch = result.message.match(/in (\d+\.\d+) seconds/);

				if (countMatch && countMatch[1] && timeMatch && timeMatch[1]) {
					const count = parseInt(countMatch[1]);
					const operationTime = parseFloat(timeMatch[1]) * 1000; // Convert to ms
					addPerformanceStat('clear', count, operationTime);
				}

				await loadTodosWithTiming();
				notification = {
					message: result.message,
					type: 'success'
				};
			} else {
				throw new Error(result.message);
			}
		} catch (error) {
			console.error('Failed to clear todos:', error);
			notification = {
				message: error instanceof Error ? error.message : 'Failed to clear todos',
				type: 'error'
			};
		} finally {
			isLoading = false;
			// Clear notification after 5 seconds
			setTimeout(() => {
				notification = null;
			}, 5000);
		}
	}

	function toggleExpand(todoId: string) {
		expandedTodoId = expandedTodoId === todoId ? null : todoId;
	}

	function formatLoadTime(ms: number): string {
		if (ms < 1) return '< 1ms';
		if (ms < 1000) return `${Math.round(ms)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	// Add a function to optimize rendering performance
	function optimizeRender() {
		// Use requestAnimationFrame to ensure smooth UI updates
		if (isOptimizingRender) return;
		isOptimizingRender = true;

		requestAnimationFrame(() => {
			isOptimizingRender = false;
		});
	}
</script>

<TodoList
	{todos}
	{lastLoadTime}
	{isLoading}
	{performanceHistory}
	{showPerformanceStats}
	onTodosChange={loadTodosWithTiming}
	onTogglePerformanceStats={togglePerformanceStats}
/>
<WeeklyView />
