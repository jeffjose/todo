<script lang="ts">
	import { Pencil, Trash2 } from 'lucide-svelte';
	import type { Todo } from '$lib/client/dexie';
	import type { WeekEvent } from '$lib/utils/taskLogic';
	import {
		getTaskStatus,
		getStatusBadgeClass,
		getPriorityBadgeClass,
		getTaskColor,
		isCurrentWeek
	} from '$lib/utils/taskLogic';
	import { Badge } from '$lib/components/ui/badge';
	
	interface Props {
		todo: Todo;
		weekEvent: WeekEvent;
		hoveredTaskId: string | null;
		workOrder?: number;
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
		workOrder,
		onTaskHover, 
		onToggleStatus, 
		onCyclePriority,
		onEditTask,
		onDeleteTask
	}: Props = $props();
	
	function formatDate(date: Date | null): string {
		if (!date) return '';
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric' 
		});
	}
	
	function getTooltipText(): string {
		let parts = [`ID: ${todo.id}`];
		
		if (todo.description) {
			parts.push(`Description: ${todo.description}`);
		}
		
		parts.push(`Status: ${todo.status}`);
		parts.push(`Priority: ${todo.priority}`);
		parts.push(`Urgency: ${todo.urgency}`);
		
		if (todo.deadline) {
			parts.push(`Deadline: ${formatDate(todo.deadline)}`);
		}
		if (todo.finishBy) {
			parts.push(`Finish By: ${formatDate(todo.finishBy)}`);
		}
		if (todo.todo) {
			parts.push(`Todo: ${formatDate(todo.todo)}`);
		}
		
		if (todo.tags && todo.tags.length > 0) {
			parts.push(`Tags: ${todo.tags.join(', ')}`);
		}
		
		parts.push(`Created: ${formatDate(todo.createdAt)}`);
		if (todo.completed) {
			parts.push(`Completed: ${formatDate(todo.completed)}`);
		}
		
		return parts.join('\n');
	}
</script>

<div
	class="task-hover-target task-hover-highlight group flex items-center justify-between rounded px-1.5 py-0.5 hover:bg-accent/50"
	class:task-highlight={hoveredTaskId === todo.id}
	onmouseenter={() => onTaskHover(todo.id)}
	onmouseleave={() => onTaskHover(null)}
	title={getTooltipText()}
>
	<div
		class="flex items-center gap-1 flex-1"
		class:text-gray-400={todo.status === 'completed'}
	>
		{#if workOrder && todo.status !== 'completed'}
			<Badge variant="default" class="h-5 w-5 rounded-full p-0 flex items-center justify-center">
				{workOrder}
			</Badge>
		{/if}
		<span
			class="cursor-pointer text-xs leading-snug font-semibold {todo.status === 'completed'
				? 'text-muted-foreground/60 line-through'
				: ''}"
			style="padding-left: {todo.level * 0.75}rem"
			onclick={(e) => onToggleStatus(todo, e)}
		>
			{#if todo.emoji}<span class="mr-1">{todo.emoji}</span>{/if}{todo.title}
		</span>
		<Badge 
			variant={todo.priority === 'P0' ? 'destructive' : todo.priority === 'P1' ? 'secondary' : 'outline'} 
			class="cursor-pointer h-5 text-xs {todo.status === 'completed' ? 'opacity-50' : ''}"
			onclick={(e) => onCyclePriority(todo, e)}
		>
			{todo.priority}
		</Badge>
		{#if isCurrentWeek(weekEvent) || weekEvent.endDate < new Date()}
			{@const status = getTaskStatus(todo, weekEvent.startDate)}
			{#if status}
				<Badge 
					variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
					class="cursor-pointer text-xs {todo.status === 'completed' ? 'opacity-50 line-through' : ''}"
					onclick={(e) => onToggleStatus(todo, e)}
					onmouseenter={() => onTaskHover(todo.id)}
					onmouseleave={() => onTaskHover(null)}
				>
					{#if status.type === 'overdue'}
						overdue ({status.daysOverdue}d)
					{:else}
						{status.type}
					{/if}
				</Badge>
			{/if}
		{/if}
	</div>
	<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
		<button
			class="p-1 hover:bg-accent rounded"
			onclick={(e) => onEditTask(todo, e)}
			aria-label="Edit task"
			type="button"
		>
			<Pencil class="w-3 h-3" />
		</button>
		<button
			class="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
			onclick={(e) => onDeleteTask(todo, e)}
			aria-label="Delete task"
			type="button"
		>
			<Trash2 class="w-3 h-3" />
		</button>
	</div>
</div>