<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import type { Todo } from "$lib/client/dexie";
	
	interface Props {
		open?: boolean;
		todo: Todo | null;
		onConfirm: () => void;
		onCancel: () => void;
	}
	
	let { open = $bindable(false), todo, onConfirm, onCancel }: Props = $props();
	
	function handleCancel() {
		open = false;
		onCancel();
	}
	
	function handleConfirm() {
		onConfirm();
		open = false;
	}
</script>

{#if todo}
<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Delete Task</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this task? This action cannot be undone.
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="py-4">
			<p class="text-sm text-muted-foreground">
				Task: <strong>{todo.emoji || ''} {todo.title}</strong>
			</p>
			{#if todo.description}
				<p class="text-sm text-muted-foreground mt-2">
					{todo.description}
				</p>
			{/if}
		</div>
		
		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancel}>
				Cancel
			</Button>
			<Button 
				variant="destructive"
				onclick={handleConfirm}
			>
				Delete Task
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
{/if}