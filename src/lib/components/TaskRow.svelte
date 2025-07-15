<script lang="ts">
	import { Pencil, Trash2 } from 'lucide-svelte';
	import type { Todo } from '$lib/client/dexie';
	import type { WeekEvent } from '$lib/utils/taskLogic';
	import {
		getTaskStatus,
		getStatusBadgeClass,
		getPriorityBadgeClass,
		getTaskColor,
		isCurrentWeek
	} from '$lib/utils/taskLogic';
	import { Badge } from '$lib/components/ui/badge';
	import TaskTooltip from '$lib/components/TaskTooltip.svelte';

	interface Props {
		todo: Todo;
		weekEvent: WeekEvent;
		hoveredTaskId: string | null;
		workOrder?: number;
		onTaskHover: (id: string | null) => void;
		onToggleStatus: (todo: Todo, e: Event) => void;
		onCyclePriority: (todo: Todo, e: Event) => void;
		onEditTask: (todo: Todo, e: Event) => void;
		onDeleteTask: (todo: Todo, e: Event) => void;
	}

	let {
		todo,
		weekEvent,
		hoveredTaskId,
		workOrder,
		onTaskHover,
		onToggleStatus,
		onCyclePriority,
		onEditTask,
		onDeleteTask
	}: Props = $props();

	let showTooltip = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);
	let tooltipTimeout: ReturnType<typeof setTimeout>;

	function handleMouseEnter(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		tooltipX = rect.left + rect.width / 2;
		tooltipY = rect.top;

		// Delay showing tooltip
		tooltipTimeout = setTimeout(() => {
			showTooltip = true;
		}, 500);

		onTaskHover(todo.id);
	}

	function handleMouseLeave() {
		clearTimeout(tooltipTimeout);
		showTooltip = false;
		onTaskHover(null);
	}
</script>

<div
	class="task-hover-target task-hover-highlight group flex items-center justify-between rounded px-1.5 py-0.5 transition-colors hover:bg-blue-50 dark:hover:bg-blue-950/30"
	class:task-highlight={hoveredTaskId === todo.id}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<div class="flex flex-1 items-center gap-1" class:text-gray-400={todo.status === 'completed'}>
		{#if workOrder && todo.status !== 'completed'}
			<Badge variant="default" class="flex h-5 w-5 items-center justify-center rounded-full p-0">
				{workOrder}
			</Badge>
		{/if}
		<span
			class="cursor-pointer text-xs font-semibold leading-snug {todo.status === 'completed'
				? 'text-muted-foreground/60 line-through'
				: ''}"
			style="padding-left: {todo.level * 0.75}rem"
			onclick={(e) => onToggleStatus(todo, e)}
		>
			{#if todo.emoji}<span class="mr-1">{todo.emoji}</span>{/if}{todo.title}
		</span>
		<span
			class="inline-flex h-5 cursor-pointer items-center rounded px-1 text-xs text-white {getPriorityBadgeClass(
				todo.priority,
				todo.status === 'completed'
			)}"
			onclick={(e) => onCyclePriority(todo, e)}
		>
			{todo.priority}
		</span>
		{#if isCurrentWeek(weekEvent) || weekEvent.endDate < new Date()}
			{@const status = getTaskStatus(todo, weekEvent.startDate)}
			{#if status}
				<Badge
					variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
					class="cursor-pointer text-xs {todo.status === 'completed'
						? 'line-through opacity-50'
						: ''}"
					onclick={(e) => onToggleStatus(todo, e)}
					onmouseenter={() => onTaskHover(todo.id)}
					onmouseleave={() => onTaskHover(null)}
				>
					{#if status.type === 'overdue'}
						overdue ({status.daysOverdue}d)
					{:else}
						{status.type}
					{/if}
				</Badge>
			{/if}
		{/if}
	</div>
	<div class="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
		<button
			class="rounded p-1 transition-colors hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
			onclick={(e) => onEditTask(todo, e)}
			aria-label="Edit task"
			type="button"
		>
			<Pencil class="h-3 w-3" />
		</button>
		<button
			class="rounded p-1 transition-colors hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
			onclick={(e) => onDeleteTask(todo, e)}
			aria-label="Delete task"
			type="button"
		>
			<Trash2 class="h-3 w-3" />
		</button>
	</div>
</div>

<TaskTooltip {todo} show={showTooltip} x={tooltipX} y={tooltipY} />
