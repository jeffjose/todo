<script lang="ts">
	import { Plus } from '@lucide/svelte';
</script>

<!-- Header Toolbar -->
<header class="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-3 shrink-0">
	<h1 class="text-sm font-medium text-zinc-100">Todo</h1>

	<div class="flex-1"></div>

	<button
		class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
	>
		<Plus class="w-4 h-4" />
	</button>
</header>

<!-- Main Content -->
<main class="flex-1 overflow-auto p-4">
	<p class="text-zinc-500 text-sm">Weekly view will go here</p>
</main>
