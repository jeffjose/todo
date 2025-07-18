<script lang="ts">
	import { onMount } from 'svelte';
	import type { Todo } from '$lib/client/dexie';
	import { 
		getTaskStatus,
		formatDate,
		formatTodoDate
	} from '$lib/utils/taskLogic';
	import * as Table from '$lib/components/ui/table';
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

<div class="rounded-md border">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head class="w-[160px]">Week</Table.Head>
				<Table.Head>Deadline</Table.Head>
				<Table.Head>Finish By</Table.Head>
				<Table.Head>Todo</Table.Head>
				{#if weekEvents.some(week => week.isCurrent)}
					<Table.Head>Open Todos</Table.Head>
				{/if}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each weekEvents as week, i}
				{@const showMonth = i === 0 || week.weekStart.getDate() <= 7}
				{#if showMonth}
					<Table.Row class="hover:bg-transparent">
						<Table.Cell colspan={5} class="bg-muted/50 font-semibold text-sm">
							{week.weekStart.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
						</Table.Cell>
					</Table.Row>
				{/if}
				<Table.Row class={week.isCurrent ? 'bg-amber-50 dark:bg-amber-950/20' : ''}>
					<Table.Cell class="font-medium">
						<div class="text-sm tabular-nums">
							{week.weekStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })} – {week.weekEnd.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
						</div>
					</Table.Cell>
					<Table.Cell>
						{#each week.todos.deadline as todo}
							{@const status = getTaskStatus(todo, week.weekStart)}
							<div class="flex items-center gap-2 py-1">
								<span class="text-lg">{todo.emoji || '📋'}</span>
								<span class="flex-1 text-sm">{todo.title}</span>
								{#if status && status.type !== 'on-track'}
									<Badge
										variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
										class="text-xs"
									>
										{status.type}
									</Badge>
								{/if}
							</div>
						{/each}
					</Table.Cell>
					<Table.Cell>
						{#each week.todos.finishBy as todo}
							{@const status = getTaskStatus(todo, week.weekStart)}
							<div class="flex items-center gap-2 py-1">
								<span class="text-lg">{todo.emoji || '📋'}</span>
								<span class="flex-1 text-sm">{todo.title}</span>
								{#if status && status.type !== 'on-track'}
									<Badge
										variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
										class="text-xs"
									>
										{status.type}
									</Badge>
								{/if}
							</div>
						{/each}
					</Table.Cell>
					<Table.Cell>
						{#each week.todos.todo as todo}
							<div class="flex items-center gap-2 py-1">
								<span class="text-lg">{todo.emoji || '📋'}</span>
								<span class="flex-1 text-sm">{todo.title}</span>
								{#if todo.todo}
									<span class="text-xs text-muted-foreground">{formatTodoDate(todo.todo)}</span>
								{/if}
							</div>
						{/each}
					</Table.Cell>
					{#if week.isCurrent}
						<Table.Cell>
							{#each week.openTodos as todo}
								{@const status = getTaskStatus(todo, week.weekStart)}
								<div class="flex items-center gap-2 py-1">
									<span class="text-lg">{todo.emoji || '📋'}</span>
									<span class="flex-1 text-sm">{todo.title}</span>
									{#if status && status.type !== 'on-track'}
										<Badge
											variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
											class="text-xs"
										>
											{status.type}
										</Badge>
									{/if}
								</div>
							{/each}
						</Table.Cell>
					{:else if weekEvents.some(w => w.isCurrent)}
						<Table.Cell></Table.Cell>
					{/if}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>