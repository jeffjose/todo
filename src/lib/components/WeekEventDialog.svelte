<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import type { WeekEvent } from '$lib/types';
	import { formatWeekRange } from '$lib/utils/dates';

	interface Props {
		open: boolean;
		weekStart: Date;
		event?: WeekEvent | null; // If editing existing event
		onSubmit: (data: Omit<WeekEvent, 'id'>) => void;
		onDelete?: (id: string) => void;
	}

	let { open = $bindable(), weekStart, event = null, onSubmit, onDelete }: Props = $props();

	let title = $state('');
	let color = $state('blue');

	const colors = [
		{ name: 'blue', class: 'bg-blue-500' },
		{ name: 'green', class: 'bg-green-500' },
		{ name: 'amber', class: 'bg-amber-500' },
		{ name: 'red', class: 'bg-red-500' },
		{ name: 'purple', class: 'bg-purple-500' },
		{ name: 'pink', class: 'bg-pink-500' }
	];

	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			if (event) {
				title = event.title;
				color = event.color || 'blue';
			} else {
				title = '';
				color = 'blue';
			}
		}
	});

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;

		onSubmit({
			weekStart,
			title: title.trim(),
			color
		});

		open = false;
	}

	function handleDelete() {
		if (event && onDelete) {
			onDelete(event.id);
			open = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[400px] bg-zinc-900 border-zinc-800">
		<Dialog.Header>
			<Dialog.Title class="text-zinc-100">
				{event ? 'Edit Event' : 'Add Event'}
			</Dialog.Title>
			<Dialog.Description class="text-zinc-400">
				{formatWeekRange(weekStart)}
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit} class="space-y-4">
			<div class="space-y-2">
				<Label for="title" class="text-zinc-300">Event Title</Label>
				<Input
					id="title"
					bind:value={title}
					placeholder="Sprint Review, Release, Holiday..."
					class="bg-zinc-800 border-zinc-700 text-zinc-100"
				/>
			</div>

			<div class="space-y-2">
				<Label class="text-zinc-300">Color</Label>
				<div class="flex gap-2">
					{#each colors as c}
						<button
							type="button"
							class="w-6 h-6 rounded-full {c.class} {color === c.name ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : 'opacity-50 hover:opacity-100'} transition-opacity"
							onclick={() => (color = c.name)}
							title={c.name}
						></button>
					{/each}
				</div>
			</div>

			<div class="flex justify-between pt-2">
				{#if event && onDelete}
					<Button type="button" variant="destructive" size="sm" onclick={handleDelete}>
						Delete
					</Button>
				{:else}
					<div></div>
				{/if}
				<div class="flex gap-2">
					<Button type="button" variant="outline" onclick={() => (open = false)}>
						Cancel
					</Button>
					<Button type="submit" disabled={!title.trim()}>
						{event ? 'Save' : 'Add'}
					</Button>
				</div>
			</div>
		</form>
	</Dialog.Content>
</Dialog.Root>
