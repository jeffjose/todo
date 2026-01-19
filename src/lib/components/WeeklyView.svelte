<script lang="ts">
	import type { Task, NewTask } from '$lib/types';
	import WeekRow from './WeekRow.svelte';
	import AddTaskDialog from './AddTaskDialog.svelte';
	import EditTaskDialog from './EditTaskDialog.svelte';
	import { getWeeksAroundCurrent, isCurrentWeek } from '$lib/utils/dates';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

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

	// Dialog state
	let addDialogOpen = $state(false);
	let editDialogOpen = $state(false);
	let selectedTask = $state<Task | null>(null);
	let addDefaultDate = $state<Date | undefined>(undefined);
	let addDefaultColumn = $state<'deadline' | 'finishBy' | 'todo' | undefined>(undefined);

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
	<div class="flex items-center px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
		<div class="flex items-center gap-2 w-[100px] shrink-0">
			<button
				class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
				onclick={() => navigateWeek(-1)}
			>
				<ChevronLeft class="w-4 h-4" />
			</button>
			<button
				class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
				onclick={() => navigateWeek(1)}
			>
				<ChevronRight class="w-4 h-4" />
			</button>
		</div>

		<!-- Column Headers -->
		<div class="flex-1 grid grid-cols-3">
			<span class="text-xs font-medium text-zinc-500 px-2">Deadline</span>
			<span class="text-xs font-medium text-zinc-500 px-2">Finish By</span>
			<span class="text-xs font-medium text-zinc-500 px-2">Todo</span>
		</div>
	</div>

	<!-- Week Rows -->
	<div class="flex-1 overflow-y-auto">
		{#each weeks as week (week.getTime())}
			<WeekRow
				weekStart={week}
				{tasks}
				currentDate={today}
				onToggleTask={onToggleTask}
				onClickTask={handleClickTask}
				onAddTask={handleAddTask}
			/>
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
