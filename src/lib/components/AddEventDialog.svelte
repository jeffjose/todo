<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import type { WeekEvent } from "$lib/utils/taskLogic";
	
	interface Props {
		open?: boolean;
		weekEvent: WeekEvent | null;
		onSuccess?: (event: any) => void;
	}
	
	let { open = $bindable(false), weekEvent = null, onSuccess }: Props = $props();
	
	let description = $state("");
	let isSubmitting = $state(false);
	
	// Reset form when dialog opens
	$effect(() => {
		if (open) {
			description = "";
		}
	});
	
	async function handleSubmit() {
		if (!description.trim() || !weekEvent) return;
		
		isSubmitting = true;
		
		try {
			// Import the database functions
			const { getDB, generateId } = await import("$lib/client/dexie");
			const db = await getDB();
			
			const newEvent = {
				id: generateId(12),
				startDate: weekEvent.startDate,
				endDate: weekEvent.endDate,
				description: description.trim(),
				createdAt: new Date(),
				updatedAt: new Date()
			};
			
			await db.knownEvents.add(newEvent);
			
			onSuccess?.(newEvent);
			open = false;
		} catch (error) {
			console.error("Failed to create event:", error);
		} finally {
			isSubmitting = false;
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && e.metaKey) {
			handleSubmit();
		}
	}
	
	function formatDateRange(weekEvent: WeekEvent | null): string {
		if (!weekEvent) return "";
		
		const options: Intl.DateTimeFormatOptions = { 
			month: 'short', 
			day: 'numeric',
			year: 'numeric'
		};
		
		if (weekEvent.isDay) {
			return weekEvent.startDate.toLocaleDateString('en-US', options);
		}
		
		const start = weekEvent.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		const end = weekEvent.endDate.toLocaleDateString('en-US', options);
		return `${start} - ${end}`;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]" onkeydown={handleKeydown}>
		<Dialog.Header>
			<Dialog.Title>Add Event</Dialog.Title>
			<Dialog.Description>
				Add an event for {formatDateRange(weekEvent)}
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="description">Event Description *</Label>
				<Textarea
					id="description"
					bind:value={description}
					placeholder="Enter event description (e.g., Team offsite, Holiday, Sprint planning)"
					rows={3}
					required
				/>
			</div>
		</div>
		
		<Dialog.Footer>
			<Button variant="outline" onclick={() => open = false}>
				Cancel
			</Button>
			<Button 
				onclick={handleSubmit} 
				disabled={isSubmitting || !description.trim()}
			>
				{isSubmitting ? "Adding..." : "Add Event"}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>