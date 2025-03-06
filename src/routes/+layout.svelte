<script lang="ts">
	import '../app.css';
	import { createTodo } from '$lib/client/dexie';
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
			const newTodo = await createTodo({
				title: 'New Todo',
				description: null,
				emoji: null,
				deadline: null,
				finishBy: null,
				status: 'pending',
				priority: 'P3',
				urgency: 'medium',
				tags: [],
				attachments: [],
				path: 'root',
				level: 0,
				parentId: null
			});
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
