<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { Todo } from '$lib/client/dexie';
	import {
		createTodo,
		clearAllTodos,
		getAllTodos,
		createRandomTodo,
		createMultipleRandomTodos,
		loadTestData,
		loadInitialTasks
	} from '$lib/client/dexie';

	// Core props from parent
	export let todos: Todo[] = [];
	export let lastLoadTime: number = 0;
	export let isLoading: boolean = false;
	export let notification: { message: string; type: 'success' | 'error' } | null = null;
	export let performanceHistory: {
		operation: string;
		count: number;
		time: number;
		timestamp: Date;
		details: Record<string, any>;
	}[] = [];
	export let showPerformanceStats: boolean = false;
	export let onTodosChange: () => Promise<void>;
	export let onTogglePerformanceStats: () => void;

	// Local state
	let expandedTodoId: string | null = null;
	let showClearConfirm = false;
	let isResetting = false;

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

	// Local functions
	function toggleExpand(todoId: string) {
		expandedTodoId = expandedTodoId === todoId ? null : todoId;
	}

	function formatLoadTime(ms: number): string {
		if (ms < 1) return '< 1ms';
		if (ms < 1000) return `${Math.round(ms)}ms`;
		return `${(ms / 1000).toFixed(2)}s`;
	}

	// Add date range calculation function
	function getDateRange(): { startDate: Date; endDate: Date } {
		// Get the start of the current week (Monday)
		const today = new Date();
		const currentWeekStart = new Date(today);
		currentWeekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
		currentWeekStart.setHours(0, 0, 0, 0);

		// Set start date to 2 weeks before current week
		const startDate = new Date(currentWeekStart);
		startDate.setDate(currentWeekStart.getDate() - 14);

		// Set end date to 3 weeks after current week
		const endDate = new Date(currentWeekStart);
		endDate.setDate(currentWeekStart.getDate() + 21);

		return { startDate, endDate };
	}

	async function handleAddNewTodo() {
		try {
			const { startDate, endDate } = getDateRange();
			const newTodo = await createRandomTodo(startDate, endDate);
			await onTodosChange();
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
			const { startDate, endDate } = getDateRange();
			const startTime = performance.now();
			await createMultipleRandomTodos(count, startDate, endDate);
			const endTime = performance.now();
			const timeInSeconds = (endTime - startTime) / 1000;
			await onTodosChange();
			performanceHistory = [
				{
					operation: 'add',
					count,
					time: timeInSeconds * 1000,
					timestamp: new Date(),
					details: {}
				},
				...performanceHistory.slice(0, 9)
			];
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

	async function handleLoadTestData() {
		try {
			const result = await loadTestData();
			if (result.success) {
				await onTodosChange();
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

	async function handleResetDatabase() {
		if (confirm('Are you sure you want to reset the database? This will delete all data.')) {
			isResetting = true;
			try {
				const result = await clearAllTodos();
				if (result.success) {
					await onTodosChange();
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

	async function handleLoadInitialTasks() {
		try {
			isLoading = true;
			const result = await loadInitialTasks();
			if (result.success) {
				await onTodosChange();
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
			console.error('Failed to load initial tasks:', error);
			notification = {
				message: error instanceof Error ? error.message : 'Failed to load initial tasks',
				type: 'error'
			};
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="container mx-auto p-4">
	<div class="mb-4 flex items-center justify-between">
		<h1 class="text-2xl font-bold">
			Todo Management ({todos.length} items)
			{#if lastLoadTime > 0}
				<span class="ml-2 text-sm font-normal text-gray-500">
					(loaded in {formatLoadTime(lastLoadTime)})
				</span>
			{/if}
			<button
				class="ml-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				on:click={onTogglePerformanceStats}
				aria-label="Toggle performance stats"
				title="Toggle performance stats"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M12 20v-6M6 20V10M18 20V4"></path>
				</svg>
			</button>
		</h1>
		<Button
			onclick={handleResetDatabase}
			variant="destructive"
			size="sm"
			disabled={isResetting}
			class="ml-auto"
		>
			{isResetting ? 'Resetting...' : 'Reset Database'}
		</Button>
	</div>

	{#if showPerformanceStats}
		<div class="mb-4 rounded bg-gray-50 p-3 shadow-sm">
			<h3 class="mb-2 text-sm font-semibold text-gray-700">Performance Stats</h3>
			{#if performanceHistory.length === 0}
				<p class="text-xs text-gray-500">No performance data available yet</p>
			{:else}
				<table class="w-full text-xs">
					<thead class="border-b text-gray-500">
						<tr>
							<th class="pb-1 text-left">Operation</th>
							<th class="pb-1 text-left">Items</th>
							<th class="pb-1 text-left">Time</th>
							<th class="pb-1 text-left">Items/sec</th>
							<th class="pb-1 text-left">Timestamp</th>
						</tr>
					</thead>
					<tbody>
						{#each performanceHistory as stat}
							<tr class="border-b border-gray-100">
								<td class="py-1 pr-2">{stat.operation}</td>
								<td class="py-1 pr-2">{stat.count}</td>
								<td class="py-1 pr-2">{formatLoadTime(stat.time)}</td>
								<td class="py-1 pr-2">
									{stat.time > 0 ? Math.round((stat.count / stat.time) * 1000) : 'N/A'}
								</td>
								<td class="py-1 pr-2 text-gray-500">
									{stat.timestamp.toLocaleTimeString()}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</div>
	{/if}

	<div class="mb-6 flex flex-wrap items-center gap-2">
		<Button onclick={handleAddNewTodo} disabled={isLoading}>Add New Item</Button>

		<div class="ml-4 flex items-center gap-2">
			<span class="text-sm font-medium text-gray-700">Bulk add:</span>
			<Button
				onclick={() => handleAddMultipleTodos(5)}
				variant="outline"
				size="sm"
				disabled={isLoading}
				class="min-w-16"
			>
				5
			</Button>
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
				onclick={() => handleAddMultipleTodos(20)}
				variant="outline"
				size="sm"
				disabled={isLoading}
				class="min-w-16"
			>
				20
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
			<div class="ml-auto flex items-center gap-2">
				<Button
					onclick={handleLoadTestData}
					variant="outline"
					size="sm"
					disabled={isLoading}
					class="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
				>
					Load Test Data
				</Button>

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
		{:else}
			<div class="mt-4 flex gap-2">
				<Button
					onclick={handleLoadTestData}
					variant="outline"
					size="sm"
					disabled={isLoading}
					class="text-blue-600 hover:bg-blue-50 hover:text-blue-700"
				>
					Load Test Data
				</Button>
				<Button
					onclick={handleLoadInitialTasks}
					variant="outline"
					size="sm"
					disabled={isLoading}
					class="text-green-600 hover:bg-green-50 hover:text-green-700"
				>
					Load Initial Tasks
				</Button>
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

	<div class="mb-4 mt-6 rounded bg-white px-4 py-3 shadow-md">
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center">
				<h2 class="text-xl font-semibold">
					Todo Items ({todos.length})
					{#if lastLoadTime > 0}
						<span class="ml-2 text-sm font-normal text-gray-500">
							({formatLoadTime(lastLoadTime)})
						</span>
					{/if}
				</h2>
				<button
					class="ml-2 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					on:click={onTodosChange}
					aria-label="Refresh todos"
					title="Refresh todos"
					disabled={isLoading}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 2v6h-6"></path>
						<path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
						<path d="M3 22v-6h6"></path>
						<path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
					</svg>
				</button>
			</div>
			<span class="text-sm text-gray-500">
				{#if todos.length > 0}
					Showing all items
				{:else}
					No items
				{/if}
			</span>
		</div>

		{#if todos.length === 0}
			<p class="text-gray-600">No todo items found</p>
		{:else}
			<table class="w-full min-w-full table-auto">
				<thead class="bg-gray-50 text-xs font-medium uppercase text-gray-500">
					<tr>
						<th class="px-2 py-1 text-left">ID</th>
						<th class="px-2 py-1 text-left">Status</th>
						<th class="px-2 py-1 text-left">Priority</th>
						<th class="px-2 py-1 text-left">Urgency</th>
						<th class="px-2 py-1 text-left">Title</th>
						<th class="px-2 py-1 text-left">Tags</th>
						<th class="px-2 py-1 text-left">Deadline</th>
						<th class="px-2 py-1 text-left">Finish By</th>
						<th class="px-2 py-1 text-left">Todo Date</th>
						<th class="px-2 py-1 text-left">Created At</th>
						<th class="px-2 py-1 text-center">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each todos as todo}
						<tr class="hover:bg-gray-50">
							<!-- ID -->
							<td class="whitespace-nowrap px-2 py-2">
								<span class="font-mono text-xs text-gray-500" title={todo.id}>
									{todo.id.substring(0, 8)}...
								</span>
							</td>

							<!-- Status indicator -->
							<td class="whitespace-nowrap px-2 py-2">
								<div class="flex items-center">
									<div
										class="mr-2 h-2.5 w-2.5 rounded-full"
										class:bg-yellow-400={todo.status === 'pending'}
										class:bg-blue-400={todo.status === 'in-progress'}
										class:bg-green-400={todo.status === 'completed'}
										class:bg-red-400={todo.status === 'blocked'}
									></div>
									<span
										class="rounded px-1.5 py-0.5 text-xs font-medium"
										class:bg-yellow-100={todo.status === 'pending'}
										class:text-yellow-800={todo.status === 'pending'}
										class:bg-blue-100={todo.status === 'in-progress'}
										class:text-blue-800={todo.status === 'in-progress'}
										class:bg-green-100={todo.status === 'completed'}
										class:text-green-800={todo.status === 'completed'}
										class:bg-red-100={todo.status === 'blocked'}
										class:text-red-800={todo.status === 'blocked'}
									>
										{todo.status}
									</span>
								</div>
							</td>

							<!-- Priority -->
							<td class="whitespace-nowrap px-2 py-2">
								<span
									class="rounded px-1.5 py-0.5 text-xs font-medium"
									class:bg-red-100={todo.priority === 'P0'}
									class:text-red-800={todo.priority === 'P0'}
									class:bg-orange-100={todo.priority === 'P1'}
									class:text-orange-800={todo.priority === 'P1'}
									class:bg-yellow-100={todo.priority === 'P2'}
									class:text-yellow-800={todo.priority === 'P2'}
									class:bg-gray-100={todo.priority === 'P3'}
									class:text-gray-800={todo.priority === 'P3'}
								>
									{todo.priority}
								</span>
							</td>

							<!-- Urgency -->
							<td class="whitespace-nowrap px-2 py-2">
								<span
									class="rounded px-1.5 py-0.5 text-xs font-medium"
									class:bg-red-100={todo.urgency === 'high'}
									class:text-red-800={todo.urgency === 'high'}
									class:bg-yellow-100={todo.urgency === 'medium'}
									class:text-yellow-800={todo.urgency === 'medium'}
									class:bg-gray-100={todo.urgency === 'low'}
									class:text-gray-800={todo.urgency === 'low'}
								>
									{todo.urgency}
								</span>
							</td>

							<!-- Title -->
							<td class="whitespace-nowrap px-2 py-2">
								<div class="flex items-center">
									<div
										class="max-w-[200px] truncate font-medium"
										style="color: {getColorForId(todo.id)}"
									>
										{#if todo.emoji}
											<span class="mr-1">{todo.emoji}</span>
										{/if}
										{todo.title}
									</div>
								</div>
							</td>

							<!-- Tags -->
							<td class="whitespace-nowrap px-2 py-2">
								{#if todo.tags && todo.tags.length > 0}
									<div class="flex flex-wrap gap-1">
										{#each todo.tags.slice(0, 2) as tag}
											<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
												>{tag}</span
											>
										{/each}
										{#if todo.tags.length > 2}
											<span class="text-xs text-gray-500">+{todo.tags.length - 2}</span>
										{/if}
									</div>
								{:else}
									<span class="text-xs text-gray-400">-</span>
								{/if}
							</td>

							<!-- Deadline -->
							<td class="whitespace-nowrap px-2 py-2">
								{#if todo.deadline}
									<span class="text-xs text-gray-500"
										>{new Date(todo.deadline).toLocaleString()}</span
									>
								{:else}
									<span class="text-xs text-gray-500"
										>{new Date(
											new Date(todo.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
										).toLocaleString()}</span
									>
								{/if}
							</td>

							<!-- Finish By -->
							<td class="whitespace-nowrap px-2 py-2">
								{#if todo.finishBy}
									<span class="text-xs text-gray-500"
										>{new Date(todo.finishBy).toLocaleString()}</span
									>
								{:else}
									<span class="text-xs text-gray-500"
										>{new Date(
											new Date(todo.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
										).toLocaleString()}</span
									>
								{/if}
							</td>

							<!-- Todo Date -->
							<td class="whitespace-nowrap px-2 py-2">
								{#if todo.todo}
									<span class="text-xs text-gray-500">{new Date(todo.todo).toLocaleString()}</span>
								{:else}
									<span class="text-xs text-gray-400">-</span>
								{/if}
							</td>

							<!-- Created At -->
							<td class="whitespace-nowrap px-2 py-2">
								<span class="text-xs text-gray-500"
									>{new Date(todo.createdAt).toLocaleString()}</span
								>
							</td>

							<!-- Actions -->
							<td class="whitespace-nowrap px-2 py-2 text-center">
								<button
									class="inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600"
									on:click={() => toggleExpand(todo.id)}
									aria-label={expandedTodoId === todo.id ? 'Collapse details' : 'Expand details'}
								>
									{#if expandedTodoId === todo.id}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"><path d="m18 15-6-6-6 6" /></svg
										>
									{:else}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											stroke-width="2"
											stroke-linecap="round"
											stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg
										>
									{/if}
								</button>
							</td>
						</tr>

						<!-- Expanded details row -->
						{#if expandedTodoId === todo.id}
							<tr class="bg-gray-50">
								<td colspan="8" class="px-4 py-2">
									<div class="text-sm">
										{#if todo.description}
											<p class="mb-2 text-gray-600">{todo.description}</p>
										{/if}

										<div class="mb-2">
											<span class="font-medium text-gray-700">Path: </span>
											<span class="font-mono text-xs text-gray-600">{todo.path}</span>
										</div>

										<div class="mb-2">
											<span class="font-medium text-gray-700">Deadline: </span>
											<span class="text-gray-600">
												{#if todo.deadline}
													{new Date(todo.deadline).toLocaleString()}
												{:else}
													{new Date(
														new Date(todo.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
													).toLocaleString()}
												{/if}
											</span>
										</div>

										<div class="mb-2">
											<span class="font-medium text-gray-700">Finish By: </span>
											<span class="text-gray-600">
												{#if todo.finishBy}
													{new Date(todo.finishBy).toLocaleString()}
												{:else}
													{new Date(
														new Date(todo.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
													).toLocaleString()}
												{/if}
											</span>
										</div>

										{#if todo.parentId}
											<div class="mb-2">
												<span class="font-medium text-gray-700">Parent Task: </span>
												{#if todos.find((t) => t.id === todo.parentId)}
													<span class="text-gray-600"
														>{todos.find((t) => t.id === todo.parentId)?.title}</span
													>
												{:else}
													<span class="italic text-gray-500">Parent task not found</span>
												{/if}
											</div>
										{/if}

										{#if todo.attachments && todo.attachments.length > 0}
											<div class="mb-2">
												<span class="font-medium text-gray-700">Attachments: </span>
												<div class="mt-1 flex flex-wrap gap-2">
													{#each todo.attachments as attachment}
														<a
															href={attachment.url}
															target="_blank"
															rel="noopener noreferrer"
															class="inline-flex items-center text-xs text-blue-600 hover:underline"
														>
															<svg
																xmlns="http://www.w3.org/2000/svg"
																width="12"
																height="12"
																viewBox="0 0 24 24"
																fill="none"
																stroke="currentColor"
																stroke-width="2"
																stroke-linecap="round"
																stroke-linejoin="round"
																class="mr-1"
																><path
																	d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
																></path></svg
															>
															{attachment.name}
														</a>
													{/each}
												</div>
											</div>
										{/if}

										{#if todo.urls && todo.urls.length > 0}
											<div class="mb-2">
												<span class="font-medium text-gray-700">URLs: </span>
												<div class="mt-1 flex flex-col gap-2">
													{#each todo.urls as urlData}
														<a
															href={urlData.url}
															target="_blank"
															rel="noopener noreferrer"
															class="group flex items-start gap-2 rounded border border-gray-200 p-2 hover:border-blue-300 hover:bg-blue-50"
														>
															{#if urlData.favicon}
																<img
																	src={urlData.favicon}
																	alt=""
																	class="mt-0.5 h-4 w-4 flex-shrink-0"
																	loading="lazy"
																/>
															{:else}
																<svg
																	xmlns="http://www.w3.org/2000/svg"
																	width="16"
																	height="16"
																	viewBox="0 0 24 24"
																	fill="none"
																	stroke="currentColor"
																	stroke-width="2"
																	stroke-linecap="round"
																	stroke-linejoin="round"
																	class="mt-0.5 flex-shrink-0 text-gray-400"
																>
																	<path
																		d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
																	></path>
																	<path
																		d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
																	></path>
																</svg>
															{/if}
															<div class="flex flex-col">
																<span
																	class="text-sm font-medium text-blue-600 group-hover:underline"
																>
																	{urlData.title || urlData.url}
																</span>
																{#if urlData.description}
																	<span class="text-xs text-gray-500">{urlData.description}</span>
																{/if}
																<span class="mt-1 text-xs text-gray-400">{urlData.url}</span>
															</div>
														</a>
													{/each}
												</div>
											</div>
										{/if}

										<div class="text-xs text-gray-500">
											<span>ID: <span class="font-mono">{todo.id}</span></span>
											<span class="ml-3">Created: {new Date(todo.createdAt).toLocaleString()}</span>
											<span class="ml-3">Updated: {new Date(todo.updatedAt).toLocaleString()}</span>
										</div>
									</div>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
