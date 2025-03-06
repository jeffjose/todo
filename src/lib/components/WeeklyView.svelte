<script lang="ts">
	import { onMount } from 'svelte';
	import { loadWeekEvents, type WeekEvent, type Todo } from '$lib/client/db';

	const { todos = [] } = $props<{ todos: Todo[] }>();
	let weekEvents = $state<WeekEvent[]>([]);
	let isLoading = $state<boolean>(false);

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

			return date >= weekEvent.startDate && date <= weekEvent.endDate;
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
