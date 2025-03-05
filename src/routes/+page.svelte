<script lang="ts">
	import { onMount } from 'svelte';
	import { initializeDB } from '$lib/client/db';
	import { users, type User } from '$lib/client/stores';

	let loading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			await initializeDB();
		} catch (err) {
			console.error('Failed to initialize database:', err);
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			loading = false;
		}
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
				{#each $users as user}
					<tr>
						<td>{user.username}</td>
						<td>{user.age}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>
