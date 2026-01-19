<script lang="ts">
	import type { Task } from '$lib/types';
	import TaskRow from './TaskRow.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		tasks: Task[];
		emptyText?: string;
		showDueDate?: boolean;
		onToggleTask?: (id: string) => void;
		onClickTask?: (task: Task) => void;
		headerSlot?: Snippet;
	}

	let { title, tasks, emptyText = 'No tasks', showDueDate = false, onToggleTask, onClickTask, headerSlot }: Props = $props();
</script>

<div class="flex flex-col min-h-0">
	<!-- Column Header -->
	<div class="flex items-center justify-between px-2 py-1.5 border-b border-zinc-800">
		<div class="flex items-center gap-2">
			<span class="text-xs font-medium text-zinc-400">{title}</span>
			{#if tasks.length > 0}
				<span class="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{tasks.length}</span>
			{/if}
		</div>
		{#if headerSlot}
			{@render headerSlot()}
		{/if}
	</div>

	<!-- Task List -->
	<div class="flex-1 overflow-y-auto py-1">
		{#if tasks.length === 0}
			<p class="text-xs text-zinc-600 px-2 py-2">{emptyText}</p>
		{:else}
			{#each tasks as task (task.id)}
				<TaskRow {task} {showDueDate} onToggle={onToggleTask} onClick={onClickTask} />
			{/each}
		{/if}
	</div>
</div>
