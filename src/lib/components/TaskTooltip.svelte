<script lang="ts">
	import type { Todo } from '$lib/client/dexie';
	import { Badge } from '$lib/components/ui/badge';
	import { Calendar, Clock, Tag, Link } from 'lucide-svelte';
	
	interface Props {
		todo: Todo;
		show: boolean;
		x: number;
		y: number;
	}
	
	let { todo, show, x, y }: Props = $props();
	
	function formatDate(date: Date | null): string {
		if (!date) return '';
		return date.toLocaleDateString('en-US', { 
			month: 'short', 
			day: 'numeric', 
			year: 'numeric' 
		});
	}
	
	function getPriorityColor(priority: string): string {
		switch (priority) {
			case 'P0': return 'bg-red-500 text-white';
			case 'P1': return 'bg-orange-500 text-white';
			case 'P2': return 'bg-yellow-500 text-white';
			case 'P3': return 'bg-gray-500 text-white';
			default: return 'bg-gray-500 text-white';
		}
	}
	
	function getStatusIcon(status: string): string {
		switch (status) {
			case 'completed': return '✓';
			case 'in-progress': return '◉';
			case 'blocked': return '⊘';
			default: return '○';
		}
	}
</script>

{#if show}
	<div 
		class="fixed z-50 pointer-events-none animate-in fade-in-0 zoom-in-95"
		style="left: {x}px; top: {y}px; transform: translate(-50%, -100%) translateY(-10px);"
	>
		<div class="bg-popover text-popover-foreground rounded-lg shadow-2xl border border-border/50 p-4 min-w-[300px] max-w-[400px]">
			<!-- Header with Priority Badge and Status -->
			<div class="flex items-start justify-between gap-3 mb-3">
				<div class="flex-1">
					<div class="flex items-center gap-2 mb-1">
						<Badge 
							variant="default" 
							class="{getPriorityColor(todo.priority)} font-bold text-xs px-2 py-0.5"
						>
							{todo.priority}
						</Badge>
						<span class="text-xs text-muted-foreground">
							{getStatusIcon(todo.status)} {todo.status}
						</span>
					</div>
					<h3 class="font-semibold text-base leading-tight">
						{#if todo.emoji}<span class="mr-1">{todo.emoji}</span>{/if}{todo.title}
					</h3>
				</div>
			</div>
			
			{#if todo.description}
				<p class="text-sm text-muted-foreground mb-3 leading-relaxed">
					{todo.description}
				</p>
			{/if}
			
			<!-- Dates Section -->
			{#if todo.deadline || todo.finishBy || todo.todo}
				<div class="space-y-1.5 mb-3">
					{#if todo.deadline}
						<div class="flex items-center gap-2 text-xs">
							<Calendar class="w-3 h-3 text-red-500" />
							<span class="text-muted-foreground">Deadline:</span>
							<span class="font-medium">{formatDate(todo.deadline)}</span>
						</div>
					{/if}
					{#if todo.finishBy}
						<div class="flex items-center gap-2 text-xs">
							<Clock class="w-3 h-3 text-yellow-500" />
							<span class="text-muted-foreground">Finish By:</span>
							<span class="font-medium">{formatDate(todo.finishBy)}</span>
						</div>
					{/if}
					{#if todo.todo}
						<div class="flex items-center gap-2 text-xs">
							<Calendar class="w-3 h-3 text-blue-500" />
							<span class="text-muted-foreground">Todo:</span>
							<span class="font-medium">{formatDate(todo.todo)}</span>
						</div>
					{/if}
				</div>
			{/if}
			
			<!-- Tags -->
			{#if todo.tags && todo.tags.length > 0}
				<div class="flex items-center gap-2 mb-3">
					<Tag class="w-3 h-3 text-muted-foreground" />
					<div class="flex flex-wrap gap-1">
						{#each todo.tags as tag}
							<Badge variant="secondary" class="text-xs py-0 px-1.5">
								{tag}
							</Badge>
						{/each}
					</div>
				</div>
			{/if}
			
			<!-- URLs -->
			{#if todo.urls && todo.urls.length > 0}
				<div class="space-y-1 mb-3">
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<Link class="w-3 h-3" />
						<span>Links:</span>
					</div>
					{#each todo.urls.slice(0, 2) as url}
						<div class="text-xs text-blue-500 truncate pl-5">
							{url.url}
						</div>
					{/each}
					{#if todo.urls.length > 2}
						<div class="text-xs text-muted-foreground pl-5">
							+{todo.urls.length - 2} more
						</div>
					{/if}
				</div>
			{/if}
			
			<!-- Footer -->
			<div class="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
				<span>ID: <code class="font-mono text-[10px]">{todo.id}</code></span>
				<span>Urgency: <span class="font-medium capitalize">{todo.urgency}</span></span>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes animate-in {
		from {
			opacity: 0;
			transform: translate(-50%, -100%) translateY(-10px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translate(-50%, -100%) translateY(-10px) scale(1);
		}
	}
	
	.animate-in {
		animation: animate-in 150ms ease-out;
	}
</style>