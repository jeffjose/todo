<script lang="ts">
	import type { Task } from '$lib/types';
	import TaskRow from './TaskRow.svelte';
	import { formatWeekRange, isCurrentWeek, getWeekDays, isDateInWeek, isSameDay, isToday, isDateBeforeWeek } from '$lib/utils/dates';
	import { Plus } from '@lucide/svelte';

	interface Props {
		weekStart: Date;
		tasks: Task[];
		currentDate?: Date;
		onToggleTask?: (id: string) => void;
		onClickTask?: (task: Task) => void;
		onAddTask?: (date: Date, column: 'deadline' | 'finishBy' | 'todo') => void;
		hoveredTaskId?: string | null;
		onHoverTask?: (id: string | null) => void;
		workOrderMap?: Map<string, number>;
	}

	let {
		weekStart,
		tasks,
		currentDate = new Date(),
		onToggleTask,
		onClickTask,
		onAddTask,
		hoveredTaskId = null,
		onHoverTask,
		workOrderMap = new Map()
	}: Props = $props();

	let isCurrent = $derived(isCurrentWeek(weekStart, currentDate));
	let weekDays = $derived(getWeekDays(weekStart));

	// Sort by priority (P0 first, then P1, P2, P3), then by status (pending first)
	const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
	function sortByPriority(taskList: Task[]): Task[] {
		return [...taskList].sort((a, b) => {
			// Completed tasks go to bottom
			if (a.status === 'completed' && b.status !== 'completed') return 1;
			if (a.status !== 'completed' && b.status === 'completed') return -1;
			// Then sort by priority
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		});
	}

	// Check if this is a past week (tasks here might be promoted to current week)
	let isPast = $derived(!isCurrent && isDateBeforeWeek(weekStart, currentDate));

	// Filter tasks for this week by column
	// Deadline column: tasks with deadline in this week (never promoted, stay in original week)
	let deadlineTasks = $derived(
		sortByPriority(tasks.filter((t) => t.deadline && isDateInWeek(t.deadline, weekStart)))
	);

	// FinishBy column: tasks with finishBy in this week
	// For current week: also include past overdue finishBy tasks (promotion)
	let finishByTasks = $derived(
		sortByPriority(tasks.filter((t) => {
			if (!t.finishBy) return false;
			// Task has finishBy in this week
			if (isDateInWeek(t.finishBy, weekStart)) return true;
			// For current week: promote past incomplete finishBy tasks
			if (isCurrent && t.status !== 'completed' && isDateBeforeWeek(t.finishBy, weekStart)) return true;
			return false;
		}))
	);

	// Todo column: tasks with todo in this week
	// For current week: also include past open todos and tasks without dates
	let todoTasks = $derived(
		sortByPriority(tasks.filter((t) => {
			// Show tasks with todo date in this week
			if (t.todo && isDateInWeek(t.todo, weekStart)) return true;
			// For current week: promote past incomplete todo tasks
			if (isCurrent && t.todo && t.status !== 'completed' && isDateBeforeWeek(t.todo, weekStart)) return true;
			// For current week, also show open tasks without any date
			if (isCurrent && t.status !== 'completed' && !t.deadline && !t.finishBy && !t.todo) return true;
			return false;
		}))
	);

	// Check if a task is promoted (shown as ghost in past week)
	function isTaskPromoted(task: Task, dateField: 'deadline' | 'finishBy' | 'todo'): boolean {
		if (task.status === 'completed') return false;
		if (!isPast) return false;
		const taskDate = task[dateField];
		if (!taskDate) return false;
		return isDateInWeek(taskDate, weekStart);
	}

	// Get tasks for a specific day
	function getTasksForDay(day: Date, dateField: 'deadline' | 'finishBy' | 'todo'): Task[] {
		const isDayToday = isToday(day, currentDate);

		const filtered = tasks.filter((t) => {
			const taskDate = t[dateField];

			// Handle tasks without this date field
			if (!taskDate) {
				// For todo column on today, include tasks without any dates
				if (dateField === 'todo' && isDayToday && t.status !== 'completed' && !t.deadline && !t.finishBy && !t.todo) {
					return true;
				}
				return false;
			}

			// Task has this date - check if it matches this day
			if (isSameDay(taskDate, day)) return true;

			// For today: also show promoted tasks (past incomplete tasks)
			// Deadline tasks: never promoted (stay in original week)
			// FinishBy and Todo tasks: promote to today if past and incomplete
			if (isDayToday && dateField !== 'deadline' && t.status !== 'completed') {
				// Check if the task's date is before today's week (promoted)
				if (isDateBeforeWeek(taskDate, weekStart)) {
					return true;
				}
			}

			return false;
		});
		return sortByPriority(filtered);
	}

	// Format day for display
	function formatDay(day: Date): string {
		const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
		const date = day.getDate();
		return `${dayName} ${date}`;
	}
