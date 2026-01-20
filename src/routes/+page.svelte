<script lang="ts">
	import { onMount } from 'svelte';
	import { Plus, CalendarDays, FlaskConical, Download, Upload, Keyboard } from '@lucide/svelte';
	import WeeklyView from '$lib/components/WeeklyView.svelte';
	import AddTaskDialog from '$lib/components/AddTaskDialog.svelte';
	import ImportDialog from '$lib/components/ImportDialog.svelte';
	import KeyboardShortcutsDialog from '$lib/components/KeyboardShortcutsDialog.svelte';
	import Toast, { showToast } from '$lib/components/Toast.svelte';
	import type { Task, NewTask, TaskStatus, WeekEvent } from '$lib/types';
	import { getAllTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from '$lib/db/tasks';
	import { getAllWeekEvents, createWeekEvent, updateWeekEvent, deleteWeekEvent } from '$lib/db/weekEvents';
	import { downloadExport, importFromJSON, type ImportMode } from '$lib/db/exportImport';
	import { generateDemoData } from '$lib/db/demoData';
	import { nanoid } from 'nanoid';
	import { getWeekStart } from '$lib/utils/dates';

	let tasks = $state<Task[]>([]);
	let weekEvents = $state<WeekEvent[]>([]);
	let addDialogOpen = $state(false);
	let importDialogOpen = $state(false);
	let shortcutsDialogOpen = $state(false);
	let weeklyView: WeeklyView;

	// Demo mode state
	let isDemoMode = $state(false);
	let realTasks = $state<Task[]>([]); // Backup of real tasks when in demo mode
	let realWeekEvents = $state<WeekEvent[]>([]); // Backup of real events when in demo mode

	onMount(() => {
		// Load data
		getAllTasks().then((t) => (tasks = t));
		getAllWeekEvents().then((e) => (weekEvents = e));

		// Keyboard shortcuts
		function handleKeydown(e: KeyboardEvent) {
			// Ignore if typing in an input
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
				return;
			}

			// Ignore if a dialog is open (except for Escape)
			const anyDialogOpen = addDialogOpen || importDialogOpen || shortcutsDialogOpen;
			if (anyDialogOpen && e.key !== 'Escape') {
				return;
			}

			switch (e.key) {
				case 'n':
					e.preventDefault();
					addDialogOpen = true;
					break;
				case 't':
					e.preventDefault();
					handleGoToToday();
					break;
				case 'd':
					e.preventDefault();
					if (isDemoMode) {
						exitDemoMode();
					} else {
						enterDemoMode();
					}
					break;
				case 'e':
					if (!isDemoMode) {
						e.preventDefault();
						handleExport();
					}
					break;
				case 'i':
					if (!isDemoMode) {
						e.preventDefault();
						importDialogOpen = true;
					}
					break;
				case '?':
					e.preventDefault();
					shortcutsDialogOpen = true;
					break;
			}
		}

		window.addEventListener('keydown', handleKeydown);
		return () => window.removeEventListener('keydown', handleKeydown);
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

	// Week event handlers
	async function handleCreateEvent(data: Omit<WeekEvent, 'id'>) {
		if (isDemoMode) {
			const newEvent: WeekEvent = {
				id: nanoid(10),
				weekStart: getWeekStart(data.weekStart),
				title: data.title,
				color: data.color
			};
			weekEvents = [...weekEvents, newEvent];
		} else {
			const event = await createWeekEvent(data);
			weekEvents = [...weekEvents, event];
		}
	}

	async function handleUpdateEvent(id: string, updates: Partial<WeekEvent>) {
		if (isDemoMode) {
			weekEvents = weekEvents.map((e) => (e.id === id ? { ...e, ...updates } : e));
		} else {
			await updateWeekEvent(id, updates);
			weekEvents = weekEvents.map((e) => (e.id === id ? { ...e, ...updates } : e));
		}
	}

	async function handleDeleteEvent(id: string) {
		if (isDemoMode) {
			weekEvents = weekEvents.filter((e) => e.id !== id);
		} else {
			await deleteWeekEvent(id);
			weekEvents = weekEvents.filter((e) => e.id !== id);
		}
	}

	function enterDemoMode() {
		// Backup real data
		realTasks = [...tasks];
		realWeekEvents = [...weekEvents];
		// Load demo data
		tasks = generateDemoData();
		weekEvents = generateDemoEvents();
		isDemoMode = true;
	}

	function exitDemoMode() {
		// Restore real data
		tasks = [...realTasks];
		weekEvents = [...realWeekEvents];
		realTasks = [];
		realWeekEvents = [];
		isDemoMode = false;
	}

	// Generate demo events for demo mode
	function generateDemoEvents(): WeekEvent[] {
		const now = new Date();
		const currentWeek = getWeekStart(now);
		const nextWeek = new Date(currentWeek);
		nextWeek.setDate(nextWeek.getDate() + 7);
		const weekAfter = new Date(currentWeek);
		weekAfter.setDate(weekAfter.getDate() + 14);

		return [
			{ id: nanoid(10), weekStart: currentWeek, title: 'Sprint Review', color: 'blue' },
			{ id: nanoid(10), weekStart: currentWeek, title: 'Q1 Launch', color: 'red' },
			{ id: nanoid(10), weekStart: nextWeek, title: 'Design Review', color: 'purple' },
			{ id: nanoid(10), weekStart: weekAfter, title: 'Team Offsite', color: 'green' }
		];
	}

	function handleGoToToday() {
		weeklyView?.goToToday();
	}

	// Export/Import handlers
	async function handleExport() {
		await downloadExport();
		showToast('Data exported successfully', 'success');
	}

	async function handleImport(jsonString: string, mode: ImportMode) {
		const result = await importFromJSON(jsonString, mode);
		if (result.success) {
			// Reload data
			tasks = await getAllTasks();
			weekEvents = await getAllWeekEvents();
			showToast(`Imported ${result.imported.tasks} tasks and ${result.imported.weekEvents} events`, 'success');
		} else {
			showToast('Import failed: ' + result.errors[0], 'error');
		}
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
		<!-- Export Button -->
		{#if !isDemoMode}
			<button
				class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
				onclick={handleExport}
				title="Export data as JSON"
			>
				<Download class="w-4 h-4" />
			</button>

			<!-- Import Button -->
			<button
				class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
				onclick={() => (importDialogOpen = true)}
				title="Import data from JSON"
			>
				<Upload class="w-4 h-4" />
			</button>

			<div class="w-px h-4 bg-zinc-700 mx-1"></div>
		{/if}

		<!-- Demo Mode Toggle -->
		<button
			class="w-7 h-7 flex items-center justify-center rounded-md transition-colors {isDemoMode ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30' : 'text-zinc-500 hover:bg-zinc-800 hover:text-amber-400'}"
			onclick={isDemoMode ? exitDemoMode : enterDemoMode}
			title={isDemoMode ? "Exit demo mode" : "Enter demo mode (try features without affecting your data)"}
		>
			<FlaskConical class="w-4 h-4" />
		</button>

		<!-- Keyboard Shortcuts Button -->
		<button
			class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
			onclick={() => (shortcutsDialogOpen = true)}
			title="Keyboard shortcuts (?)"
		>
			<Keyboard class="w-4 h-4" />
		</button>

		<div class="w-px h-4 bg-zinc-700 mx-1"></div>

		<!-- Today Button -->
		<button
			class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
			onclick={handleGoToToday}
			title="Go to today (t)"
		>
			<CalendarDays class="w-4 h-4" />
		</button>

		<!-- Add Task Button -->
		<button
			class="w-7 h-7 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
			onclick={() => (addDialogOpen = true)}
			title="Add task (n)"
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
		{weekEvents}
		onCreateTask={handleCreateTask}
		onUpdateTask={handleUpdateTask}
		onDeleteTask={handleDeleteTask}
		onToggleTask={handleToggleTask}
		onCreateEvent={handleCreateEvent}
		onUpdateEvent={handleUpdateEvent}
		onDeleteEvent={handleDeleteEvent}
	/>
</main>

<!-- Global Add Dialog (from header button) -->
<AddTaskDialog bind:open={addDialogOpen} onSubmit={handleCreateTask} />

<!-- Import Dialog -->
<ImportDialog bind:open={importDialogOpen} onImport={handleImport} />

<!-- Keyboard Shortcuts Dialog -->
<KeyboardShortcutsDialog bind:open={shortcutsDialogOpen} />

<!-- Toast notifications -->
<Toast />
