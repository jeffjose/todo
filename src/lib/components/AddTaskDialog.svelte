<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import type { NewTask, TaskPriority } from '$lib/types';
	import { formatDateForInput, parseDateFromInput } from '$lib/utils/dates';

	interface Props {
		open: boolean;
		onOpenChange?: (open: boolean) => void;
		onSubmit?: (task: NewTask) => void;
		defaultDate?: Date;
		defaultColumn?: 'deadline' | 'finishBy' | 'todo';
	}

	let { open = $bindable(false), onOpenChange, onSubmit, defaultDate, defaultColumn }: Props = $props();

	// Form state
	let title = $state('');
	let priority = $state<TaskPriority>('P2');
	let deadlineValue = $state('');
	let finishByValue = $state('');
	let todoValue = $state('');

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			title = '';
			priority = 'P2';
			deadlineValue = '';
			finishByValue = '';
			todoValue = '';

			// Set default date based on column
			if (defaultDate) {
				const dateStr = formatDateForInput(defaultDate);
				if (defaultColumn === 'deadline') {
					deadlineValue = dateStr;
				} else if (defaultColumn === 'finishBy') {
					finishByValue = dateStr;
				} else if (defaultColumn === 'todo') {
					todoValue = dateStr;
				}
			}
		}
	});

	function handleSubmit() {
		if (!title.trim()) return;

		const task: NewTask = {
			title: title.trim(),
			status: 'pending',
			priority,
			deadline: parseDateFromInput(deadlineValue),
			finishBy: parseDateFromInput(finishByValue),
			todo: parseDateFromInput(todoValue),
			tags: []
		};

		onSubmit?.(task);
		open = false;
		onOpenChange?.(false);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
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
</script>

<Dialog.Root bind:open onOpenChange={(v) => onOpenChange?.(v)}>
	<Dialog.Content class="bg-zinc-900 border-zinc-800 text-zinc-100">
		<Dialog.Header>
			<Dialog.Title>Add Task</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4">
			<!-- Title -->
			<div class="space-y-2">
				<Label for="title" class="text-zinc-300">Title</Label>
				<Input
					id="title"
					bind:value={title}
					placeholder="What needs to be done?"
					class="bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
					onkeydown={handleKeyDown}
				/>
			</div>

			<!-- Priority -->
			<div class="space-y-2">
				<Label class="text-zinc-300">Priority</Label>
				<Select.Root type="single" bind:value={priority}>
					<Select.Trigger class="bg-zinc-800 border-zinc-700 text-zinc-100">
						{priorities.find((p) => p.value === priority)?.label || 'Select priority'}
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

			<!-- Dates -->
			<div class="grid grid-cols-3 gap-3">
				<div class="space-y-2">
					<Label for="deadline" class="text-zinc-300 text-xs">Deadline</Label>
					<Input
						id="deadline"
						type="date"
						bind:value={deadlineValue}
						class="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm"
					/>
				</div>
				<div class="space-y-2">
					<Label for="finishBy" class="text-zinc-300 text-xs">Finish By</Label>
					<Input
						id="finishBy"
						type="date"
						bind:value={finishByValue}
						class="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm"
					/>
				</div>
				<div class="space-y-2">
					<Label for="todo" class="text-zinc-300 text-xs">Todo</Label>
					<Input
						id="todo"
						type="date"
						bind:value={todoValue}
						class="bg-zinc-800 border-zinc-700 text-zinc-100 text-sm"
					/>
				</div>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="ghost" onclick={() => (open = false)} class="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
				Cancel
			</Button>
			<Button onclick={handleSubmit} disabled={!title.trim()} class="bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
				Add Task
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
