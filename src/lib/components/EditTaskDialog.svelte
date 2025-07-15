<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import * as ToggleGroup from "$lib/components/ui/toggle-group";
	import { updateTodo, type Todo } from "$lib/client/dexie";
	
	interface Props {
		open?: boolean;
		todo: Todo | null;
		onSuccess?: (todo: Todo) => void;
	}
	
	let { open = $bindable(false), todo = null, onSuccess }: Props = $props();
	
	// Form state - reactive to todo changes
	let title = $state("");
	let description = $state("");
	let emoji = $state("");
	let deadline = $state("");
	let finishBy = $state("");
	let todoDate = $state("");
	let status = $state("pending");
	let priority = $state("P2");
	let urgency = $state("medium");
	let tags = $state("");
	let urls = $state("");
	
	let isSubmitting = $state(false);
	
	// Common emojis for quick selection
	const commonEmojis = ["📝", "💻", "🎯", "🚀", "📚", "🏃‍♂️", "🏠", "💼", "✈️", "🎨"];
	
	// Update form when todo changes
	$effect(() => {
		if (todo && open) {
			title = todo.title || "";
			description = todo.description || "";
			emoji = todo.emoji || "";
			deadline = todo.deadline ? formatDateForInput(todo.deadline) : "";
			finishBy = todo.finishBy ? formatDateForInput(todo.finishBy) : "";
			todoDate = todo.todo ? formatDateForInput(todo.todo) : "";
			status = todo.status || "pending";
			priority = todo.priority || "P2";
			urgency = todo.urgency || "medium";
			tags = todo.tags ? todo.tags.join(", ") : "";
			urls = todo.urls ? todo.urls.map(u => u.url).join("\n") : "";
		}
	});
	
	function formatDateForInput(date: Date): string {
		const d = new Date(date);
		const year = d.getFullYear();
		const month = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
	
	async function handleSubmit() {
		if (!title.trim() || !todo) {
			return;
		}
		
		isSubmitting = true;
		
		try {
			// Parse dates as local dates, not UTC
			const parseLocalDate = (dateStr: string): Date | null => {
				if (!dateStr) return null;
				// Parse as YYYY-MM-DD and create date in local timezone
				const [year, month, day] = dateStr.split('-').map(Number);
				return new Date(year, month - 1, day);
			};
			
			const updatedTodo: Partial<Todo> = {
				title: title.trim(),
				description: description.trim() || null,
				emoji: emoji || null,
				deadline: parseLocalDate(deadline),
				finishBy: parseLocalDate(finishBy),
				todo: parseLocalDate(todoDate),
				status,
				priority,
				urgency,
				tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
				urls: urls ? urls.split("\n").map(url => ({
					url: url.trim(),
					title: null,
					favicon: null
				})).filter(u => u.url) : [],
				updatedAt: new Date()
			};
			
			const result = await updateTodo(todo.id, updatedTodo);
			
			onSuccess?.(result);
			open = false;
		} catch (error) {
			console.error("Failed to update todo:", error);
		} finally {
			isSubmitting = false;
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && e.metaKey) {
			handleSubmit();
		}
	}
</script>

{#if todo}
<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[600px]" onkeydown={handleKeydown}>
		<Dialog.Header>
			<Dialog.Title>Edit Task</Dialog.Title>
		</Dialog.Header>
		
		<div class="grid gap-2 py-2">
			<div class="grid gap-1">
				<Label for="edit-title" class="text-xs">Title *</Label>
				<Input
					id="edit-title"
					bind:value={title}
					placeholder="Enter task title"
					required
					class="h-8 text-sm"
				/>
			</div>
			
			<div class="grid gap-1">
				<Label for="edit-description" class="text-xs">Description</Label>
				<Textarea
					id="edit-description"
					bind:value={description}
					placeholder="Enter task description"
					rows={2}
					class="text-sm min-h-[3rem]"
				/>
			</div>
			
			<div class="grid gap-1">
				<Label class="text-xs">Emoji</Label>
				<div class="flex gap-1 items-center">
					<Input
						bind:value={emoji}
						placeholder="📝"
						class="w-16 h-7 text-sm"
						maxlength={2}
					/>
					<div class="flex gap-0.5">
						{#each commonEmojis as e}
							<button
								type="button"
								class="w-6 h-6 text-xs flex items-center justify-center rounded hover:bg-accent"
								onclick={() => emoji = e}
							>
								{e}
							</button>
						{/each}
					</div>
				</div>
			</div>
			
			<div class="grid grid-cols-3 gap-2">
				<div class="grid gap-1">
					<Label for="edit-deadline" class="text-xs">Deadline</Label>
					<Input
						id="edit-deadline"
						type="date"
						bind:value={deadline}
						class="h-7 text-xs"
					/>
				</div>
				
				<div class="grid gap-1">
					<Label for="edit-finishBy" class="text-xs">Finish By</Label>
					<Input
						id="edit-finishBy"
						type="date"
						bind:value={finishBy}
						class="h-7 text-xs"
					/>
				</div>
				
				<div class="grid gap-1">
					<Label for="edit-todo" class="text-xs">Todo Date</Label>
					<Input
						id="edit-todo"
						type="date"
						bind:value={todoDate}
						class="h-7 text-xs"
					/>
				</div>
			</div>
			
			<div class="space-y-2">
				<div class="grid gap-1">
					<Label class="text-xs">Status</Label>
					<ToggleGroup.Root type="single" bind:value={status} class="grid grid-cols-4 gap-1">
						<ToggleGroup.Item value="pending" class="h-7 text-xs data-[state=on]:bg-blue-500 data-[state=on]:text-white">
							Pending
						</ToggleGroup.Item>
						<ToggleGroup.Item value="in-progress" class="h-7 text-xs data-[state=on]:bg-yellow-500 data-[state=on]:text-white">
							Progress
						</ToggleGroup.Item>
						<ToggleGroup.Item value="completed" class="h-7 text-xs data-[state=on]:bg-green-500 data-[state=on]:text-white">
							Done
						</ToggleGroup.Item>
						<ToggleGroup.Item value="blocked" class="h-7 text-xs data-[state=on]:bg-red-500 data-[state=on]:text-white">
							Blocked
						</ToggleGroup.Item>
					</ToggleGroup.Root>
				</div>
				
				<div class="grid grid-cols-2 gap-2">
					<div class="grid gap-1">
						<Label class="text-xs">Priority</Label>
						<ToggleGroup.Root type="single" bind:value={priority} class="grid grid-cols-4 gap-1">
							<ToggleGroup.Item value="P0" class="h-7 text-xs data-[state=on]:bg-red-600 data-[state=on]:text-white">
								P0
							</ToggleGroup.Item>
							<ToggleGroup.Item value="P1" class="h-7 text-xs data-[state=on]:bg-orange-500 data-[state=on]:text-white">
								P1
							</ToggleGroup.Item>
							<ToggleGroup.Item value="P2" class="h-7 text-xs data-[state=on]:bg-yellow-500 data-[state=on]:text-white">
								P2
							</ToggleGroup.Item>
							<ToggleGroup.Item value="P3" class="h-7 text-xs data-[state=on]:bg-gray-500 data-[state=on]:text-white">
								P3
							</ToggleGroup.Item>
						</ToggleGroup.Root>
					</div>
					
					<div class="grid gap-1">
						<Label class="text-xs">Urgency</Label>
						<ToggleGroup.Root type="single" bind:value={urgency} class="grid grid-cols-3 gap-1">
							<ToggleGroup.Item value="high" class="h-7 text-xs data-[state=on]:bg-red-500 data-[state=on]:text-white">
								High
							</ToggleGroup.Item>
							<ToggleGroup.Item value="medium" class="h-7 text-xs data-[state=on]:bg-yellow-500 data-[state=on]:text-white">
								Med
							</ToggleGroup.Item>
							<ToggleGroup.Item value="low" class="h-7 text-xs data-[state=on]:bg-green-500 data-[state=on]:text-white">
								Low
							</ToggleGroup.Item>
						</ToggleGroup.Root>
					</div>
				</div>
			</div>
			
			<div class="grid gap-1">
				<Label for="edit-tags" class="text-xs">Tags (comma separated)</Label>
				<Input
					id="edit-tags"
					bind:value={tags}
					placeholder="work, personal, urgent"
					class="h-7 text-xs"
				/>
			</div>
			
			<div class="grid gap-1">
				<Label for="edit-urls" class="text-xs">URLs (one per line)</Label>
				<Textarea
					id="edit-urls"
					bind:value={urls}
					placeholder="https://example.com"
					rows={1}
					class="text-xs min-h-[2rem]"
				/>
			</div>
		</div>
		
		<Dialog.Footer>
			<Button variant="outline" onclick={() => open = false} size="sm">
				Cancel
			</Button>
			<Button 
				onclick={handleSubmit} 
				disabled={isSubmitting || !title.trim()}
				size="sm"
			>
				{isSubmitting ? "Updating..." : "Update"}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
{/if}