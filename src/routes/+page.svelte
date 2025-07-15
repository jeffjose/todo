<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getAllTodos,
		createRandomTodo,
		createMultipleRandomTodos,
		clearAllTodos,
		loadTestData,
		type Todo
	} from '$lib/client/dexie';
	import { Button } from '$lib/components/ui/button';
	import WeeklyView from '$lib/components/WeeklyView.svelte';
	import TodoList from '$lib/components/TodoList.svelte';

	let todos: Todo[] = $state([]);
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
		const newTodos = await getAllTodos();
		const endTime = performance.now();
		lastLoadTime = endTime - startTime;

			
		// Force a new array reference to trigger reactivity
		todos = [...newTodos];

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
			const newTodo = await createRandomTodo();
			await loadTodosWithTiming();
			notification = {
				message: `New todo "${newTodo.title}" added successfully`,
				type: 'success'
			};
			// Clear notification after 3 seconds
			setTimeout(() => {
				notification = null;
			}, 3000);
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

			const startTime = performance.now();
			await createMultipleRandomTodos(count);
			const endTime = performance.now();
			const timeInSeconds = (endTime - startTime) / 1000;

			// Always reload todos after adding items
			await loadTodosWithTiming();

			notification = {
				message: `Added ${count} todo items in ${timeInSeconds.toFixed(2)} seconds`,
				type: 'success'
			};
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
		if (!showClearConfirm) {
			showClearConfirm = true;
			return;
		}

		try {
			const result = await clearAllTodos();
			await loadTodosWithTiming();
			notification = {
				message: result.message,
				type: 'success'
			};
			showClearConfirm = false;
		} catch (error) {
			console.error('Failed to clear todos:', error);
			notification = {
				message: error instanceof Error ? error.message : 'Failed to clear todos',
				type: 'error'
			};
		}
	}

	async function handleLoadTestData() {
		try {
			const result = await loadTestData();
			if (result.success) {
				await loadTodosWithTiming();
				notification = {
					message: result.message,
					type: 'success'
				};
			} else {
				notification = {
					message: result.message,
					type: 'error'
				};
			}
		} catch (error) {
			console.error('Failed to load test data:', error);
			notification = {
				message: error instanceof Error ? error.message : 'Failed to load test data',
				type: 'error'
			};
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

<WeeklyView {todos} onTodosChange={loadTodosWithTiming} />

<TodoList
	{todos}
	{lastLoadTime}
	{isLoading}
	{notification}
	{performanceHistory}
	{showPerformanceStats}
	onTodosChange={loadTodosWithTiming}
	onTogglePerformanceStats={togglePerformanceStats}
/>
