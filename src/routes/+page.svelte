<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, CalendarDays, FlaskConical, TestTube } from '@lucide/svelte';
	import WeeklyView from '$lib/components/WeeklyView.svelte';
	import AddTaskDialog from '$lib/components/AddTaskDialog.svelte';
	import type { Task, NewTask } from '$lib/types';
	import { getAllTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from '$lib/db/tasks';
	import { generateTestData, generateDescriptiveTestData } from '$lib/db/testData';

	let tasks = $state<Task[]>([]);
	let addDialogOpen = $state(false);
	let weeklyView: WeeklyView;

	onMount(async () => {
		tasks = await getAllTasks();
	});

	async function handleCreateTask(data: NewTask) {
		const task = await createTask(data);
		tasks = [...tasks, task];
	}

	async function handleUpdateTask(id: string, updates: Partial<Task>) {
		await updateTask(id, updates);
		tasks = tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t));
	}

	async function handleDeleteTask(id: string) {
		await deleteTask(id);
		tasks = tasks.filter((t) => t.id !== id);
	}

	async function handleToggleTask(id: string) {
		await toggleTaskStatus(id);
		const task = tasks.find((t) => t.id === id);
		if (task) {
			const now = new Date();
			const newStatus = task.status === 'completed' ? 'pending' : 'completed';
			tasks = tasks.map((t) =>
				t.id === id
					? {
							...t,
							status: newStatus,
							completed: newStatus === 'completed' ? now : undefined,
							updatedAt: now
						}
					: t
			);
		}
	}

	async function handleGenerateTestData() {
		await generateTestData(15);
		tasks = await getAllTasks();
	}

	async function handleGenerateDescriptiveTestData() {
		await generateDescriptiveTestData();
		tasks = await getAllTasks();
	}

	function handleGoToToday() {
		weeklyView?.goToToday();
	}
</script>

<!-- Header Toolbar -->
<header class="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-3 shrink-0">
	<h1 class="text-sm font-medium text-zinc-100">Todo</h1>

	<div class="flex-1"></div>

	<div class="flex items-center gap-1">
		<!-- Descriptive Test Data Button -->
		<button
			class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
			onclick={handleGenerateDescriptiveTestData}
			title="Generate descriptive test data (debug)"
		>
			<TestTube class="w-4 h-4" />
		</button>

		<!-- Random Test Data Button -->
		<button
			class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
			onclick={handleGenerateTestData}
			title="Generate random test data"
		>
			<FlaskConical class="w-4 h-4" />
		</button>

		<!-- Today Button -->
		<button
			class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
			onclick={handleGoToToday}
			title="Go to today"
		>
			<CalendarDays class="w-4 h-4" />
		</button>

		<!-- Add Task Button -->
		<button
			class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
			onclick={() => (addDialogOpen = true)}
			title="Add task"
		>
			<Plus class="w-4 h-4" />
		</button>
	</div>
</header>

<!-- Main Content -->
<main class="flex-1 overflow-hidden">
	<WeeklyView
		bind:this={weeklyView}
		{tasks}
		onCreateTask={handleCreateTask}
		onUpdateTask={handleUpdateTask}
		onDeleteTask={handleDeleteTask}
		onToggleTask={handleToggleTask}
	/>
</main>

<!-- Global Add Dialog (from header button) -->
<AddTaskDialog bind:open={addDialogOpen} onSubmit={handleCreateTask} />
