<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Todo</title>
</svelte:head>

{@render children()}