</script>

<div
	class="border-b border-zinc-800 {isCurrent ? 'border-l-2 border-l-yellow-500' : ''}"
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

				<div class="grid grid-cols-[100px_1fr_1fr_1fr] {isDayToday ? 'bg-yellow-500/10' : ''}">
					<!-- Day Label -->
					<div class="px-3 py-2 border-r border-zinc-800/50 flex items-start">
						<span class="text-xs {isDayToday ? 'text-yellow-400 font-medium' : 'text-zinc-500'}">
							{formatDay(day)}
						</span>
					</div>

					<!-- Deadline Column -->
					<div class="px-2 py-1 border-r border-zinc-800/50 min-h-[32px]">
						{#each dayDeadlines as task (task.id)}
							<TaskRow {task} onToggle={onToggleTask} onClick={onClickTask} onHover={onHoverTask} isHighlighted={hoveredTaskId === task.id} workOrder={workOrderMap.get(task.id)} />
						{/each}
					</div>

					<!-- Finish By Column -->
					<div class="px-2 py-1 border-r border-zinc-800/50 min-h-[32px]">
						{#each dayFinishBy as task (task.id)}
							<TaskRow {task} onToggle={onToggleTask} onClick={onClickTask} onHover={onHoverTask} isHighlighted={hoveredTaskId === task.id} />
						{/each}
					</div>

					<!-- Todo Column -->
					<div class="px-2 py-1 min-h-[32px]">
						{#each dayTodos as task (task.id)}
							<TaskRow {task} showDueDate={true} onToggle={onToggleTask} onClick={onClickTask} onHover={onHoverTask} isHighlighted={hoveredTaskId === task.id} />
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
						<TaskRow {task} onToggle={onToggleTask} onClick={onClickTask} onHover={onHoverTask} isHighlighted={hoveredTaskId === task.id} workOrder={workOrderMap.get(task.id)} />
					{/each}
				{/if}
			</div>

			<!-- Finish By Column -->
			<div class="px-2 py-1 border-r border-zinc-800/50">
				{#if finishByTasks.length === 0}
					<span class="text-xs text-zinc-700">-</span>
				{:else}
					{#each finishByTasks as task (task.id)}
						<TaskRow {task} onToggle={onToggleTask} onClick={onClickTask} onHover={onHoverTask} isHighlighted={hoveredTaskId === task.id} isGhost={isTaskPromoted(task, 'finishBy')} />
					{/each}
				{/if}
			</div>

			<!-- Todo Column -->
			<div class="px-2 py-1">
				{#if todoTasks.length === 0}
					<span class="text-xs text-zinc-700">-</span>
				{:else}
					{#each todoTasks as task (task.id)}
						<TaskRow {task} showDueDate={true} onToggle={onToggleTask} onClick={onClickTask} onHover={onHoverTask} isHighlighted={hoveredTaskId === task.id} isGhost={isTaskPromoted(task, 'todo')} />
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
