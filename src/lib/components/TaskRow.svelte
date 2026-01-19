<script lang="ts">
	import type { Task } from '$lib/types';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { formatShortDate, daysDiff } from '$lib/utils/dates';
	import { ChevronsRight } from '@lucide/svelte';

	interface Props {
		task: Task;
		onToggle?: (id: string) => void;
		onClick?: (task: Task) => void;
		onHover?: (id: string | null) => void;
		showDueDate?: boolean;
		isHighlighted?: boolean;
		workOrder?: number;
		isGhost?: boolean; // Show as ghost (promoted to current week)
	}

	let { task, onToggle, onClick, onHover, showDueDate = false, isHighlighted = false, workOrder, isGhost = false }: Props = $props();

	const priorityColors: Record<string, string> = {
		P0: 'bg-red-500/20 text-red-400 border-red-500/30',
		P1: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
		P2: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
		P3: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
	};

	let isCompleted = $derived(task.status === 'completed');
	let isBlocked = $derived(task.status === 'blocked');

	// Calculate status badge (overdue/slipped)
	let today = new Date();
	let statusBadge = $derived.by(() => {
		if (isCompleted) return null;

		// Check deadline first (overdue) - most urgent
		if (task.deadline) {
			const days = daysDiff(today, task.deadline);
			if (days > 0) {
				return { type: 'overdue' as const, days, label: `${days}d overdue` };
			}
		}

		// Check finishBy (slipped)
		if (task.finishBy) {
			const days = daysDiff(today, task.finishBy);
			if (days > 0) {
				return { type: 'slipped' as const, days, label: `${days}d slipped` };
			}
		}

		// Todo dates don't get badges - they're just suggestions
		return null;
	});

	// Check if todo date is in the past (for subtle styling)
	let isTodoPast = $derived.by(() => {
		if (isCompleted || !task.todo) return false;
		return daysDiff(today, task.todo) > 0;
	});

	// Get the due date to display (prefer deadline, fallback to finishBy)
	let dueDate = $derived(task.deadline || task.finishBy);
	let dueDateLabel = $derived.by(() => {
		if (!dueDate) return null;
		const label = task.deadline ? 'due' : 'finish';
		return `${label} ${formatShortDate(dueDate)}`;
	});
</script>

<div
	class="group flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-zinc-800/50 cursor-pointer transition-colors {isHighlighted ? 'ring-1 ring-blue-500/50 bg-blue-500/10' : ''} {isBlocked ? 'opacity-60' : ''} {isGhost ? 'opacity-50' : ''}"
	style="padding-left: calc(0.375rem + {task.level * 0.5}rem)"
	role="button"
	tabindex="0"
	onclick={() => onClick?.(task)}
	onkeydown={(e) => e.key === 'Enter' && onClick?.(task)}
	onmouseenter={() => onHover?.(task.id)}
	onmouseleave={() => onHover?.(null)}
>
	<!-- Work Order Badge -->
	{#if workOrder && !isGhost}
		<span class="text-[9px] font-bold text-emerald-400 bg-emerald-500/20 w-4 h-4 rounded-full flex items-center justify-center shrink-0">
			{workOrder}
		</span>
	{/if}

	<!-- Ghost indicator (promoted to current week) -->
	{#if isGhost}
		<ChevronsRight class="w-3.5 h-3.5 text-zinc-500 shrink-0" />
	{:else}
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
	{/if}

	<!-- Blocked indicator -->
	{#if isBlocked}
		<span class="text-[10px] text-purple-400 bg-purple-500/20 px-1.5 py-0.5 rounded">blocked</span>
	{/if}

	<!-- Emoji -->
	{#if task.emoji}
		<span class="text-xs">{task.emoji}</span>
	{/if}

	<!-- Title -->
	<span
		class="flex-1 text-xs truncate {isCompleted
			? 'text-zinc-500 line-through'
			: isBlocked
				? 'text-zinc-400 italic'
				: 'text-zinc-200'}"
	>
		{task.title}
	</span>

	<!-- Status Badge (overdue/slipped) -->
	{#if statusBadge}
		<span
			class="text-[10px] font-medium px-1.5 py-0.5 rounded {statusBadge.type === 'overdue'
				? 'text-red-400 bg-red-500/20'
				: 'text-yellow-400 bg-yellow-500/20'}"
		>
			{statusBadge.label}
		</span>
	{/if}

	<!-- Subtle indicator for past todo (just a small dot) -->
	{#if isTodoPast && !statusBadge}
		<span class="w-1.5 h-1.5 rounded-full bg-zinc-500" title="Todo date passed"></span>
	{/if}

	<!-- Due Date (when showing in todo column) -->
	{#if showDueDate && dueDate && !isCompleted}
		<span class="text-[10px] text-zinc-500">
			{dueDateLabel}
		</span>
	{/if}

	<!-- Priority Badge -->
	<span
		class="text-[10px] font-medium px-1.5 py-0.5 rounded border {priorityColors[task.priority]}"
	>
		{task.priority}
	</span>
</div>
