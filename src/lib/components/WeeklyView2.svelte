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
	<table class="rt-table">
		<thead class="rt-table-header">
			<tr class="rt-table-row">
				<th class="rt-table-cell rt-table-header-cell" scope="col">Week</th>
				<th class="rt-table-cell rt-table-header-cell" scope="col">Deadline</th>
				<th class="rt-table-cell rt-table-header-cell" scope="col">Finish By</th>
				<th class="rt-table-cell rt-table-header-cell" scope="col">Todo</th>
				{#if weekEvents.some(week => week.isCurrent)}
					<th class="rt-table-cell rt-table-header-cell" scope="col">Open Todos</th>
				{/if}
			</tr>
		</thead>
		<tbody class="rt-table-body">
			{#each weekEvents as week}
				{@const showMonth = shouldShowMonthHeader(week, weekEvents)}
				{#if showMonth}
					<tr class="rt-table-row month-separator">
						<td class="rt-table-cell" colspan="5">
							<div class="month-header">{getMonthYear(week.weekStart)}</div>
						</td>
					</tr>
				{/if}
				<tr class="rt-table-row" class:current-week={week.isCurrent}>
					<th class="rt-table-cell rt-table-row-header-cell" scope="row">
						<div class="week-dates">
							{formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
						</div>
					</th>
					<td class="rt-table-cell">
						{#each week.todos.deadline as todo}
							<div class="task-item">
								<span class="task-emoji">{todo.emoji || '📋'}</span>
								<span class="task-title">{todo.title}</span>
								<span class="task-badge {getStatusBadgeClass(getTaskStatus(todo))}">{getTaskStatus(todo)}</span>
							</div>
						{/each}
					</td>
					<td class="rt-table-cell">
						{#each week.todos.finishBy as todo}
							<div class="task-item">
								<span class="task-emoji">{todo.emoji || '📋'}</span>
								<span class="task-title">{todo.title}</span>
								<span class="task-badge {getStatusBadgeClass(getTaskStatus(todo))}">{getTaskStatus(todo)}</span>
							</div>
						{/each}
					</td>
					<td class="rt-table-cell">
						{#each week.todos.todo as todo}
							<div class="task-item">
								<span class="task-emoji">{todo.emoji || '📋'}</span>
								<span class="task-title">{todo.title}</span>
								{#if todo.todo}
									<span class="task-date">{formatTodoDate(todo.todo)}</span>
								{/if}
							</div>
						{/each}
					</td>
					{#if week.isCurrent}
						<td class="rt-table-cell">
							{#each week.openTodos as todo}
								<div class="task-item">
									<span class="task-emoji">{todo.emoji || '📋'}</span>
									<span class="task-title">{todo.title}</span>
									<span class="task-badge {getStatusBadgeClass(getTaskStatus(todo))}">{getTaskStatus(todo)}</span>
								</div>
							{/each}
						</td>
					{:else if weekEvents.some(w => w.isCurrent)}
						<td class="rt-table-cell"></td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	/* Radix UI inspired table styling */
	.weekly-view-container {
		@apply w-full overflow-x-auto;
	}

	.rt-table {
		@apply w-full border-collapse;
		font-size: 14px;
		line-height: 1.5;
	}

	/* Table Header */
	.rt-table-header {
		@apply border-b border-gray-200 dark:border-gray-700;
	}

	.rt-table-header-cell {
		@apply px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300;
		font-weight: 500;
		letter-spacing: 0.025em;
	}

	/* Table Body */
	.rt-table-body {
		@apply divide-y divide-gray-100 dark:divide-gray-800;
	}

	.rt-table-row {
		@apply hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors;
	}

	.rt-table-row.current-week {
		@apply bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30;
	}

	/* Table Cells */
	.rt-table-cell {
		@apply px-4 py-3 align-top;
	}

	.rt-table-row-header-cell {
		@apply font-medium text-gray-900 dark:text-gray-100;
		font-weight: 500;
	}

	/* Month separator */
	.month-separator td {
		@apply bg-gray-100 dark:bg-gray-800 py-2;
		padding-top: 1rem;
		padding-bottom: 0.5rem;
	}

	.month-header {
		@apply text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider;
	}

	/* Week dates */
	.week-dates {
		@apply text-sm whitespace-nowrap;
	}

	/* Task items */
	.task-item {
		@apply flex items-center gap-2 py-1;
	}

	.task-emoji {
		@apply text-base;
	}

	.task-title {
		@apply text-sm text-gray-700 dark:text-gray-300;
		flex: 1;
	}

	.task-date {
		@apply text-xs text-gray-500 dark:text-gray-500;
	}

	.task-badge {
		@apply px-2 py-0.5 text-xs rounded-full font-medium;
	}

	/* Status badge colors */
	.task-badge.overdue {
		@apply bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300;
	}

	.task-badge.slipped {
		@apply bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300;
	}

	.task-badge.on-track {
		@apply bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300;
	}
</style>