<script lang="ts">
	import { onMount } from 'svelte';
	import { testDataPersistence, loadUsers, type User } from '$lib/client/db';
	import { Button } from '$lib/components/ui/button';

	let users = $state<User[]>([]);
	let notification = $state<{ message: string; type: 'success' | 'error' } | null>(null);

	onMount(async () => {
		users = await loadUsers();
	});

	async function handleTestPersistence() {
		try {
			const result = await testDataPersistence();
			if (result.success) {
				users = await loadUsers();
				notification = {
					message: 'Test user added successfully',
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
			console.error('Test failed:', error);
			notification = {
				message: error instanceof Error ? error.message : 'Test failed',
				type: 'error'
			};
		}
	}
</script>

<div class="container mx-auto p-4">
	<h1 class="mb-4 text-2xl font-bold">User Management</h1>

	<Button onclick={handleTestPersistence}>Test DB Persistence</Button>

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

	<div class="mb-4 rounded bg-white px-8 pb-8 pt-6 shadow-md">
		<h2 class="mb-4 text-xl font-semibold">Users</h2>
		{#if users.length === 0}
			<p class="text-gray-600">No users found</p>
		{:else}
			<ul class="space-y-2">
				{#each users as user}
					<li class="border-b py-2">
						<span class="font-medium">{user.username}</span>
						<span class="ml-2 text-gray-600">Age: {user.age}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
