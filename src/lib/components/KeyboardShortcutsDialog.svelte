<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';

	interface Props {
		open: boolean;
	}

	let { open = $bindable() }: Props = $props();

	const shortcuts = [
		{ key: 'n', description: 'New task' },
		{ key: 't', description: 'Go to today' },
		{ key: 'd', description: 'Toggle demo mode' },
		{ key: 'e', description: 'Export data' },
		{ key: 'i', description: 'Import data' },
		{ key: '?', description: 'Show keyboard shortcuts' },
		{ key: 'Esc', description: 'Close dialog' }
	];
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[350px] bg-zinc-900 border-zinc-800">
		<Dialog.Header>
			<Dialog.Title class="text-zinc-100">Keyboard Shortcuts</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-1">
			{#each shortcuts as shortcut}
				<div class="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-800/50">
					<span class="text-sm text-zinc-300">{shortcut.description}</span>
					<kbd class="px-2 py-0.5 text-xs font-mono bg-zinc-800 border border-zinc-700 rounded text-zinc-400">
						{shortcut.key}
					</kbd>
				</div>
			{/each}
		</div>
	</Dialog.Content>
</Dialog.Root>
