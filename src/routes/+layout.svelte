<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Todo</title>
</svelte:head>

<div class="dark h-screen w-screen bg-zinc-950 flex overflow-hidden">
	<!-- Left Icon Sidebar -->
	<nav class="w-12 bg-zinc-900 border-r border-zinc-800 flex flex-col items-center py-2 shrink-0">
		<!-- App Icon -->
		<div class="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 text-zinc-100">
			<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
			</svg>
		</div>

		<div class="flex-1"></div>
	</nav>

	<!-- Main Content -->
	<div class="flex-1 flex flex-col min-h-0 min-w-0">
		{@render children()}
	</div>
</div>
