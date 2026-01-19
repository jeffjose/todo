<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus } from '@lucide/svelte';
	import WeeklyView from '$lib/components/WeeklyView.svelte';
	import AddTaskDialog from '$lib/components/AddTaskDialog.svelte';
	import type { Task, NewTask } from '$lib/types';
	import { getAllTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from '$lib/db/tasks';

	let tasks = $state<Task[]>([]);
	let addDialogOpen = $state(false);

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
</script>

<!-- Header Toolbar -->
<header class="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-3 shrink-0">
	<h1 class="text-sm font-medium text-zinc-100">Todo</h1>

	<div class="flex-1"></div>

	<button
		class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
		onclick={() => (addDialogOpen = true)}
	>
		<Plus class="w-4 h-4" />
	</button>
</header>

<!-- Main Content -->
<main class="flex-1 overflow-hidden">
	<WeeklyView
		{tasks}
		onCreateTask={handleCreateTask}
		onUpdateTask={handleUpdateTask}
		onDeleteTask={handleDeleteTask}
		onToggleTask={handleToggleTask}
	/>
</main>

<!-- Global Add Dialog (from header button) -->
<AddTaskDialog bind:open={addDialogOpen} onSubmit={handleCreateTask} />
