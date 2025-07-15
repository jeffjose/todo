<script lang="ts">
	import { Pencil, Trash2 } from 'lucide-svelte';
	import type { Todo } from '$lib/client/db/dexie';
	import type { WeekEvent } from '$lib/utils/taskLogic';
	import {
		getTaskStatus,
		getStatusBadgeClass,
		getPriorityBadgeClass,
		getTaskColor,
		isCurrentWeek
	} from '$lib/utils/taskLogic';
	
	interface Props {
		todo: Todo;
		weekEvent: WeekEvent;
		hoveredTaskId: string | null;
		onTaskHover: (id: string | null) => void;
		onToggleStatus: (todo: Todo, e: Event) => void;
		onCyclePriority: (todo: Todo, e: Event) => void;
		onEditTask: (todo: Todo, e: Event) => void;
		onDeleteTask: (todo: Todo, e: Event) => void;
	}
	
	let { 
		todo, 
		weekEvent, 
		hoveredTaskId, 
		onTaskHover, 
		onToggleStatus, 
		onCyclePriority,
		onEditTask,
		onDeleteTask
	}: Props = $props();
</script>

<div
	class="task-hover-target task-hover-highlight group flex items-center justify-between rounded px-1.5 py-0.5"
	class:task-highlight={hoveredTaskId === todo.id}
	on:mouseenter={() => onTaskHover(todo.id)}
	on:mouseleave={() => onTaskHover(null)}
	title="ID: {todo.id}"
>
	<div
		class="flex items-center gap-1 flex-1"
		class:text-gray-400={todo.status === 'completed'}
	>
		<span
			class="cursor-pointer text-xs leading-snug {todo.status === 'completed'
				? 'text-gray-400 line-through'
				: ''}"
			style="padding-left: {todo.level * 0.75}rem; color: {getTaskColor(todo)}"
			on:click={(e) => onToggleStatus(todo, e)}
		>
			{#if todo.emoji}<span class="mr-1">{todo.emoji}</span>{/if}{todo.title}
		</span>
		<span
			class="cursor-pointer rounded px-1 py-0.5 text-xs font-medium {getPriorityBadgeClass(
				todo.priority,
				todo.status === 'completed'
			)}"
			on:click={(e) => onCyclePriority(todo, e)}
		>
			{todo.priority}
		</span>
		{#if isCurrentWeek(weekEvent) || weekEvent.endDate < new Date()}
			{@const status = getTaskStatus(todo, weekEvent.startDate)}
			{#if status}
				<span
					class="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium {getStatusBadgeClass(
						status,
						todo.status === 'completed'
					)} {todo.status === 'completed' ? 'line-through' : ''}"
					on:click={(e) => onToggleStatus(todo, e)}
					on:mouseenter={() => onTaskHover(todo.id)}
					on:mouseleave={() => onTaskHover(null)}
				>
					{#if status.type === 'overdue'}
						overdue ({status.daysOverdue}d)
					{:else}
						{status.type}
					{/if}
				</span>
			{/if}
		{/if}
	</div>
	<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
		<button
			class="p-1 hover:bg-gray-200 rounded"
			on:click={(e) => onEditTask(todo, e)}
			aria-label="Edit task"
			type="button"
		>
			<Pencil class="w-3 h-3" />
		</button>
		<button
			class="p-1 hover:bg-red-100 hover:text-red-600 rounded"
			on:click={(e) => onDeleteTask(todo, e)}
			aria-label="Delete task"
			type="button"
		>
			<Trash2 class="w-3 h-3" />
		</button>
	</div>
</div>