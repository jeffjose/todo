<script lang="ts">
	import { Plus } from 'lucide-svelte';
	import type { WeekEvent } from '$lib/utils/taskLogic';
	
	interface Props {
		weekEvent: WeekEvent;
		taskType: 'deadline' | 'finishBy' | 'todo';
		onAddTask: (weekEvent: WeekEvent, taskType: 'deadline' | 'finishBy' | 'todo') => void;
	}
	
	let { weekEvent, taskType, onAddTask }: Props = $props();
	
	function handleClick() {
		onAddTask(weekEvent, taskType);
	}
</script>

<div class="group flex items-center justify-center h-6">
	<button
		class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded"
		on:click={handleClick}
		aria-label="Add {taskType} task"
		type="button"
	>
		<Plus class="w-3 h-3" />
	</button>
</div>