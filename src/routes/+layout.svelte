<script lang="ts">
	import '../app.css';
	import { createRandomTodo } from '$lib/client/dexie';
	import { onMount } from 'svelte';

	let { children } = $props();
	let notification = $state<{ message: string; type: 'success' | 'error' } | null>(null);
	let notificationTimeout: ReturnType<typeof setTimeout>;

	function showNotification(message: string, type: 'success' | 'error' = 'success') {
		if (notificationTimeout) clearTimeout(notificationTimeout);
		notification = { message, type };
		notificationTimeout = setTimeout(() => {
			notification = null;
		}, 3000);
	}

	async function handleAddTodo() {
		try {
			const newTodo = await createRandomTodo();
			showNotification(`New todo "${newTodo.title}" added successfully`);
		} catch (error) {
			console.error('Failed to add todo:', error);
			showNotification(error instanceof Error ? error.message : 'Failed to add todo', 'error');
		}
	}
</script>

{#if notification}
	<div
		class="fixed right-4 top-4 rounded px-4 py-2 text-white transition-opacity"
		class:bg-green-500={notification.type === 'success'}
		class:bg-red-500={notification.type === 'error'}
	>
		{notification.message}
	</div>
{/if}

{@render children()}
