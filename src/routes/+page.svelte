<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, CalendarDays, FlaskConical } from '@lucide/svelte';
	import WeeklyView from '$lib/components/WeeklyView.svelte';
	import AddTaskDialog from '$lib/components/AddTaskDialog.svelte';
	import type { Task, NewTask, TaskStatus } from '$lib/types';
	import { getAllTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from '$lib/db/tasks';
	import { generateDemoData } from '$lib/db/demoData';
	import { nanoid } from 'nanoid';

	let tasks = $state<Task[]>([]);
	let addDialogOpen = $state(false);
	let weeklyView: WeeklyView;

	// Demo mode state
	let isDemoMode = $state(false);
	let realTasks = $state<Task[]>([]); // Backup of real tasks when in demo mode

	onMount(async () => {
		tasks = await getAllTasks();
	});

	async function handleCreateTask(data: NewTask) {
		if (isDemoMode) {
			// Create task in memory only
			const now = new Date();
			const id = nanoid(10);
			const parentTask = data.parentId ? tasks.find(t => t.id === data.parentId) : null;
			const path = parentTask ? `${parentTask.path}.${id}` : id;
			const level = parentTask ? parentTask.level + 1 : 0;

			const newTask: Task = {
				id,
				title: data.title,
				emoji: data.emoji,
				deadline: data.deadline,
				finishBy: data.finishBy,
				todo: data.todo,
				status: data.status,
				priority: data.priority,
				parentId: data.parentId,
				path,
				level,
				description: data.description,
				tags: data.tags || [],
				completed: data.completed,
				createdAt: now,
				updatedAt: now
			};
			tasks = [...tasks, newTask];
		} else {
			const task = await createTask(data);
			tasks = [...tasks, task];
		}
	}

	async function handleUpdateTask(id: string, updates: Partial<Task>) {
		if (isDemoMode) {
			// Update in memory only
			tasks = tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t));
		} else {
			await updateTask(id, updates);
			tasks = tasks.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t));
		}
	}

	async function handleDeleteTask(id: string) {
		if (isDemoMode) {
			// Delete from memory (including children)
			const task = tasks.find(t => t.id === id);
			if (task) {
				tasks = tasks.filter((t) => t.id !== id && !t.path.startsWith(task.path + '.'));
			}
		} else {
			await deleteTask(id);
			tasks = tasks.filter((t) => t.id !== id);
		}
	}

	async function handleToggleTask(id: string) {
		const task = tasks.find((t) => t.id === id);
		if (!task) return;

		const now = new Date();
		const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
		const completed = newStatus === 'completed' ? now : undefined;

		if (isDemoMode) {
			// Toggle in memory only
			tasks = tasks.map((t) =>
				t.id === id
					? { ...t, status: newStatus, completed, updatedAt: now }
					: t
			);
		} else {
			await toggleTaskStatus(id);
			tasks = tasks.map((t) =>
				t.id === id
					? { ...t, status: newStatus, completed, updatedAt: now }
					: t
			);
		}
	}

	function enterDemoMode() {
		// Backup real tasks
		realTasks = [...tasks];
		// Load demo data
		tasks = generateDemoData();
		isDemoMode = true;
	}

	function exitDemoMode() {
		// Restore real tasks
		tasks = [...realTasks];
		realTasks = [];
		isDemoMode = false;
	}

	function handleGoToToday() {
		weeklyView?.goToToday();
	}
</script>

<!-- Header Toolbar -->
<header class="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-3 shrink-0">
	<h1 class="text-sm font-medium text-zinc-100">Todo</h1>
	{#if isDemoMode}
		<span class="ml-2 text-[10px] text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">demo</span>
	{/if}

	<div class="flex-1"></div>

	<div class="flex items-center gap-1">
		<!-- Demo Mode Toggle -->
		<button
			class="w-7 h-7 flex items-center justify-center rounded-md transition-colors {isDemoMode ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30' : 'text-zinc-500 hover:bg-zinc-800 hover:text-amber-400'}"
			onclick={isDemoMode ? exitDemoMode : enterDemoMode}
			title={isDemoMode ? "Exit demo mode" : "Enter demo mode (try features without affecting your data)"}
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
