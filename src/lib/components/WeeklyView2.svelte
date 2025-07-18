<script lang="ts">
	import { onMount } from 'svelte';
	import type { Todo } from '$lib/client/dexie';
	import { 
		getTaskStatus,
		formatDate,
		formatTodoDate
	} from '$lib/utils/taskLogic';
	import { Badge } from '$lib/components/ui/badge';

	interface WeekEvent {
		id: string;
		weekStart: Date;
		weekEnd: Date;
		isCurrent: boolean;
		todos: {
			deadline: Todo[];
			finishBy: Todo[];
			todo: Todo[];
		};
		openTodos: Todo[];
	}

	const { todos = [] } = $props<{
		todos: Todo[];
		onTodosChange?: () => Promise<void>;
	}>();

	let weekEvents = $state<WeekEvent[]>([]);
	let viewStartDate = $state<Date | null>(null);
	let viewEndDate = $state<Date | null>(null);

	// Generate week events based on todos
	$effect(() => {
		if (!viewStartDate || !viewEndDate) return;
		
		const newWeekEvents: WeekEvent[] = [];
		const currentWeek = new Date();
		currentWeek.setHours(0, 0, 0, 0);
		
		// Generate 12 weeks of data (past 4, current, future 7)
		for (let weekOffset = -4; weekOffset <= 7; weekOffset++) {
			const weekStart = new Date(currentWeek);
			weekStart.setDate(currentWeek.getDate() - currentWeek.getDay() + weekOffset * 7);
			
			const weekEnd = new Date(weekStart);
			weekEnd.setDate(weekStart.getDate() + 6);
			
			const isCurrent = weekOffset === 0;
			
			// Get todos for each column type
			const deadlineTodos = todos.filter((todo: Todo) => {
				if (todo.status === 'completed' || !todo.deadline) return false;
				const deadline = new Date(todo.deadline);
				return deadline >= weekStart && deadline <= weekEnd;
			});
			
			const finishByTodos = todos.filter((todo: Todo) => {
				if (!todo.finishBy) return false;
				const finishBy = new Date(todo.finishBy);
				
				// For current week, include all slipped tasks
				if (isCurrent && todo.status !== 'completed' && finishBy < weekStart) {
					return true;
				}
				
				// For non-current weeks, show completed tasks
				if (!isCurrent && todo.status === 'completed' && todo.completed) {
					const completed = new Date(todo.completed);
					return completed >= weekStart && completed <= weekEnd;
				}
				
				// Regular case: show tasks in their original week
				return finishBy >= weekStart && finishBy <= weekEnd;
			});
			
			const todoTodos = todos.filter((todo: Todo) => {
				if (!todo.todo) return false;
				const todoDate = new Date(todo.todo);
				return todoDate >= weekStart && todoDate <= weekEnd;
			});
			
			const openTodos = isCurrent ? todos.filter((todo: Todo) => {
				return todo.status !== 'completed' && todo.todo && new Date(todo.todo) <= weekEnd;
			}) : [];
			
			newWeekEvents.push({
				id: `week-${weekOffset}`,
				weekStart,
				weekEnd,
				isCurrent,
				todos: {
					deadline: deadlineTodos,
					finishBy: finishByTodos,
					todo: todoTodos
				},
				openTodos
			});
		}
		
		weekEvents = newWeekEvents;
	});

	onMount(() => {
		const today = new Date();
		const currentWeekStart = new Date(today);
		currentWeekStart.setDate(today.getDate() - today.getDay());
		currentWeekStart.setHours(0, 0, 0, 0);
		
		viewStartDate = new Date(currentWeekStart);
		viewStartDate.setDate(viewStartDate.getDate() - 28); // 4 weeks before
		
		viewEndDate = new Date(currentWeekStart);
		viewEndDate.setDate(viewEndDate.getDate() + 48); // 7 weeks after
	});
</script>

