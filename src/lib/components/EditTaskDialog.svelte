<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { Task, TaskPriority, TaskStatus } from '$lib/types';
	import { formatDateForInput, parseDateFromInput } from '$lib/utils/dates';
	import { Trash2 } from '@lucide/svelte';

	interface Props {
		open: boolean;
		task: Task | null;
		onOpenChange?: (open: boolean) => void;
		onSubmit?: (id: string, updates: Partial<Task>) => void;
		onDelete?: (id: string) => void;
	}

	let { open = $bindable(false), task, onOpenChange, onSubmit, onDelete }: Props = $props();

	// Form state
	let title = $state('');
	let priority = $state<TaskPriority>('P2');
	let status = $state<TaskStatus>('pending');
	let deadlineValue = $state('');
	let finishByValue = $state('');
	let todoValue = $state('');
	let description = $state('');

	// Reset form when dialog opens or task changes
	$effect(() => {
		if (open && task) {
			title = task.title;
			priority = task.priority;
			status = task.status;
			deadlineValue = formatDateForInput(task.deadline);
			finishByValue = formatDateForInput(task.finishBy);
			todoValue = formatDateForInput(task.todo);
			description = task.description || '';
		}
	});

	function handleSubmit() {
		if (!title.trim() || !task) return;

		const updates: Partial<Task> = {
			title: title.trim(),
			priority,
			status,
			deadline: parseDateFromInput(deadlineValue),
			finishBy: parseDateFromInput(finishByValue),
			todo: parseDateFromInput(todoValue),
			description: description.trim() || undefined,
			completed: status === 'completed' ? (task.completed || new Date()) : undefined
		};

		onSubmit?.(task.id, updates);
		open = false;
		onOpenChange?.(false);
	}

	function handleDelete() {
		if (!task) return;
		onDelete?.(task.id);
		open = false;
		onOpenChange?.(false);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey && e.target instanceof HTMLInputElement) {
			e.preventDefault();
			handleSubmit();
		}
	}

	const priorities: { value: TaskPriority; label: string }[] = [
		{ value: 'P0', label: 'P0 - Critical' },
		{ value: 'P1', label: 'P1 - High' },
		{ value: 'P2', label: 'P2 - Medium' },
		{ value: 'P3', label: 'P3 - Low' }
	];

	const statuses: { value: TaskStatus; label: string }[] = [
		{ value: 'pending', label: 'Pending' },
		{ value: 'in-progress', label: 'In Progress' },
		{ value: 'completed', label: 'Completed' },
		{ value: 'blocked', label: 'Blocked' }
	];
</script>

<Dialog.Root bind:open onOpenChange={(v) => onOpenChange?.(v)}>
	<Dialog.Content class="bg-zinc-900 border-zinc-800 text-zinc-100">
		<Dialog.Header>
			<Dialog.Title>Edit Task</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4">
			<!-- Title -->
			<div class="space-y-2">
				<Label for="edit-title" class="text-zinc-300">Title</Label>
				<Input
					id="edit-title"
					bind:value={title}
					placeholder="What needs to be done?"
					class="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
					onkeydown={handleKeyDown}
				/>
			</div>

			<!-- Priority and Status -->
			<div class="grid grid-cols-2 gap-3">
				<div class="space-y-2">
					<Label class="text-zinc-300">Priority</Label>
					<Select.Root type="single" bind:value={priority}>
						<Select.Trigger class="bg-zinc-800 border-zinc-700 text-zinc-100">
							{priorities.find((p) => p.value === priority)?.label || 'Select'}
						</Select.Trigger>
						<Select.Content class="bg-zinc-800 border-zinc-700">
							{#each priorities as p}
								<Select.Item value={p.value} class="text-zinc-100 focus:bg-zinc-700">
									{p.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div class="space-y-2">
					<Label class="text-zinc-300">Status</Label>
					<Select.Root type="single" bind:value={status}>
						<Select.Trigger class="bg-zinc-800 border-zinc-700 text-zinc-100">
							{statuses.find((s) => s.value === status)?.label || 'Select'}
						</Select.Trigger>
						<Select.Content class="bg-zinc-800 border-zinc-700">
							{#each statuses as s}
								<Select.Item value={s.value} class="text-zinc-100 focus:bg-zinc-700">
									{s.label}
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>

			<!-- Dates -->
			<div class="grid grid-cols-3 gap-3">
				<div class="space-y-2">
					<Label for="edit-deadline" class="text-zinc-300 text-xs">Deadline</Label>
					<Input
						id="edit-deadline"
						type="date"
						bind:value={deadlineValue}
						class="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm"
					/>
				</div>
				<div class="space-y-2">
					<Label for="edit-finishBy" class="text-zinc-300 text-xs">Finish By</Label>
					<Input
						id="edit-finishBy"
						type="date"
						bind:value={finishByValue}
						class="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm"
					/>
				</div>
				<div class="space-y-2">
					<Label for="edit-todo" class="text-zinc-300 text-xs">Todo</Label>
					<Input
						id="edit-todo"
						type="date"
						bind:value={todoValue}
						class="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm"
					/>
				</div>
			</div>

			<!-- Description -->
			<div class="space-y-2">
				<Label for="edit-description" class="text-zinc-300">Description</Label>
				<textarea
					id="edit-description"
					bind:value={description}
					placeholder="Add details..."
					rows="3"
					class="w-full rounded-md bg-zinc-800 border border-zinc-700 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-600"
				></textarea>
			</div>
		</div>

		<Dialog.Footer class="flex justify-between">
			<Button variant="ghost" onclick={handleDelete} class="text-red-400 hover:text-red-300 hover:bg-red-900/20">
				<Trash2 class="w-4 h-4 mr-2" />
				Delete
			</Button>
			<div class="flex gap-2">
				<Button variant="ghost" onclick={() => (open = false)} class="text-zinc-400 hover:text-zinc-100">
					Cancel
				</Button>
				<Button onclick={handleSubmit} disabled={!title.trim()} class="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
					Save
				</Button>
			</div>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
