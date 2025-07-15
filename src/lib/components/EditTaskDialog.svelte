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
			<Dialog.Description>
				Update task details including dates, status, and priority.
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="edit-title">Title *</Label>
				<Input
					id="edit-title"
					bind:value={title}
					placeholder="Enter task title"
					required
				/>
			</div>
			
			<div class="grid gap-2">
				<Label for="edit-description">Description</Label>
				<Textarea
					id="edit-description"
					bind:value={description}
					placeholder="Enter task description"
					rows={3}
				/>
			</div>
			
			<div class="grid gap-2">
				<Label>Emoji</Label>
				<div class="flex gap-2 items-center">
					<Input
						bind:value={emoji}
						placeholder="📝"
						class="w-20"
						maxlength={2}
					/>
					<div class="flex gap-1">
						{#each commonEmojis as e}
							<button
								type="button"
								class="w-8 h-8 flex items-center justify-center rounded hover:bg-accent"
								onclick={() => emoji = e}
							>
								{e}
							</button>
						{/each}
					</div>
				</div>
			</div>
			
			<div class="grid grid-cols-3 gap-4">
				<div class="grid gap-2">
					<Label for="edit-deadline">Deadline</Label>
					<Input
						id="edit-deadline"
						type="date"
						bind:value={deadline}
					/>
				</div>
				
				<div class="grid gap-2">
					<Label for="edit-finishBy">Finish By</Label>
					<Input
						id="edit-finishBy"
						type="date"
						bind:value={finishBy}
					/>
				</div>
				
				<div class="grid gap-2">
					<Label for="edit-todo">Todo Date</Label>
					<Input
						id="edit-todo"
						type="date"
						bind:value={todoDate}
					/>
				</div>
			</div>
			
			<div class="space-y-4">
				<div class="grid gap-2">
					<Label>Status</Label>
					<ToggleGroup.Root type="single" bind:value={status} class="grid grid-cols-4 gap-2">
						<ToggleGroup.Item value="pending" class="data-[state=on]:bg-blue-500 data-[state=on]:text-white">
							Pending
						</ToggleGroup.Item>
						<ToggleGroup.Item value="in-progress" class="data-[state=on]:bg-yellow-500 data-[state=on]:text-white">
							In Progress
						</ToggleGroup.Item>
						<ToggleGroup.Item value="completed" class="data-[state=on]:bg-green-500 data-[state=on]:text-white">
							Completed
						</ToggleGroup.Item>
						<ToggleGroup.Item value="blocked" class="data-[state=on]:bg-red-500 data-[state=on]:text-white">
							Blocked
						</ToggleGroup.Item>
					</ToggleGroup.Root>
				</div>
				
				<div class="grid gap-2">
					<Label>Priority</Label>
					<ToggleGroup.Root type="single" bind:value={priority} class="grid grid-cols-4 gap-2">
						<ToggleGroup.Item value="P0" class="data-[state=on]:bg-red-600 data-[state=on]:text-white">
							P0
						</ToggleGroup.Item>
						<ToggleGroup.Item value="P1" class="data-[state=on]:bg-orange-500 data-[state=on]:text-white">
							P1
						</ToggleGroup.Item>
						<ToggleGroup.Item value="P2" class="data-[state=on]:bg-yellow-500 data-[state=on]:text-white">
							P2
						</ToggleGroup.Item>
						<ToggleGroup.Item value="P3" class="data-[state=on]:bg-gray-500 data-[state=on]:text-white">
							P3
						</ToggleGroup.Item>
					</ToggleGroup.Root>
				</div>
				
				<div class="grid gap-2">
					<Label>Urgency</Label>
					<ToggleGroup.Root type="single" bind:value={urgency} class="grid grid-cols-3 gap-2">
						<ToggleGroup.Item value="high" class="data-[state=on]:bg-red-500 data-[state=on]:text-white">
							High
						</ToggleGroup.Item>
						<ToggleGroup.Item value="medium" class="data-[state=on]:bg-yellow-500 data-[state=on]:text-white">
							Medium
						</ToggleGroup.Item>
						<ToggleGroup.Item value="low" class="data-[state=on]:bg-green-500 data-[state=on]:text-white">
							Low
						</ToggleGroup.Item>
					</ToggleGroup.Root>
				</div>
			</div>
			
			<div class="grid gap-2">
				<Label for="edit-tags">Tags (comma separated)</Label>
				<Input
					id="edit-tags"
					bind:value={tags}
					placeholder="work, personal, urgent"
				/>
			</div>
			
			<div class="grid gap-2">
				<Label for="edit-urls">URLs (one per line)</Label>
				<Textarea
					id="edit-urls"
					bind:value={urls}
					placeholder="https://example.com"
					rows={2}
				/>
			</div>
		</div>
		
		<Dialog.Footer>
			<Button variant="outline" onclick={() => open = false}>
				Cancel
			</Button>
			<Button 
				onclick={handleSubmit} 
				disabled={isSubmitting || !title.trim()}
			>
				{isSubmitting ? "Updating..." : "Update Task"}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
{/if}