<div class="w-full overflow-x-auto rounded-lg border bg-background">
	<div class="min-w-[900px]">
		<!-- Header -->
		<div class="grid grid-cols-[180px_1fr_1fr_1fr_1fr] gap-6 border-b bg-muted/30 px-6 py-4">
			<div class="text-sm font-semibold text-muted-foreground">Week</div>
			<div class="text-sm font-semibold text-muted-foreground">Deadline</div>
			<div class="text-sm font-semibold text-muted-foreground">Finish By</div>
			<div class="text-sm font-semibold text-muted-foreground">Todo</div>
			{#if weekEvents.some(week => week.isCurrent)}
				<div class="text-sm font-semibold text-muted-foreground">Open Todos</div>
			{/if}
		</div>

		<!-- Body -->
		<div class="divide-y">
			{#each weekEvents as week, i}
				{@const showMonth = i === 0 || week.weekStart.getDate() <= 7}
				
				{#if showMonth}
					<!-- Month separator -->
					<div class="bg-muted/10 px-6 py-3 text-sm font-semibold text-muted-foreground">
						{week.weekStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
					</div>
				{/if}
				
				<!-- Week row -->
				<div class={`grid grid-cols-[180px_1fr_1fr_1fr_1fr] gap-6 px-6 py-4 transition-colors hover:bg-muted/5 ${week.isCurrent ? 'bg-amber-50 dark:bg-amber-950/10 hover:bg-amber-50 dark:hover:bg-amber-950/10' : ''}`}>
					<!-- Week dates -->
					<div class="font-medium">
						<div class="text-sm tabular-nums">
							{week.weekStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} – {week.weekEnd.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
						</div>
					</div>
					
					<!-- Deadline column -->
					<div class="space-y-2">
						{#each week.todos.deadline as todo}
							{@const status = getTaskStatus(todo, week.weekStart)}
							<div class="flex items-start gap-2 group">
								<span class="text-base leading-tight mt-0.5">{todo.emoji || '📋'}</span>
								<div class="flex-1 min-w-0">
									<p class="text-sm leading-tight truncate group-hover:text-clip group-hover:whitespace-normal">{todo.title}</p>
								</div>
								{#if status && status.type !== 'on-track'}
									<Badge
										variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
										class="text-xs shrink-0"
									>
										{status.type}
									</Badge>
								{/if}
							</div>
						{/each}
					</div>
					
					<!-- Finish By column -->
					<div class="space-y-2">
						{#each week.todos.finishBy as todo}
							{@const status = getTaskStatus(todo, week.weekStart)}
							<div class="flex items-start gap-2 group">
								<span class="text-base leading-tight mt-0.5">{todo.emoji || '📋'}</span>
								<div class="flex-1 min-w-0">
									<p class="text-sm leading-tight truncate group-hover:text-clip group-hover:whitespace-normal">{todo.title}</p>
								</div>
								{#if status && status.type !== 'on-track'}
									<Badge
										variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
										class="text-xs shrink-0"
									>
										{status.type}
									</Badge>
								{/if}
							</div>
						{/each}
					</div>
					
					<!-- Todo column -->
					<div class="space-y-2">
						{#each week.todos.todo as todo}
							<div class="flex items-start gap-2 group">
								<span class="text-base leading-tight mt-0.5">{todo.emoji || '📋'}</span>
								<div class="flex-1 min-w-0">
									<p class="text-sm leading-tight truncate group-hover:text-clip group-hover:whitespace-normal">{todo.title}</p>
								</div>
								{#if todo.todo}
									<span class="text-xs text-muted-foreground shrink-0">{formatTodoDate(todo.todo)}</span>
								{/if}
							</div>
						{/each}
					</div>
					
					<!-- Open Todos column -->
					{#if week.isCurrent}
						<div class="space-y-2">
							{#each week.openTodos as todo}
								{@const status = getTaskStatus(todo, week.weekStart)}
								<div class="flex items-start gap-2 group">
									<span class="text-base leading-tight mt-0.5">{todo.emoji || '📋'}</span>
									<div class="flex-1 min-w-0">
										<p class="text-sm leading-tight truncate group-hover:text-clip group-hover:whitespace-normal">{todo.title}</p>
									</div>
									{#if status && status.type !== 'on-track'}
										<Badge
											variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
											class="text-xs shrink-0"
										>
											{status.type}
										</Badge>
									{/if}
								</div>
							{/each}
						</div>
					{:else if weekEvents.some(w => w.isCurrent)}
						<div></div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>