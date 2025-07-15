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
	import * as Tooltip from '$lib/components/ui/tooltip';
	
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
</script>

<Tooltip.Root>
	<Tooltip.Trigger class="w-full">
		<div
			class="task-hover-target task-hover-highlight group flex items-center justify-between rounded px-1.5 py-0.5 hover:bg-accent/50"
			class:task-highlight={hoveredTaskId === todo.id}
			onmouseenter={() => onTaskHover(todo.id)}
			onmouseleave={() => onTaskHover(null)}
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
	</Tooltip.Trigger>
	<Tooltip.Content class="max-w-sm">
		<div class="space-y-2 text-sm">
			<div class="font-semibold text-base">
				{#if todo.emoji}{todo.emoji} {/if}{todo.title}
			</div>
			
			{#if todo.description}
				<div class="text-muted-foreground">
					{todo.description}
				</div>
			{/if}
			
			<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
				<div><span class="text-muted-foreground">Status:</span> <span class="capitalize">{todo.status}</span></div>
				<div><span class="text-muted-foreground">Priority:</span> {todo.priority}</div>
				<div><span class="text-muted-foreground">Urgency:</span> <span class="capitalize">{todo.urgency}</span></div>
				<div><span class="text-muted-foreground">ID:</span> <span class="font-mono">{todo.id}</span></div>
			</div>
			
			{#if todo.deadline || todo.finishBy || todo.todo}
				<div class="space-y-1 text-xs">
					{#if todo.deadline}
						<div><span class="text-muted-foreground">Deadline:</span> {formatDate(todo.deadline)}</div>
					{/if}
					{#if todo.finishBy}
						<div><span class="text-muted-foreground">Finish By:</span> {formatDate(todo.finishBy)}</div>
					{/if}
					{#if todo.todo}
						<div><span class="text-muted-foreground">Todo Date:</span> {formatDate(todo.todo)}</div>
					{/if}
				</div>
			{/if}
			
			{#if todo.tags && todo.tags.length > 0}
				<div class="text-xs">
					<span class="text-muted-foreground">Tags:</span>
					<div class="flex flex-wrap gap-1 mt-1">
						{#each todo.tags as tag}
							<Badge variant="outline" class="text-xs py-0">{tag}</Badge>
						{/each}
					</div>
				</div>
			{/if}
			
			{#if todo.urls && todo.urls.length > 0}
				<div class="text-xs">
					<span class="text-muted-foreground">URLs:</span>
					<div class="space-y-1 mt-1">
						{#each todo.urls as url}
							<div class="truncate text-blue-500">{url.url}</div>
						{/each}
					</div>
				</div>
			{/if}
			
			<div class="text-xs text-muted-foreground pt-1 border-t">
				Created: {formatDate(todo.createdAt)}
				{#if todo.completed}
					<br>Completed: {formatDate(todo.completed)}
				{/if}
			</div>
		</div>
	</Tooltip.Content>
</Tooltip.Root>