<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getAllTodos,
		createRandomTodo,
		createMultipleRandomTodos,
		clearAllTodos,
		loadTestData,
		type Todo,
		toggleTodoStatus,
		cycleTodoPriority
	} from '$lib/client/dexie';
	import { Button } from '$lib/components/ui/button';
	import { getTaskStatus, type TaskStatus } from '$lib/utils';

	export interface WeekEvent {
		id: string;
		startDate: Date;
		endDate: Date;
		description: string | null;
		createdAt: Date;
		updatedAt: Date;
	}

	const { todos = [], onTodosChange } = $props<{
		todos: Todo[];
		onTodosChange: () => Promise<void>;
	}>();

	let weekEvents = $state<WeekEvent[]>([]);
	let viewStartDate = $state<Date | null>(null);
	let viewEndDate = $state<Date | null>(null);
	let showClearConfirm = $state<boolean>(false);
	let notification = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	let isResetting = $state<boolean>(false);
	let hoveredTaskId = $state<string | null>(null);

	onMount(async () => {
		weekEvents = await loadData();
	});

	// Function to generate a consistent color based on an ID
	function getColorForId(id: string): string {
		// Use the ID to generate a hash
		let hash = 0;
		for (let i = 0; i < id.length; i++) {
			hash = id.charCodeAt(i) + ((hash << 5) - hash);
		}

		// Generate HSL color with fixed saturation and lightness for readability
		const hue = Math.abs(hash % 360);
		return `hsl(${hue}, 70%, 40%)`;
	}

	async function handleAddNewTodo() {
		if (!viewStartDate || !viewEndDate) return;
		try {
			const newTodo = await createRandomTodo(viewStartDate, viewEndDate);
			await onTodosChange();
			await loadData();
			notification = {
				message: `New todo "${newTodo.title}" added successfully`,
				type: 'success'
			};
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
		if (!viewStartDate || !viewEndDate) return;
		try {
			const startTime = performance.now();
			await createMultipleRandomTodos(count, viewStartDate, viewEndDate);
			const endTime = performance.now();
			const timeInSeconds = (endTime - startTime) / 1000;
			await onTodosChange();
			await loadData();
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
			setTimeout(() => {
				notification = null;
			}, 5000);
		}
	}

	async function handleClearAllTodos() {
		try {
			showClearConfirm = false;
			const result = await clearAllTodos();
			if (result.success) {
				await onTodosChange();
				await loadData();
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
			setTimeout(() => {
				notification = null;
			}, 5000);
		}
	}

	async function handleResetDatabase() {
		if (confirm('Are you sure you want to reset the database? This will delete all data.')) {
			isResetting = true;
			try {
				const result = await clearAllTodos();
				if (result.success) {
					await onTodosChange();
					await loadData();
					notification = {
						message: result.message,
						type: 'success'
					};
				} else {
					throw new Error(result.message);
				}
			} catch (error) {
				console.error('Failed to reset database:', error);
				notification = {
					message: error instanceof Error ? error.message : 'Failed to reset database',
					type: 'error'
				};
			} finally {
				isResetting = false;
				setTimeout(() => {
					notification = null;
				}, 5000);
			}
		}
	}

	async function handleLoadTestData() {
		try {
			const result = await loadTestData();
			if (result.success) {
				await onTodosChange();
				await loadData();
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
		} finally {
			setTimeout(() => {
				notification = null;
			}, 5000);
		}
	}

	async function loadData() {
		// Get the start of the current week (Monday)
		const today = new Date();
		const currentWeekStart = new Date(today);
		currentWeekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
		currentWeekStart.setHours(0, 0, 0, 0);

		// Set view start date to 2 weeks before current week
		viewStartDate = new Date(currentWeekStart);
		viewStartDate.setDate(currentWeekStart.getDate() - 14);

		// Set view end date to 3 weeks after current week
		viewEndDate = new Date(currentWeekStart);
		viewEndDate.setDate(currentWeekStart.getDate() + 21);

		// Create week events for the date range
		const weekEvents: WeekEvent[] = [];
		let currentDate = new Date(viewStartDate);

		while (currentDate < viewEndDate) {
			const weekStart = new Date(currentDate);
			const weekEnd = new Date(currentDate);
			weekEnd.setDate(weekStart.getDate() + 6);
			weekEnd.setHours(23, 59, 59, 999);

			weekEvents.push({
				id: `week-${weekStart.toISOString()}`,
				startDate: weekStart,
				endDate: weekEnd,
				description: null,
				createdAt: new Date(),
				updatedAt: new Date()
			});

			currentDate.setDate(currentDate.getDate() + 7);
		}

		return weekEvents;
	}

	function getTodosForWeek(weekEvent: WeekEvent, type: 'deadline' | 'finishBy' | 'todo'): Todo[] {
		// Create a map of all todos for quick lookup
		const todoMap = new Map(todos.map((todo: Todo) => [todo.id, todo]));

		// First, filter todos for the week
		const weekTodos = todos.filter((todo: Todo) => {
			const date =
				type === 'deadline' ? todo.deadline : type === 'finishBy' ? todo.finishBy : todo.todo;

			if (!date) {
				return false;
			}

			// Set start date to beginning of day (midnight)
			const startDate = new Date(weekEvent.startDate);
			startDate.setHours(0, 0, 0, 0);

			// Set end date to end of day (23:59:59)
			const endDate = new Date(weekEvent.endDate);
			endDate.setHours(23, 59, 59, 999);

			// Task promotion logic:
			// - Deadline tasks: Stay in their original week, show as overdue in Todo column if past deadline
			// - Finish By tasks:
			//   * Completed tasks stay in their original week
			//   * Open tasks from past weeks are promoted to current week
			//   * Promoted tasks show "slipped" badge
			// - Todo tasks: Always show in their specified week
			if (type === 'finishBy') {
				const today = new Date();
				const isPastWeek = weekEvent.endDate < today;
				const isCurrentWeek = today >= weekEvent.startDate && today <= weekEvent.endDate;

				if (isPastWeek) {
					return date >= startDate && date <= endDate && todo.status === 'completed';
				}

				if (isCurrentWeek) {
					return (
						(date >= startDate && date <= endDate) ||
						(date < startDate && todo.status !== 'completed')
					);
				}
			}

			return date >= startDate && date <= endDate;
		});

		// Get all parent tasks for the filtered todos
		const tasksWithParents = new Set<Todo>();
		weekTodos.forEach((todo: Todo) => {
			// Add the current todo
			tasksWithParents.add(todo);

			// Add all parent todos up to root
			let currentTodo: Todo = todo;
			while (currentTodo.parentId) {
				const parentTodo = todoMap.get(currentTodo.parentId);
				if (parentTodo) {
					tasksWithParents.add(parentTodo as Todo);
					currentTodo = parentTodo as Todo;
				} else {
					break;
				}
			}
		});

		// Also add any subtasks of the filtered todos
		weekTodos.forEach((todo: Todo) => {
			todos.forEach((potentialSubtask: Todo) => {
				if (potentialSubtask.parentId === todo.id) {
					tasksWithParents.add(potentialSubtask);
				}
			});
		});

		// Convert Set back to array and sort
		const result = Array.from(tasksWithParents);

		result.sort((a: Todo, b: Todo) => {
			// First sort by path to maintain hierarchy
			const pathA = a.path || '';
			const pathB = b.path || '';
			if (pathA !== pathB) {
				return pathA.localeCompare(pathB);
			}

			// Then sort by level (parent tasks before subtasks)
			if (a.level !== b.level) {
				return a.level - b.level;
			}

			// Then sort by completion status
			if (a.status === 'completed' && b.status !== 'completed') return -1;
			if (a.status !== 'completed' && b.status === 'completed') return 1;

			// Finally sort by date if both tasks have dates
			const dateA = type === 'deadline' ? a.deadline : type === 'finishBy' ? a.finishBy : a.todo;
			const dateB = type === 'deadline' ? b.deadline : type === 'finishBy' ? b.finishBy : b.todo;
			if (!dateA || !dateB) return 0;
			return dateA.getTime() - dateB.getTime();
		});

		return result;
	}

	function getOpenTodosUpToCurrentWeek(weekEvent: WeekEvent): Todo[] {
		const today = new Date();
		const isPastWeek = weekEvent.endDate < today;
		const isCurrentWeek = today >= weekEvent.startDate && today <= weekEvent.endDate;

		// Create a map of all todos for quick lookup
		const todoMap = new Map(todos.map((todo: Todo) => [todo.id, todo]));

		// Helper function to get a task and all its parents
		function getTaskWithParents(todo: Todo, tasksSet: Set<Todo>) {
			// Add the current todo
			tasksSet.add(todo);

			// Add all parent todos up to root
			let currentTodo: Todo = todo;
			while (currentTodo.parentId) {
				const parentTodo = todoMap.get(currentTodo.parentId);
				if (parentTodo) {
					const typedParentTodo = parentTodo as Todo;
					tasksSet.add(typedParentTodo);
					currentTodo = typedParentTodo;
				} else {
					break;
				}
			}
		}

		const tasksWithParents = new Set<Todo>();

		// For past weeks, show completed tasks from that week and their parents
		if (isPastWeek) {
			todos.forEach((todo: Todo) => {
				if (todo.status === 'completed') {
					const date = todo.deadline || todo.finishBy || todo.todo;
					if (date && date >= weekEvent.startDate && date <= weekEvent.endDate) {
						getTaskWithParents(todo, tasksWithParents);
					}
				}
			});
		}

		// For current week, show:
		// 1. All open tasks from past and current week (if they don't have a todo date)
		// 2. Tasks with todo date in this week
		// 3. Completed tasks with deadline or finishBy date in this week
		if (isCurrentWeek) {
			todos.forEach((todo: Todo) => {
				const hasTodoInWeek =
					todo.todo && todo.todo >= weekEvent.startDate && todo.todo <= weekEvent.endDate;
				const hasPastTodo = todo.todo && todo.todo < weekEvent.startDate;
				const hasDeadlineInWeek =
					todo.deadline &&
					todo.deadline >= weekEvent.startDate &&
					todo.deadline <= weekEvent.endDate;
				const hasFinishByInWeek =
					todo.finishBy &&
					todo.finishBy >= weekEvent.startDate &&
					todo.finishBy <= weekEvent.endDate;

				// If task has a todo date, only show it in that specific week
				// If task has no todo date or has a past todo date, show it in current week if not completed
				// Also show completed tasks if they have a deadline or finishBy date in this week
				const shouldShow =
					hasTodoInWeek ||
					(!todo.todo && todo.status !== 'completed') ||
					(hasPastTodo && todo.status !== 'completed') ||
					(todo.status === 'completed' && (hasDeadlineInWeek || hasFinishByInWeek));

				if (shouldShow) {
					getTaskWithParents(todo, tasksWithParents);
				}
			});
		}

		const result = Array.from(tasksWithParents);

		result.sort((a: Todo, b: Todo) => {
			// First sort by path to maintain hierarchy
			const pathA = a.path || '';
			const pathB = b.path || '';
			if (pathA !== pathB) {
				return pathA.localeCompare(pathB);
			}

			// Then sort by level (parent tasks before subtasks)
			if (a.level !== b.level) {
				return a.level - b.level;
			}

			// Then sort by completion status
			if (a.status === 'completed' && b.status !== 'completed') return -1;
			if (a.status !== 'completed' && b.status === 'completed') return 1;

			// Finally sort by date if both tasks have dates
			const dateA = a.todo || a.deadline || a.finishBy;
			const dateB = b.todo || b.deadline || b.finishBy;
			if (!dateA || !dateB) return 0;
			return dateA.getTime() - dateB.getTime();
		});

		return result;
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTodoDate(date: Date | null): string {
		if (!date) return 'No date';
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function isCurrentWeek(weekEvent: WeekEvent): boolean {
		const today = new Date();
		return today >= weekEvent.startDate && today <= weekEvent.endDate;
	}

	function isStartOfMonth(weekEvent: WeekEvent): boolean {
		const prevDay = new Date(weekEvent.startDate);
		prevDay.setDate(prevDay.getDate() - 1);
		return prevDay.getMonth() !== weekEvent.startDate.getMonth();
	}

	function getMonthYear(date: Date, weekEvent: WeekEvent): string {
		// If this week contains the 1st of a month, use that date for the header
		for (let i = 0; i < 7; i++) {
			const checkDate = new Date(weekEvent.startDate);
			checkDate.setDate(checkDate.getDate() + i);
			if (checkDate.getDate() === 1) {
				return checkDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
			}
		}
		// Otherwise use the provided date
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	}

	function shouldShowMonthHeader(weekEvent: WeekEvent, index: number): boolean {
		// Check each day in the week for the 1st of a month
		for (let i = 0; i < 7; i++) {
			const date = new Date(weekEvent.startDate);
			date.setDate(date.getDate() + i);
			if (date.getDate() === 1) {
				return true;
			}
		}
		return index === 0; // Show header for first week anyway
	}

	function handleTaskHover(taskId: string | null) {
		hoveredTaskId = taskId;
	}

	async function handleToggleStatus(todo: Todo, event: MouseEvent) {
		// Prevent event from bubbling up to parent elements
		event.stopPropagation();

		try {
			await toggleTodoStatus(todo.id);
			await onTodosChange();
		} catch (error) {
			console.error('Failed to toggle todo status:', error);
			notification = {
				message: error instanceof Error ? error.message : 'Failed to toggle todo status',
				type: 'error'
			};
		}
	}

	async function handleCyclePriority(todo: Todo, event: MouseEvent) {
		// Prevent event from bubbling up to parent elements
		event.stopPropagation();

		try {
			await cycleTodoPriority(todo.id);
			await onTodosChange();
		} catch (error) {
			console.error('Failed to cycle todo priority:', error);
			notification = {
				message: error instanceof Error ? error.message : 'Failed to cycle todo priority',
				type: 'error'
			};
		}
	}
</script>

<div class="container mx-auto p-2">
	<div class="mb-3 flex items-center justify-between">
		<h1 class="text-xl font-bold">Weekly View ({todos.length})</h1>
		<Button onclick={handleResetDatabase} variant="destructive" size="sm" disabled={isResetting}>
			{isResetting ? 'Resetting...' : 'Reset Database'}
		</Button>
	</div>

	<div class="mb-3 flex flex-wrap items-center gap-1">
		<Button onclick={handleAddNewTodo} size="sm">Add New Item</Button>

		<div class="ml-2 flex items-center gap-1">
			<span class="text-xs font-medium text-gray-700">Bulk add:</span>
			<Button
				onclick={() => handleAddMultipleTodos(5)}
				variant="outline"
				size="sm"
				class="min-w-12 px-2 py-0.5">5</Button
			>
			<Button
				onclick={() => handleAddMultipleTodos(10)}
				variant="outline"
				size="sm"
				class="min-w-12 px-2 py-0.5">10</Button
			>
			<Button
				onclick={() => handleAddMultipleTodos(20)}
				variant="outline"
				size="sm"
				class="min-w-12 px-2 py-0.5">20</Button
			>
			<Button
				onclick={() => handleAddMultipleTodos(100)}
				variant="outline"
				size="sm"
				class="min-w-12 px-2 py-0.5">100</Button
			>
			<Button
				onclick={() => handleAddMultipleTodos(500)}
				variant="outline"
				size="sm"
				class="min-w-12 px-2 py-0.5">500</Button
			>
			<Button
				onclick={() => handleAddMultipleTodos(1000)}
				variant="outline"
				size="sm"
				class="min-w-12 px-2 py-0.5">1000</Button
			>
		</div>

		{#if todos.length > 0}
			<div class="ml-auto">
				<Button
					onclick={handleLoadTestData}
					variant="outline"
					size="sm"
					class="mr-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
				>
					Load Test Data
				</Button>

				{#if showClearConfirm}
					<div class="flex items-center gap-1">
						<span class="text-xs text-red-600">Are you sure?</span>
						<Button
							onclick={handleClearAllTodos}
							variant="destructive"
							size="sm"
							class="px-2 py-0.5">Yes, clear all</Button
						>
						<Button
							onclick={() => (showClearConfirm = false)}
							variant="outline"
							size="sm"
							class="px-2 py-0.5">Cancel</Button
						>
					</div>
				{:else}
					<Button
						onclick={() => (showClearConfirm = true)}
						variant="outline"
						size="sm"
						class="text-red-600 hover:bg-red-50 hover:text-red-700"
					>
						Clear All
					</Button>
				{/if}
			</div>
		{:else}
			<Button
				onclick={handleLoadTestData}
				variant="outline"
				size="sm"
				class="ml-auto text-blue-600 hover:bg-blue-50 hover:text-blue-700"
			>
				Load Test Data
			</Button>
		{/if}
	</div>

	{#if notification}
		<div
			class="fixed right-4 top-4 rounded p-2 text-sm shadow-lg transition-opacity duration-300"
			class:bg-green-500={notification.type === 'success'}
			class:bg-red-500={notification.type === 'error'}
			class:text-white={true}
		>
			{notification.message}
		</div>
	{/if}

	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-2 py-1 text-left text-xs font-medium uppercase text-gray-500">Week</th>
					<th class="px-2 py-1 text-left text-xs font-medium uppercase text-gray-500">Event</th>
					<th class="px-2 py-1 text-left text-xs font-medium uppercase text-gray-500"
						>Deadline Tasks</th
					>
					<th class="px-2 py-1 text-left text-xs font-medium uppercase text-gray-500"
						>Finish By Tasks</th
					>
					<th class="px-2 py-1 text-left text-xs font-medium uppercase text-gray-500">Todo</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white text-sm">
				{#each weekEvents as weekEvent, index}
					{#if shouldShowMonthHeader(weekEvent, index)}
						<tr class="bg-gray-100">
							<td colspan="5" class="px-2 py-1">
								<div class="text-base font-semibold text-gray-700">
									{getMonthYear(weekEvent.startDate, weekEvent)}
								</div>
							</td>
						</tr>
					{/if}
					<tr
						class:bg-amber-100={isCurrentWeek(weekEvent)}
						class:font-medium={isCurrentWeek(weekEvent)}
					>
						<!-- Week -->
						<td class="whitespace-nowrap px-2 py-1">
							<div
								class="text-xs"
								class:text-amber-900={isCurrentWeek(weekEvent)}
								class:text-gray-900={!isCurrentWeek(weekEvent)}
							>
								{formatDate(weekEvent.startDate)} - {formatDate(weekEvent.endDate)}
							</div>
						</td>

						<!-- Event -->
						<td class="whitespace-nowrap px-2 py-1">
							{#if weekEvent.description}
								<span
									class="rounded px-1.5 py-0.5 text-xs text-white"
									style="background-color: {getColorForId(weekEvent.id)}"
								>
									{weekEvent.description}
								</span>
							{:else}
								<span class="text-xs text-gray-400">-</span>
							{/if}
						</td>

						<!-- Tasks columns with balanced styling -->
						<td class="px-2 py-1">
							<div class="space-y-0.5">
								{#each getTodosForWeek(weekEvent, 'deadline') as todo}
									<div
										class="task-hover-target task-hover-highlight flex items-center rounded px-1.5 py-0.5"
										class:task-highlight={hoveredTaskId === todo.id}
										on:mouseenter={() => handleTaskHover(todo.id)}
										on:mouseleave={() => handleTaskHover(null)}
									>
										<div
											class="flex items-center gap-1"
											class:text-gray-400={todo.status === 'completed'}
										>
											<span
												class="cursor-pointer text-xs leading-snug"
												style="padding-left: {todo.level * 0.75}rem"
												class:line-through={todo.status === 'completed'}
												style:color={todo.status === 'completed'
													? '#9CA3AF'
													: getColorForId(todo.id)}
												on:click={(e) => handleToggleStatus(todo, e)}
											>
												{#if todo.emoji}<span class="mr-1">{todo.emoji}</span>{/if}{todo.title}
											</span>
											<span
												class="cursor-pointer rounded px-1 py-0.5 text-xs"
												class:text-gray-400={todo.status === 'completed'}
												class:bg-red-100={todo.priority === 'P0' && todo.status !== 'completed'}
												class:text-red-800={todo.priority === 'P0' && todo.status !== 'completed'}
												class:bg-orange-100={todo.priority === 'P1' && todo.status !== 'completed'}
												class:text-orange-800={todo.priority === 'P1' &&
													todo.status !== 'completed'}
												class:bg-yellow-100={todo.priority === 'P2' && todo.status !== 'completed'}
												class:text-yellow-800={todo.priority === 'P2' &&
													todo.status !== 'completed'}
												class:bg-gray-100={todo.priority === 'P3' && todo.status !== 'completed'}
												class:text-gray-800={todo.priority === 'P3' && todo.status !== 'completed'}
												on:click={(e) => handleCyclePriority(todo, e)}
											>
												{todo.priority}
											</span>
										</div>
									</div>
								{:else}
									<span class="text-xs text-gray-400">-</span>
								{/each}
							</div>
						</td>

						<!-- Finish By Tasks -->
						<td class="px-2 py-1">
							<div class="space-y-0.5">
								{#each getTodosForWeek(weekEvent, 'finishBy') as todo}
									<div
										class="task-hover-target task-hover-highlight flex items-center rounded px-1.5 py-0.5"
										class:task-highlight={hoveredTaskId === todo.id}
										on:mouseenter={() => handleTaskHover(todo.id)}
										on:mouseleave={() => handleTaskHover(null)}
									>
										<div
											class="flex items-center gap-1"
											class:text-gray-400={todo.status === 'completed'}
										>
											<span
												class="cursor-pointer text-xs leading-snug"
												style="padding-left: {todo.level * 0.75}rem"
												class:line-through={todo.status === 'completed'}
												style:color={todo.status === 'completed'
													? '#9CA3AF'
													: getColorForId(todo.id)}
												on:click={(e) => handleToggleStatus(todo, e)}
											>
												{#if todo.emoji}<span class="mr-1">{todo.emoji}</span>{/if}{todo.title}
											</span>
											<span
												class="cursor-pointer rounded px-1 py-0.5 text-xs"
												class:text-gray-400={todo.status === 'completed'}
												class:bg-red-100={todo.priority === 'P0' && todo.status !== 'completed'}
												class:text-red-800={todo.priority === 'P0' && todo.status !== 'completed'}
												class:bg-orange-100={todo.priority === 'P1' && todo.status !== 'completed'}
												class:text-orange-800={todo.priority === 'P1' &&
													todo.status !== 'completed'}
												class:bg-yellow-100={todo.priority === 'P2' && todo.status !== 'completed'}
												class:text-yellow-800={todo.priority === 'P2' &&
													todo.status !== 'completed'}
												class:bg-gray-100={todo.priority === 'P3' && todo.status !== 'completed'}
												class:text-gray-800={todo.priority === 'P3' && todo.status !== 'completed'}
												on:click={(e) => handleCyclePriority(todo, e)}
											>
												{todo.priority}
											</span>
											{#if isCurrentWeek(weekEvent)}
												{@const status = getTaskStatus(todo, weekEvent.startDate)}
												{#if status}
													<span
														class="rounded px-1 py-0.5 text-xs text-white"
														class:bg-red-500={status.type === 'overdue'}
														class:bg-yellow-500={status.type === 'slipped'}
													>
														{#if status.type === 'overdue'}
															overdue ({status.daysOverdue}d)
														{:else}
															{status.type}
														{/if}
													</span>
												{/if}
											{/if}
										</div>
									</div>
								{:else}
									<span class="text-xs text-gray-400">-</span>
								{/each}
							</div>
						</td>

						<!-- Open Todos -->
						<td class="px-2 py-1">
							{#if isCurrentWeek(weekEvent) || weekEvent.endDate < new Date()}
								<div class="space-y-0.5">
									{#each getOpenTodosUpToCurrentWeek(weekEvent) as todo}
										<div
											class="task-hover-target task-hover-highlight flex items-center rounded px-1.5 py-0.5"
											class:task-highlight={hoveredTaskId === todo.id}
											on:mouseenter={() => handleTaskHover(todo.id)}
											on:mouseleave={() => handleTaskHover(null)}
										>
											<div
												class="flex items-center gap-1"
												class:text-gray-400={todo.status === 'completed'}
											>
												<span
													class="cursor-pointer text-xs leading-snug"
													style="padding-left: {todo.level * 0.75}rem"
													class:line-through={todo.status === 'completed'}
													style:color={todo.status === 'completed'
														? '#9CA3AF'
														: getColorForId(todo.id)}
													on:click={(e) => handleToggleStatus(todo, e)}
												>
													{#if todo.emoji}<span class="mr-1">{todo.emoji}</span>{/if}{todo.title}
												</span>
												<span
													class="cursor-pointer rounded px-1 py-0.5 text-xs"
													class:text-gray-400={todo.status === 'completed'}
													class:bg-red-100={todo.priority === 'P0' && todo.status !== 'completed'}
													class:text-red-800={todo.priority === 'P0' && todo.status !== 'completed'}
													class:bg-orange-100={todo.priority === 'P1' &&
														todo.status !== 'completed'}
													class:text-orange-800={todo.priority === 'P1' &&
														todo.status !== 'completed'}
													class:bg-yellow-100={todo.priority === 'P2' &&
														todo.status !== 'completed'}
													class:text-yellow-800={todo.priority === 'P2' &&
														todo.status !== 'completed'}
													class:bg-gray-100={todo.priority === 'P3' && todo.status !== 'completed'}
													class:text-gray-800={todo.priority === 'P3' &&
														todo.status !== 'completed'}
													on:click={(e) => handleCyclePriority(todo, e)}
												>
													{todo.priority}
												</span>
												<!-- Visual indicators for task status -->
												{#if isCurrentWeek(weekEvent)}
													{@const status = getTaskStatus(todo, weekEvent.startDate)}
													{#if status}
														<span
															class="rounded px-1 py-0.5 text-xs text-white"
															class:bg-red-500={status.type === 'overdue'}
															class:bg-yellow-500={status.type === 'slipped'}
														>
															{#if status.type === 'overdue'}
																overdue ({status.daysOverdue}d)
															{:else}
																{status.type}
															{/if}
														</span>
													{/if}
												{/if}
											</div>
										</div>
									{:else}
										<span class="text-xs text-gray-400">
											{#if isCurrentWeek(weekEvent)}
												No open tasks
											{:else}
												No completed tasks
											{/if}
										</span>
									{/each}
								</div>
							{:else}
								<span class="text-xs text-gray-400">-</span>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.task-hover-target {
		@apply border border-transparent;
	}

	.task-hover-target:hover {
		@apply bg-blue-100/80;
		@apply border-blue-200;
	}

	.task-hover-highlight {
		@apply transition-all;
		@apply duration-100;
	}

	:global(.task-highlight) {
		@apply bg-blue-100/80 !important;
		@apply border-blue-200 !important;
	}
</style>
