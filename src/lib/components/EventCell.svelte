<script lang="ts">
	import { Plus, X } from 'lucide-svelte';
	import type { WeekEvent } from '$lib/utils/taskLogic';
	import { Badge } from '$lib/components/ui/badge';
	
	interface Props {
		weekEvent: WeekEvent;
		event: any | null;
		onAddEvent: (weekEvent: WeekEvent) => void;
		onDeleteEvent?: (eventId: string) => void;
	}
	
	let { weekEvent, event, onAddEvent, onDeleteEvent }: Props = $props();
	
	function handleAddClick() {
		onAddEvent(weekEvent);
	}
	
	function handleDeleteClick(e: Event) {
		e.stopPropagation();
		if (event && onDeleteEvent) {
			onDeleteEvent(event.id);
		}
	}
</script>

<div class="relative group">
	{#if event}
		<div class="flex items-center gap-1">
			<Badge variant="secondary" class="text-xs">
				{event.description}
			</Badge>
			{#if onDeleteEvent}
				<button
					class="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/10 hover:text-destructive rounded"
					on:click={handleDeleteClick}
					aria-label="Delete event"
					type="button"
				>
					<X class="w-3 h-3" />
				</button>
			{/if}
		</div>
	{:else}
		<div class="flex items-center justify-center h-6">
			<button
				class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
				on:click={handleAddClick}
				aria-label="Add event"
				type="button"
			>
				<Plus class="w-3 h-3" />
			</button>
		</div>
	{/if}
</div>