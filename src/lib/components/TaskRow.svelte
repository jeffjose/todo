<script lang="ts">
	import type { Task } from '$lib/types';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { formatShortDate } from '$lib/utils/dates';

	interface Props {
		task: Task;
		onToggle?: (id: string) => void;
		onClick?: (task: Task) => void;
		onHover?: (id: string | null) => void;
		showDueDate?: boolean;
		isHighlighted?: boolean;
	}

	let { task, onToggle, onClick, onHover, showDueDate = false, isHighlighted = false }: Props = $props();

	const priorityColors: Record<string, string> = {
		P0: 'bg-red-500/20 text-red-400 border-red-500/30',
		P1: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
		P2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
		P3: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
	};

	let isCompleted = $derived(task.status === 'completed');

	// Get the due date to display (prefer deadline, fallback to finishBy)
	let dueDate = $derived(task.deadline || task.finishBy);
	let dueDateLabel = $derived(() => {
		if (!dueDate) return null;
		const label = task.deadline ? 'due' : 'finish';
		return `${label} ${formatShortDate(dueDate)}`;
	});
</script>

<div
	class="group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-zinc-800/50 cursor-pointer transition-colors {isHighlighted ? 'ring-1 ring-blue-500/50 bg-blue-500/10' : ''}"
	style="padding-left: calc(0.5rem + {task.level * 0.75}rem)"
	role="button"
	tabindex="0"
	onclick={() => onClick?.(task)}
	onkeydown={(e) => e.key === 'Enter' && onClick?.(task)}
	onmouseenter={() => onHover?.(task.id)}
	onmouseleave={() => onHover?.(null)}
>
	<!-- Checkbox -->
	<div
		onclick={(e) => {
			e.stopPropagation();
			onToggle?.(task.id);
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.stopPropagation();
				onToggle?.(task.id);
			}
		}}
		role="button"
		tabindex="0"
	>
		<Checkbox checked={isCompleted} class="border-zinc-600 data-[state=checked]:bg-zinc-600" />
	</div>

	<!-- Emoji -->
	{#if task.emoji}
		<span class="text-sm">{task.emoji}</span>
	{/if}

	<!-- Title -->
	<span
		class="flex-1 text-sm truncate {isCompleted
			? 'text-zinc-500 line-through'
			: 'text-zinc-200'}"
	>
		{task.title}
	</span>

	<!-- Due Date (when showing in todo column) -->
	{#if showDueDate && dueDate && !isCompleted}
		<span class="text-[10px] text-zinc-500">
			{dueDateLabel()}
		</span>
	{/if}

	<!-- Priority Badge -->
	<span
		class="text-[10px] font-medium px-1.5 py-0.5 rounded border {priorityColors[task.priority]}"
	>
		{task.priority}
	</span>
</div>
