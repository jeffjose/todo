<script lang="ts">
	import type { Task } from '$lib/types';
	import Column from './Column.svelte';
	import { formatWeekRange, isCurrentWeek, getWeekDays, formatDayDate, isDateInWeek } from '$lib/utils/dates';
	import { Plus } from '@lucide/svelte';

	interface Props {
		weekStart: Date;
		tasks: Task[];
		currentDate?: Date;
		expanded?: boolean;
		onToggleTask?: (id: string) => void;
		onClickTask?: (task: Task) => void;
		onAddTask?: (date: Date, column: 'deadline' | 'finishBy' | 'todo') => void;
	}

	let {
		weekStart,
		tasks,
		currentDate = new Date(),
		expanded = false,
		onToggleTask,
		onClickTask,
		onAddTask
	}: Props = $props();

	let isCurrent = $derived(isCurrentWeek(weekStart, currentDate));
	let weekDays = $derived(getWeekDays(weekStart));

	// Filter tasks for this week by column
	let deadlineTasks = $derived(
		tasks.filter((t) => t.deadline && isDateInWeek(t.deadline, weekStart))
	);
	let finishByTasks = $derived(
		tasks.filter((t) => t.finishBy && isDateInWeek(t.finishBy, weekStart))
	);
	let todoTasks = $derived(
		tasks.filter((t) => {
			// Show tasks with todo date in this week
			if (t.todo && isDateInWeek(t.todo, weekStart)) return true;
			// For current week, also show open tasks without any date
			if (isCurrent && t.status !== 'completed' && !t.deadline && !t.finishBy && !t.todo) return true;
			return false;
		})
	);
</script>

<div
	class="border-b border-zinc-800 {isCurrent ? 'bg-amber-500/5' : ''}"
	class:min-h-[200px]={expanded}
>
	<!-- Week Header -->
	<div class="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/50">
		<span class="text-xs font-medium {isCurrent ? 'text-amber-400' : 'text-zinc-400'}">
			{formatWeekRange(weekStart)}
		</span>
		{#if isCurrent}
			<span class="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">Current</span>
		{/if}
	</div>

	{#if expanded}
		<!-- Expanded view for current week: show day rows -->
		<div class="grid grid-cols-3 divide-x divide-zinc-800 min-h-[160px]">
			<Column
				title="Deadline"
				tasks={deadlineTasks}
				emptyText="No deadlines"
				{onToggleTask}
				{onClickTask}
			>
				{#snippet headerSlot()}
					<button
						class="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
						onclick={() => onAddTask?.(weekStart, 'deadline')}
					>
						<Plus class="w-3 h-3" />
					</button>
				{/snippet}
			</Column>
			<Column
				title="Finish By"
				tasks={finishByTasks}
				emptyText="No finish by tasks"
				{onToggleTask}
				{onClickTask}
			>
				{#snippet headerSlot()}
					<button
						class="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
						onclick={() => onAddTask?.(weekStart, 'finishBy')}
					>
						<Plus class="w-3 h-3" />
					</button>
				{/snippet}
			</Column>
			<Column
				title="Open Todos"
				tasks={todoTasks}
				emptyText="No open tasks"
				{onToggleTask}
				{onClickTask}
			>
				{#snippet headerSlot()}
					<button
						class="w-5 h-5 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
						onclick={() => onAddTask?.(weekStart, 'todo')}
					>
						<Plus class="w-3 h-3" />
					</button>
				{/snippet}
			</Column>
		</div>
	{:else}
		<!-- Collapsed view: single row with task counts -->
		<div class="grid grid-cols-3 divide-x divide-zinc-800">
			<div class="px-3 py-2">
				{#if deadlineTasks.length > 0}
					<span class="text-xs text-zinc-400">{deadlineTasks.length} deadline{deadlineTasks.length !== 1 ? 's' : ''}</span>
				{:else}
					<span class="text-xs text-zinc-600">-</span>
				{/if}
			</div>
			<div class="px-3 py-2">
				{#if finishByTasks.length > 0}
					<span class="text-xs text-zinc-400">{finishByTasks.length} finish by</span>
				{:else}
					<span class="text-xs text-zinc-600">-</span>
				{/if}
			</div>
			<div class="px-3 py-2">
				{#if todoTasks.length > 0}
					<span class="text-xs text-zinc-400">{todoTasks.length} todo{todoTasks.length !== 1 ? 's' : ''}</span>
				{:else}
					<span class="text-xs text-zinc-600">-</span>
				{/if}
			</div>
		</div>
	{/if}
</div>
