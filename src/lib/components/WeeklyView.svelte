<script lang="ts">
	import type { Task, NewTask } from '$lib/types';
	import WeekRow from './WeekRow.svelte';
	import AddTaskDialog from './AddTaskDialog.svelte';
	import EditTaskDialog from './EditTaskDialog.svelte';
	import { getWeeksAroundCurrent, isCurrentWeek } from '$lib/utils/dates';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { tick } from 'svelte';

	interface Props {
		tasks: Task[];
		onCreateTask?: (task: NewTask) => void;
		onUpdateTask?: (id: string, updates: Partial<Task>) => void;
		onDeleteTask?: (id: string) => void;
		onToggleTask?: (id: string) => void;
	}

	let {
		tasks,
		onCreateTask,
		onUpdateTask,
		onDeleteTask,
		onToggleTask
	}: Props = $props();

	// The actual current date (today) - never changes with navigation
	const today = new Date();

	// Navigation state - which week range to show
	let viewCenterDate = $state(new Date());

	// Ref to scroll container for auto-scrolling to current week
	let scrollContainer: HTMLDivElement | undefined = $state();

	// Auto-scroll to current week on mount
	$effect(() => {
		if (scrollContainer) {
			tick().then(() => {
				const currentWeekEl = scrollContainer?.querySelector('[data-current-week="true"]');
				if (currentWeekEl) {
					currentWeekEl.scrollIntoView({ behavior: 'instant', block: 'start' });
				}
			});
		}
	});

	// Dialog state
	let addDialogOpen = $state(false);
	let editDialogOpen = $state(false);
	let selectedTask = $state<Task | null>(null);
	let addDefaultDate = $state<Date | undefined>(undefined);
	let addDefaultColumn = $state<'deadline' | 'finishBy' | 'todo' | undefined>(undefined);

	// Hover state for cross-column highlighting
	let hoveredTaskId = $state<string | null>(null);

	function handleHoverTask(id: string | null) {
		hoveredTaskId = id;
	}

	// Work order calculation: rank incomplete deadline tasks by deadline then priority
	const priorityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
	let workOrderMap = $derived(() => {
		const map = new Map<string, number>();

		// Get incomplete tasks with deadlines
		const deadlineTasks = tasks
			.filter((t) => t.status !== 'completed' && t.deadline)
			.sort((a, b) => {
				// Sort by deadline first
				const deadlineDiff = a.deadline!.getTime() - b.deadline!.getTime();
				if (deadlineDiff !== 0) return deadlineDiff;
				// Then by priority
				return priorityOrder[a.priority] - priorityOrder[b.priority];
			});

		// Assign work order numbers
		deadlineTasks.forEach((task, index) => {
			map.set(task.id, index + 1);
		});

		return map;
	});

	// Get weeks to display (centered around viewCenterDate)
	let weeks = $derived(getWeeksAroundCurrent(viewCenterDate));

	function navigateWeek(direction: -1 | 1) {
		const newDate = new Date(viewCenterDate);
		newDate.setDate(newDate.getDate() + direction * 7);
		viewCenterDate = newDate;
	}

	export function goToToday() {
		viewCenterDate = new Date();
	}

	function handleAddTask(date: Date, column: 'deadline' | 'finishBy' | 'todo') {
		addDefaultDate = date;
		addDefaultColumn = column;
		addDialogOpen = true;
	}

	function handleClickTask(task: Task) {
		selectedTask = task;
		editDialogOpen = true;
	}

	function handleCreateTask(task: NewTask) {
		onCreateTask?.(task);
	}

	function handleUpdateTask(id: string, updates: Partial<Task>) {
		onUpdateTask?.(id, updates);
	}

	function handleDeleteTask(id: string) {
		onDeleteTask?.(id);
	}
</script>

<div class="flex flex-col h-full">
	<!-- Header -->
	<div class="flex items-center px-2 py-1.5 border-b border-zinc-800 bg-zinc-900/50">
		<div class="flex items-center gap-1 w-[72px] shrink-0">
			<button
				class="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
				onclick={() => navigateWeek(-1)}
			>
				<ChevronLeft class="w-3.5 h-3.5" />
			</button>
			<button
				class="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
				onclick={() => navigateWeek(1)}
			>
				<ChevronRight class="w-3.5 h-3.5" />
			</button>
		</div>

		<!-- Column Headers -->
		<div class="flex-1 grid grid-cols-3">
			<span class="text-[11px] font-medium text-zinc-500 px-1">Deadline</span>
			<span class="text-[11px] font-medium text-zinc-500 px-1">Finish By</span>
			<span class="text-[11px] font-medium text-zinc-500 px-1">Todo</span>
		</div>
	</div>

	<!-- Week Rows -->
	<div class="flex-1 overflow-y-auto" bind:this={scrollContainer}>
		{#each weeks as week (week.getTime())}
			{@const isCurrentWeekRow = isCurrentWeek(week, today)}
			<div data-current-week={isCurrentWeekRow}>
			<WeekRow
				weekStart={week}
				{tasks}
				currentDate={today}
				onToggleTask={onToggleTask}
				onClickTask={handleClickTask}
				onAddTask={handleAddTask}
				{hoveredTaskId}
				onHoverTask={handleHoverTask}
				workOrderMap={workOrderMap()}
			/>
			</div>
		{/each}
	</div>
</div>

<!-- Dialogs -->
<AddTaskDialog
	bind:open={addDialogOpen}
	defaultDate={addDefaultDate}
	defaultColumn={addDefaultColumn}
	onSubmit={handleCreateTask}
/>

<EditTaskDialog
	bind:open={editDialogOpen}
	task={selectedTask}
	onSubmit={handleUpdateTask}
	onDelete={handleDeleteTask}
/>
