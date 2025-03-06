<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getAllTodos,
		createRandomTodo,
		createMultipleRandomTodos,
		clearAllTodos,
		type Todo
	} from '$lib/client/dexie';
	import { Button } from '$lib/components/ui/button';

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
	let showClearConfirm = $state<boolean>(false);
	let notification = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	let isResetting = $state<boolean>(false);

	onMount(async () => {
		await loadData();
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
		try {
			const newTodo = await createRandomTodo();
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
		try {
			const startTime = performance.now();
			await createMultipleRandomTodos(count);
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

	async function loadData() {
		try {
			// Get today's date
			const today = new Date();

			// Find start of current week (Monday)
			const currentWeekStart = new Date(today);
			while (currentWeekStart.getDay() !== 1) {
				currentWeekStart.setDate(currentWeekStart.getDate() - 1);
			}

			// Set start date to 2 weeks before current week
			const startDate = new Date(currentWeekStart);
			startDate.setDate(startDate.getDate() - 14); // 2 weeks back

			// Set end date to 3 weeks after current week
			const endDate = new Date(currentWeekStart);
			endDate.setDate(endDate.getDate() + 21); // current week + 3 weeks forward

			// Create week rows
			const tempWeekEvents: WeekEvent[] = [];
			let currentDate = new Date(startDate);
			currentDate.setHours(0, 0, 0, 0);

			while (currentDate <= endDate) {
				// Find the start of the week (Monday)
				const weekStart = new Date(currentDate);
				while (weekStart.getDay() !== 1) {
					weekStart.setDate(weekStart.getDate() - 1);
				}

				// Find the end of the week (Sunday)
				const weekEnd = new Date(weekStart);
				weekEnd.setDate(weekEnd.getDate() + 6);
				weekEnd.setHours(23, 59, 59, 999);

				// Create a week event
				tempWeekEvents.push({
					id: `week-${weekStart.getTime()}`,
					startDate: weekStart,
					endDate: weekEnd,
					description: null,
					createdAt: new Date(),
					updatedAt: new Date()
				});

				// Move to next week
				currentDate.setDate(currentDate.getDate() + 7);
			}

			// Sort week events by start date
			tempWeekEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
			weekEvents = tempWeekEvents;
		} catch (error) {
			console.error('Error loading data:', error);
		}
	}

	function getTodosForWeek(weekEvent: WeekEvent, type: 'deadline' | 'finishBy'): Todo[] {
		// First, filter todos for the week
		const weekTodos = todos.filter((todo: Todo) => {
			const date = type === 'deadline' ? todo.deadline : todo.finishBy;
			if (!date) return false;

			// Set start date to beginning of day (midnight)
			const startDate = new Date(weekEvent.startDate);
			startDate.setHours(0, 0, 0, 0);

			// Set end date to end of day (23:59:59)
			const endDate = new Date(weekEvent.endDate);
			endDate.setHours(23, 59, 59, 999);

			return date >= startDate && date <= endDate;
		});

		// Sort todos by completion status first, then by date
		weekTodos.sort((a: Todo, b: Todo) => {
			// First sort by completion status
			if (a.status === 'completed' && b.status !== 'completed') return -1;
			if (a.status !== 'completed' && b.status === 'completed') return 1;

			// Then sort by date
			const dateA = type === 'deadline' ? a.deadline : a.finishBy;
			const dateB = type === 'deadline' ? b.deadline : b.finishBy;
			if (!dateA || !dateB) return 0;
			return dateA.getTime() - dateB.getTime();
		});

		return weekTodos;
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
</script>

<div class="container mx-auto p-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Weekly View ({todos.length})</h1>
		<Button onclick={handleResetDatabase} variant="destructive" size="sm" disabled={isResetting}>
			{isResetting ? 'Resetting...' : 'Reset Database'}
		</Button>
	</div>

	<div class="mb-6 flex flex-wrap items-center gap-2">
		<Button onclick={handleAddNewTodo}>Add New Item</Button>

		<div class="ml-4 flex items-center gap-2">
			<span class="text-sm font-medium text-gray-700">Bulk add:</span>
			<Button
				onclick={() => handleAddMultipleTodos(10)}
				variant="outline"
				size="sm"
				class="min-w-16">10</Button
			>
			<Button
				onclick={() => handleAddMultipleTodos(50)}
				variant="outline"
				size="sm"
				class="min-w-16">50</Button
			>
			<Button
				onclick={() => handleAddMultipleTodos(100)}
				variant="outline"
				size="sm"
				class="min-w-16">100</Button
			>
			<Button
				onclick={() => handleAddMultipleTodos(500)}
				variant="outline"
				size="sm"
				class="min-w-16">500</Button
			>
			<Button
				onclick={() => handleAddMultipleTodos(1000)}
				variant="outline"
				size="sm"
				class="min-w-16">1000</Button
			>
		</div>

		{#if todos.length > 0}
			<div class="ml-auto">
				{#if showClearConfirm}
					<div class="flex items-center gap-2">
						<span class="text-sm text-red-600">Are you sure?</span>
						<Button onclick={handleClearAllTodos} variant="destructive" size="sm"
							>Yes, clear all</Button
						>
						<Button onclick={() => (showClearConfirm = false)} variant="outline" size="sm"
							>Cancel</Button
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
		{/if}
	</div>

	{#if notification}
		<div
			class="fixed right-4 top-4 rounded p-4 shadow-lg transition-opacity duration-300"
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
					<th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Week</th>
					<th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500">Event</th>
					<th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500"
						>Deadline Tasks</th
					>
					<th class="px-4 py-2 text-left text-xs font-medium uppercase text-gray-500"
						>Finish By Tasks</th
					>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each weekEvents as weekEvent, index}
					{#if shouldShowMonthHeader(weekEvent, index)}
						<tr class="bg-gray-100">
							<td colspan="4" class="px-4 py-2">
								<div class="text-lg font-semibold text-gray-700">
									{getMonthYear(weekEvent.startDate, weekEvent)}
								</div>
							</td>
						</tr>
					{/if}
					<tr class="hover:bg-gray-50" class:bg-amber-50={isCurrentWeek(weekEvent)}>
						<!-- Week -->
						<td class="whitespace-nowrap px-4 py-2">
							<div
								class="text-sm font-medium"
								class:text-amber-900={isCurrentWeek(weekEvent)}
								class:text-gray-900={!isCurrentWeek(weekEvent)}
							>
								{formatDate(weekEvent.startDate)} - {formatDate(weekEvent.endDate)}
							</div>
						</td>

						<!-- Event -->
						<td class="whitespace-nowrap px-4 py-2">
							{#if weekEvent.description}
								<span
									class="rounded-full px-2 py-0.5 text-xs text-white"
									style="background-color: {getColorForId(weekEvent.id)}"
								>
									{weekEvent.description}
								</span>
							{:else}
								<span class="text-xs text-gray-400">-</span>
							{/if}
						</td>

						<!-- Deadline Tasks -->
						<td class="px-4 py-2">
							<div class="space-y-1">
								{#each getTodosForWeek(weekEvent, 'deadline') as todo}
									<div class="flex items-center rounded bg-gray-50 px-2 py-1">
										<div
											class="flex items-center gap-2"
											class:text-gray-400={todo.status === 'completed'}
										>
											<span
												class="text-sm"
												style="padding-left: {todo.level * 1.5}rem"
												class:line-through={todo.status === 'completed'}
												style:color={todo.status === 'completed'
													? '#9CA3AF'
													: getColorForId(todo.id)}
											>
												{#if todo.emoji}
													<span class="mr-1" style="color: inherit">{todo.emoji}</span>
												{/if}
												{todo.title}
											</span>
											<span
												class="rounded px-1.5 py-0.5 text-xs font-medium"
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
											>
												{todo.priority}
											</span>
										</div>
									</div>
								{:else}
									<span class="text-xs text-gray-400">No deadline tasks</span>
								{/each}
							</div>
						</td>

						<!-- Finish By Tasks -->
						<td class="px-4 py-2">
							<div class="space-y-1">
								{#each getTodosForWeek(weekEvent, 'finishBy') as todo}
									<div class="flex items-center rounded bg-gray-50 px-2 py-1">
										<div
											class="flex items-center gap-2"
											class:text-gray-400={todo.status === 'completed'}
										>
											<span
												class="text-sm"
												style="padding-left: {todo.level * 1.5}rem"
												class:line-through={todo.status === 'completed'}
												style:color={todo.status === 'completed'
													? '#9CA3AF'
													: getColorForId(todo.id)}
											>
												{#if todo.emoji}
													<span class="mr-1" style="color: inherit">{todo.emoji}</span>
												{/if}
												{todo.title}
											</span>
											<span
												class="rounded px-1.5 py-0.5 text-xs font-medium"
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
											>
												{todo.priority}
											</span>
										</div>
									</div>
								{:else}
									<span class="text-xs text-gray-400">No finish by tasks</span>
								{/each}
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	/* Add any additional styles here */
</style>
