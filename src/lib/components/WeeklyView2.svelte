<script lang="ts">
	import { onMount } from 'svelte';
	import type { Todo } from '$lib/client/dexie';
	import { 
		getTaskStatus,
		getStatusBadgeClass,
		getPriorityBadgeClass,
		formatDate,
		formatTodoDate,
		isCurrentWeek,
		getMonthYear,
		shouldShowMonthHeader,
		type WeekEvent
	} from '$lib/utils/taskLogic';
	import { getTodosForWeek, getOpenTodosUpToCurrentWeek } from '$lib/utils/taskFilters';
	import * as Table from '$lib/components/ui/table';
	import { Badge } from '$lib/components/ui/badge';

	const { todos = [], onTodosChange } = $props<{
		todos: Todo[];
		onTodosChange: () => Promise<void>;
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
			
			const weekTodos = getTodosForWeek(todos, weekStart, weekEnd, isCurrentWeek(weekStart));
			const openTodos = weekOffset === 0 ? getOpenTodosUpToCurrentWeek(todos, weekStart) : [];
			
			newWeekEvents.push({
				id: `week-${weekOffset}`,
				weekStart,
				weekEnd,
				isCurrent: weekOffset === 0,
				todos: weekTodos,
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

<div class="weekly-view-container">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Week</Table.Head>
				<Table.Head>Deadline</Table.Head>
				<Table.Head>Finish By</Table.Head>
				<Table.Head>Todo</Table.Head>
				{#if weekEvents.some(week => week.isCurrent)}
					<Table.Head>Open Todos</Table.Head>
				{/if}
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each weekEvents as week}
				{@const showMonth = shouldShowMonthHeader(week, weekEvents)}
				{#if showMonth}
					<Table.Row class="month-separator">
						<Table.Cell colspan={5}>
							<div class="month-header">{getMonthYear(week.weekStart)}</div>
						</Table.Cell>
					</Table.Row>
				{/if}
				<Table.Row class={week.isCurrent ? 'current-week' : ''}>
					<Table.Cell class="font-medium">
						<div class="week-dates">
							{formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
						</div>
					</Table.Cell>
					<Table.Cell>
						{#each week.todos.deadline as todo}
							<div class="task-item">
								<span class="task-emoji">{todo.emoji || '📋'}</span>
								<span class="task-title">{todo.title}</span>
								<Badge variant={getTaskStatus(todo) === 'overdue' ? 'destructive' : getTaskStatus(todo) === 'slipped' ? 'secondary' : 'default'}>
									{getTaskStatus(todo)}
								</Badge>
							</div>
						{/each}
					</Table.Cell>
					<Table.Cell>
						{#each week.todos.finishBy as todo}
							<div class="task-item">
								<span class="task-emoji">{todo.emoji || '📋'}</span>
								<span class="task-title">{todo.title}</span>
								<Badge variant={getTaskStatus(todo) === 'overdue' ? 'destructive' : getTaskStatus(todo) === 'slipped' ? 'secondary' : 'default'}>
									{getTaskStatus(todo)}
								</Badge>
							</div>
						{/each}
					</Table.Cell>
					<Table.Cell>
						{#each week.todos.todo as todo}
							<div class="task-item">
								<span class="task-emoji">{todo.emoji || '📋'}</span>
								<span class="task-title">{todo.title}</span>
								{#if todo.todo}
									<span class="task-date">{formatTodoDate(todo.todo)}</span>
								{/if}
							</div>
						{/each}
					</Table.Cell>
					{#if week.isCurrent}
						<Table.Cell>
							{#each week.openTodos as todo}
								<div class="task-item">
									<span class="task-emoji">{todo.emoji || '📋'}</span>
									<span class="task-title">{todo.title}</span>
									<Badge variant={getTaskStatus(todo) === 'overdue' ? 'destructive' : getTaskStatus(todo) === 'slipped' ? 'secondary' : 'default'}>
										{getTaskStatus(todo)}
									</Badge>
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

<style lang="postcss">
	.weekly-view-container {
		@apply w-full overflow-x-auto;
	}

	/* Current week highlight */
	:global(.current-week) {
		@apply bg-amber-50 dark:bg-amber-900/20;
	}

	/* Month separator */
	:global(.month-separator td) {
		@apply bg-gray-100 dark:bg-gray-800 pt-4 pb-2;
	}

	.month-header {
		@apply text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider;
	}

	.week-dates {
		@apply text-sm whitespace-nowrap;
	}

	.task-item {
		@apply flex items-center gap-2 py-1;
	}

	.task-emoji {
		@apply text-base;
	}

	.task-title {
		@apply text-sm text-gray-700 dark:text-gray-300 flex-1;
	}

	.task-date {
		@apply text-xs text-gray-500;
	}
</style>