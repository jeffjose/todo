<script lang="ts">
	import type { Task } from '$lib/types';
	import TaskRow from './TaskRow.svelte';
	import { formatWeekRange, isCurrentWeek, getWeekDays, isDateInWeek, isSameDay, isToday } from '$lib/utils/dates';
	import { Plus } from '@lucide/svelte';

	interface Props {
		weekStart: Date;
		tasks: Task[];
		currentDate?: Date;
		onToggleTask?: (id: string) => void;
		onClickTask?: (task: Task) => void;
		onAddTask?: (date: Date, column: 'deadline' | 'finishBy' | 'todo') => void;
	}

	let {
		weekStart,
		tasks,
		currentDate = new Date(),
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

	// Get tasks for a specific day
	function getTasksForDay(day: Date, dateField: 'deadline' | 'finishBy' | 'todo') {
		return tasks.filter((t) => {
			const taskDate = t[dateField];
			if (!taskDate) {
				// For todo column on current day, include tasks without dates
				if (dateField === 'todo' && isToday(day, currentDate) && t.status !== 'completed' && !t.deadline && !t.finishBy && !t.todo) {
					return true;
				}
				return false;
			}
			return isSameDay(taskDate, day);
		});
	}

	// Format day for display
	function formatDay(day: Date): string {
		const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
		const date = day.getDate();
		return `${dayName} ${date}`;
	}
</script>

<div
	class="border-b border-zinc-800 {isCurrent ? 'bg-yellow-500/10 border-l-2 border-l-yellow-500' : ''}"
>
	<!-- Week Header -->
	<div class="flex items-center gap-2 px-3 py-2 border-b border-zinc-800/50">
		<span class="text-xs font-medium {isCurrent ? 'text-yellow-400' : 'text-zinc-400'}">
			{formatWeekRange(weekStart)}
		</span>
		{#if isCurrent}
			<span class="text-[10px] text-yellow-300 bg-yellow-500/20 px-1.5 py-0.5 rounded font-medium">Current</span>
		{/if}
	</div>

	{#if isCurrent}
		<!-- Day-by-day view for current week -->
		<div class="divide-y divide-zinc-800/50">
			{#each weekDays as day (day.getTime())}
				{@const dayDeadlines = getTasksForDay(day, 'deadline')}
				{@const dayFinishBy = getTasksForDay(day, 'finishBy')}
				{@const dayTodos = getTasksForDay(day, 'todo')}
				{@const isDayToday = isToday(day, currentDate)}
				{@const hasAnyTasks = dayDeadlines.length > 0 || dayFinishBy.length > 0 || dayTodos.length > 0}

				<div class="grid grid-cols-[100px_1fr_1fr_1fr] {isDayToday ? 'bg-yellow-500/5' : ''}">
					<!-- Day Label -->
					<div class="px-3 py-2 border-r border-zinc-800/50 flex items-start">
						<span class="text-xs {isDayToday ? 'text-yellow-400 font-medium' : 'text-zinc-500'}">
							{formatDay(day)}
						</span>
					</div>

					<!-- Deadline Column -->
					<div class="px-2 py-1 border-r border-zinc-800/50 min-h-[32px]">
						{#each dayDeadlines as task (task.id)}
							<TaskRow {task} onToggle={onToggleTask} onClick={onClickTask} />
						{/each}
					</div>

					<!-- Finish By Column -->
					<div class="px-2 py-1 border-r border-zinc-800/50 min-h-[32px]">
						{#each dayFinishBy as task (task.id)}
							<TaskRow {task} onToggle={onToggleTask} onClick={onClickTask} />
						{/each}
					</div>

					<!-- Todo Column -->
					<div class="px-2 py-1 min-h-[32px]">
						{#each dayTodos as task (task.id)}
							<TaskRow {task} showDueDate={true} onToggle={onToggleTask} onClick={onClickTask} />
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- Week view for past/future weeks: show actual tasks -->
		<div class="grid grid-cols-[100px_1fr_1fr_1fr] min-h-[60px]">
			<!-- Week summary label -->
			<div class="px-3 py-2 border-r border-zinc-800/50">
				<span class="text-[10px] text-zinc-600">
					{deadlineTasks.length + finishByTasks.length + todoTasks.length} tasks
				</span>
			</div>

			<!-- Deadline Column -->
			<div class="px-2 py-1 border-r border-zinc-800/50">
				{#if deadlineTasks.length === 0}
					<span class="text-xs text-zinc-700">-</span>
				{:else}
					{#each deadlineTasks as task (task.id)}
						<TaskRow {task} onToggle={onToggleTask} onClick={onClickTask} />
					{/each}
				{/if}
			</div>

			<!-- Finish By Column -->
			<div class="px-2 py-1 border-r border-zinc-800/50">
				{#if finishByTasks.length === 0}
					<span class="text-xs text-zinc-700">-</span>
				{:else}
					{#each finishByTasks as task (task.id)}
						<TaskRow {task} onToggle={onToggleTask} onClick={onClickTask} />
					{/each}
				{/if}
			</div>

			<!-- Todo Column -->
			<div class="px-2 py-1">
				{#if todoTasks.length === 0}
					<span class="text-xs text-zinc-700">-</span>
				{:else}
					{#each todoTasks as task (task.id)}
						<TaskRow {task} showDueDate={true} onToggle={onToggleTask} onClick={onClickTask} />
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
