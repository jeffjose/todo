<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeDB, testDataPersistence } from '$lib/client/db';

	let { children } = $props();

	onMount(() => {
		console.log('Layout mounted, initializing database...');
		initializeDB()
			.then(() => {
				console.log('Database initialization completed in layout');
			})
			.catch((error) => {
				console.error('Failed to initialize database in layout:', error);
			});
	});

	async function handleTestClick() {
		try {
			const result = await testDataPersistence();
			console.log('Persistence test result:', result);
			alert(result.message);
		} catch (error) {
			console.error('Test failed:', error);
			alert('Test failed. Check console for details.');
		}
	}
</script>

<div class="fixed right-4 bottom-4">
	<button
		class="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
		on:click={handleTestClick}
	>
		Test DB Persistence
	</button>
</div>

{@render children()}
