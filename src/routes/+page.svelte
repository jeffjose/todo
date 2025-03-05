<script lang="ts">
	import { onMount } from 'svelte';
	import { addNewTodo, addMultipleTodos, loadTodos, type Todo } from '$lib/client/db';
	import { Button } from '$lib/components/ui/button';

	let todos = $state<Todo[]>([]);
	let notification = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	let expandedTodoId = $state<string | null>(null);
	let isLoading = $state<boolean>(false);

	onMount(async () => {
		todos = await loadTodos();
	});

	async function handleAddNewTodo() {
		try {
			const result = await addNewTodo();
			if (result.success) {
				todos = await loadTodos();
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
				todos = await loadTodos();
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

	function toggleExpand(todoId: string) {
		expandedTodoId = expandedTodoId === todoId ? null : todoId;
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">Todo Management ({todos.length} items)</h1>

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
			<h2 class="text-xl font-semibold">Todo Items ({todos.length})</h2>
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
						<th class="px-2 py-1 text-left">Title</th>
						<th class="px-2 py-1 text-left">Tags</th>
						<th class="px-2 py-1 text-left">Deadline</th>
						<th class="px-2 py-1 text-center">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					{#each todos as todo}
						<tr class="hover:bg-gray-50">
							<!-- ID -->
							<td class="whitespace-nowrap px-2 py-2">
								<span class="font-mono text-xs text-gray-500" title={todo.id}>
									{todo.id.startsWith('todo-')
										? todo.id.substring(5, 13) + '...'
										: todo.id.substring(0, 8) + '...'}
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

							<!-- Title -->
							<td class="whitespace-nowrap px-2 py-2">
								<div class="max-w-[200px] truncate font-medium">{todo.title}</div>
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
										>{new Date(todo.deadline).toLocaleDateString()}</span
									>
								{:else}
									<span class="text-xs text-gray-400">-</span>
								{/if}
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
								<td colspan="6" class="px-4 py-2">
									<div class="text-sm">
										{#if todo.description}
											<p class="mb-2 text-gray-600">{todo.description}</p>
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
