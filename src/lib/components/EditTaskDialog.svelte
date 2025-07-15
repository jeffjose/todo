<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
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
		console.log("EditTaskDialog: handleSubmit called");
		if (!title.trim() || !todo) {
			console.log("EditTaskDialog: Validation failed - title or todo missing");
			return;
		}
		
		isSubmitting = true;
		
		try {
			const updatedTodo: Partial<Todo> = {
				title: title.trim(),
				description: description.trim() || null,
				emoji: emoji || null,
				deadline: deadline ? new Date(deadline) : null,
				finishBy: finishBy ? new Date(finishBy) : null,
				todo: todoDate ? new Date(todoDate) : null,
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
			
			console.log("EditTaskDialog: Updating todo with id:", todo.id);
			console.log("EditTaskDialog: Update data:", updatedTodo);
			
			const result = await updateTodo(todo.id, updatedTodo);
			
			console.log("EditTaskDialog: Update successful, result:", result);
			
			onSuccess?.(result);
			open = false;
		} catch (error) {
			console.error("EditTaskDialog: Failed to update todo:", error);
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
	<Dialog.Content class="sm:max-w-[500px]" onkeydown={handleKeydown}>
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
			
			<div class="grid grid-cols-3 gap-4">
				<div class="grid gap-2">
					<Label for="edit-status">Status</Label>
					<select
						id="edit-status"
						bind:value={status}
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<option value="pending">Pending</option>
						<option value="in-progress">In Progress</option>
						<option value="completed">Completed</option>
						<option value="blocked">Blocked</option>
					</select>
				</div>
				
				<div class="grid gap-2">
					<Label for="edit-priority">Priority</Label>
					<select
						id="edit-priority"
						bind:value={priority}
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<option value="P0">P0</option>
						<option value="P1">P1</option>
						<option value="P2">P2</option>
						<option value="P3">P3</option>
					</select>
				</div>
				
				<div class="grid gap-2">
					<Label for="edit-urgency">Urgency</Label>
					<select
						id="edit-urgency"
						bind:value={urgency}
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					>
						<option value="high">High</option>
						<option value="medium">Medium</option>
						<option value="low">Low</option>
					</select>
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