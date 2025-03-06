<script lang="ts">
	import { onMount } from 'svelte';
	import {
		loadWeekEvents,
		type WeekEvent,
		type Todo,
		addNewTodo,
		addMultipleTodos,
		clearAllTodos
	} from '$lib/client/db';
	import { Button } from '$lib/components/ui/button';

	const { todos = [], onTodosChange } = $props<{
		todos: Todo[];
		onTodosChange: () => Promise<void>;
	}>();
	let weekEvents = $state<WeekEvent[]>([]);
	let isLoading = $state<boolean>(false);
	let showClearConfirm = $state<boolean>(false);
	let notification = $state<{ message: string; type: 'success' | 'error' } | null>(null);

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
			const result = await addNewTodo();
			if (result.success) {
				await onTodosChange();
				await loadData();
				notification = {
					message: result.message,
					type: 'success'
				};
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
		try {
			const result = await addMultipleTodos(count);
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

	async function loadData() {
		isLoading = true;
		try {
			// Load data for 2 months (1 month past to 1 month future)
			const today = new Date();
			const startDate = new Date(today);
			startDate.setMonth(today.getMonth() - 1);
			const endDate = new Date(today);
			endDate.setMonth(today.getMonth() + 1);

			const events = await loadWeekEvents(startDate, endDate);
			weekEvents = events;
		} catch (error) {
			console.error('Error loading data:', error);
		} finally {
			isLoading = false;
		}
	}

	function getTodosForWeek(weekEvent: WeekEvent, type: 'deadline' | 'finishBy'): Todo[] {
		return todos.filter((todo: Todo) => {
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
	}

	function formatDate(date: Date): string {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			weekday: 'short'
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
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-6 text-2xl font-bold">Weekly View ({todos.length})</h1>

	<div class="mb-6 flex flex-wrap items-center gap-2">
		<Button onclick={handleAddNewTodo} disabled={isLoading}>Add New Item</Button>

		<div class="ml-4 flex items-center gap-2">
			<span class="text-sm font-medium text-gray-700">Bulk add:</span>
			<Button
				onclick={() => handleAddMultipleTodos(10)}
				variant="outline"
				size="sm"
				disabled={isLoading}
				class="min-w-16"
			>
				10
			</Button>
			<Button
				onclick={() => handleAddMultipleTodos(50)}
				variant="outline"
				size="sm"
				disabled={isLoading}
				class="min-w-16"
			>
				50
			</Button>
			<Button
				onclick={() => handleAddMultipleTodos(100)}
				variant="outline"
				size="sm"
				disabled={isLoading}
				class="min-w-16"
			>
				100
			</Button>
			<Button
				onclick={() => handleAddMultipleTodos(500)}
				variant="outline"
				size="sm"
				disabled={isLoading}
				class="min-w-16"
			>
				500
			</Button>
			<Button
				onclick={() => handleAddMultipleTodos(1000)}
				variant="outline"
				size="sm"
				disabled={isLoading}
				class="min-w-16"
			>
				1000
			</Button>
		</div>

		{#if todos.length > 0}
			<div class="ml-auto">
				{#if showClearConfirm}
					<div class="flex items-center gap-2">
						<span class="text-sm text-red-600">Are you sure?</span>
						<Button
							onclick={handleClearAllTodos}
							variant="destructive"
							size="sm"
							disabled={isLoading}
						>
							Yes, clear all
						</Button>
						<Button
							onclick={() => (showClearConfirm = false)}
							variant="outline"
							size="sm"
							disabled={isLoading}
						>
							Cancel
						</Button>
					</div>
				{:else}
					<Button
						onclick={() => (showClearConfirm = true)}
						variant="outline"
						size="sm"
						disabled={isLoading}
						class="text-red-600 hover:bg-red-50 hover:text-red-700"
					>
						Clear All
					</Button>
				{/if}
			</div>
		{/if}

		{#if isLoading}
			<div class="ml-2 flex items-center">
				<div
					class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600"
				></div>
				<span class="text-sm text-gray-600">Processing...</span>
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

	{#if isLoading}
		<div class="flex items-center justify-center py-8">
			<div
				class="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"
			></div>
		</div>
	{:else}
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
					{#each weekEvents as weekEvent}
						<tr class="hover:bg-gray-50">
							<!-- Week -->
							<td class="whitespace-nowrap px-4 py-2">
								<div class="text-sm font-medium text-gray-900">
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
										<div class="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
											<div class="flex items-center gap-2">
												<span class="text-sm" style="color: {getColorForId(todo.id)}"
													>{todo.title}</span
												>
												{#if todo.tags && todo.tags.length > 0}
													<span class="text-xs text-gray-500">
														{todo.tags.slice(0, 1).join(', ')}
													</span>
												{/if}
											</div>
											<span class="text-xs text-gray-500">
												{new Date(todo.deadline!).toLocaleTimeString()}
											</span>
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
										<div class="flex items-center justify-between rounded bg-gray-50 px-2 py-1">
											<div class="flex items-center gap-2">
												<span class="text-sm" style="color: {getColorForId(todo.id)}"
													>{todo.title}</span
												>
												{#if todo.tags && todo.tags.length > 0}
													<span class="text-xs text-gray-500">
														{todo.tags.slice(0, 1).join(', ')}
													</span>
												{/if}
											</div>
											<span class="text-xs text-gray-500">
												{new Date(todo.finishBy!).toLocaleTimeString()}
											</span>
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
	{/if}
</div>
