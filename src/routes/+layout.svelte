<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { initializeDB } from '$lib/client/db';

	let { children } = $props();

	onMount(async () => {
		try {
			await initializeDB();
		} catch (error) {
			console.error('Failed to initialize database:', error);
		}
	});
</script>

{@render children()}
