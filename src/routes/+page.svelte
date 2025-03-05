<script lang="ts">
	import { onMount } from 'svelte';
	import { getClientDB, initializeDB } from '$lib/client/db';

	interface User {
		id: string;
		username: string;
		age: number;
	}

	let users: User[] = [];
	let loading = true;
	let error: string | null = null;

	async function loadUsers() {
		try {
			await initializeDB();
			const client = getClientDB();
			const result = await client.query('SELECT id, username, age FROM "user" ORDER BY username');
			users = result.rows as User[];
		} catch (err) {
			console.error('Failed to fetch users:', err);
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		loadUsers();
	});
</script>

<div class="p-4">
	{#if loading}
		<p>Loading users...</p>
	{:else if error}
		<p class="text-red-500">Error: {error}</p>
	{:else}
		<table class="w-full">
			<thead>
				<tr>
					<th class="text-left">Username</th>
					<th class="text-left">Age</th>
				</tr>
			</thead>
			<tbody>
				{#each users as user}
					<tr>
						<td>{user.username}</td>
						<td>{user.age}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
