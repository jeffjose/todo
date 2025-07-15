<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import { Label } from "$lib/components/ui/label";
	import { Textarea } from "$lib/components/ui/textarea";
	import { createTodo, generateId } from "$lib/client/dexie";
	import type { Todo } from "$lib/client/dexie";
	
	interface Props {
		open?: boolean;
		onSuccess?: (todo: Todo) => void;
		initialDeadline?: string;
		initialFinishBy?: string;
		initialTodo?: string;
	}
	
	let { 
		open = $bindable(false), 
		onSuccess,
		initialDeadline = "",
		initialFinishBy = "",
		initialTodo = ""
	}: Props = $props();
	
	// Form state
	let title = $state("");
	let description = $state("");
	let emoji = $state("");
	let deadline = $state(initialDeadline);
	let finishBy = $state(initialFinishBy);
	let todo = $state(initialTodo);
	let status = $state("pending");
	let priority = $state("P2");
	let urgency = $state("medium");
	let tags = $state("");
	let urls = $state("");
	
	// Update dates when props change
	$effect(() => {
		if (open) {
			deadline = initialDeadline;
			finishBy = initialFinishBy;
			todo = initialTodo;
		}
	});
	
	let isSubmitting = $state(false);
	
	// Common emojis for quick selection
	const commonEmojis = ["📝", "💻", "🎯", "🚀", "📚", "🏃‍♂️", "🏠", "💼", "✈️", "🎨"];
	
	async function handleSubmit() {
		if (!title.trim()) return;
		
		isSubmitting = true;
		
		try {
			const newTodo: Partial<Todo> = {
				id: generateId(12),
				title: title.trim(),
				description: description.trim() || null,
				emoji: emoji || null,
				deadline: deadline ? new Date(deadline) : null,
				finishBy: finishBy ? new Date(finishBy) : null,
				todo: todo ? new Date(todo) : null,
				status,
				priority,
				urgency,
				tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
				attachments: [],
				urls: urls ? urls.split("\n").map(url => ({
					url: url.trim(),
					title: null,
					favicon: null
				})).filter(u => u.url) : [],
				comments: [],
				subtasks: [],
				path: "root",
				level: 0,
				parentId: null,
				completed: null,
				createdAt: new Date(),
				updatedAt: new Date()
			};
			
			const createdTodo = await createTodo(newTodo as Todo);
			
			onSuccess?.(createdTodo);
			resetForm();
			open = false;
		} catch (error) {
			console.error("Failed to create todo:", error);
		} finally {
			isSubmitting = false;
		}
	}
	
	function resetForm() {
		title = "";
		description = "";
		emoji = "";
		deadline = "";
		finishBy = "";
		todo = "";
		status = "pending";
		priority = "P2";
		urgency = "medium";
		tags = "";
		urls = "";
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter" && e.metaKey) {
			handleSubmit();
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[500px]" onkeydown={handleKeydown}>
		<Dialog.Header>
			<Dialog.Title>Add New Task</Dialog.Title>
			<Dialog.Description>
				Create a new task with deadline, finish by date, or todo date.
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="grid gap-4 py-4">
			<div class="grid gap-2">
				<Label for="title">Title *</Label>
				<Input
					id="title"
					bind:value={title}
					placeholder="Enter task title"
					required
				/>
			</div>
			
			<div class="grid gap-2">
				<Label for="description">Description</Label>
				<Textarea
					id="description"
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
					<Label for="deadline">Deadline</Label>
					<Input
						id="deadline"
						type="date"
						bind:value={deadline}
					/>
				</div>
				
				<div class="grid gap-2">
					<Label for="finishBy">Finish By</Label>
					<Input
						id="finishBy"
						type="date"
						bind:value={finishBy}
					/>
				</div>
				
				<div class="grid gap-2">
					<Label for="todo">Todo Date</Label>
					<Input
						id="todo"
						type="date"
						bind:value={todo}
					/>
				</div>
			</div>
			
			<div class="grid grid-cols-3 gap-4">
				<div class="grid gap-2">
					<Label for="status">Status</Label>
					<select
						id="status"
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
					<Label for="priority">Priority</Label>
					<select
						id="priority"
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
					<Label for="urgency">Urgency</Label>
					<select
						id="urgency"
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
				<Label for="tags">Tags (comma separated)</Label>
				<Input
					id="tags"
					bind:value={tags}
					placeholder="work, personal, urgent"
				/>
			</div>
			
			<div class="grid gap-2">
				<Label for="urls">URLs (one per line)</Label>
				<Textarea
					id="urls"
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
				{isSubmitting ? "Creating..." : "Create Task"}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>