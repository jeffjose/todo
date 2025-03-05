<script lang="ts">
	import '../app.css';
	import { testDataPersistence } from '$lib/client/db';

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

	async function handleTestClick() {
		try {
			const result = await testDataPersistence();
			console.log('Persistence test result:', result);
			showNotification(result.message, result.success ? 'success' : 'error');
		} catch (error) {
			console.error('Test failed:', error);
			showNotification(error instanceof Error ? error.message : 'Test failed', 'error');
		}
	}
</script>

{#if notification}
	<div
		class="fixed top-4 right-4 rounded px-4 py-2 text-white transition-opacity"
		class:bg-green-500={notification.type === 'success'}
		class:bg-red-500={notification.type === 'error'}
	>
		{notification.message}
	</div>
{/if}

<div class="fixed right-4 bottom-4">
	<button
		class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
		on:click={handleTestClick}
	>
		Test DB Persistence
	</button>
</div>

{@render children()}
