<script lang="ts">
	import { onMount } from 'svelte';
	import type { Todo } from '$lib/client/dexie';
	import { getTaskStatus, formatTodoDate } from '$lib/utils/taskLogic';
	import { Badge } from '$lib/components/ui/badge';
	import { ChevronRight, ChevronDown } from 'lucide-svelte';

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
	let expandedWeeks = $state<Set<string>>(new Set());

	// Format week dates intelligently
	function formatWeekDates(weekStart: Date, weekEnd: Date): string {
		const startDay = weekStart.getDate();
		const endDay = weekEnd.getDate();
		
		// Always just show the day numbers with space
		return `${startDay} – ${endDay}`;
	}
	
	// Toggle week expansion
	function toggleWeek(weekId: string) {
		if (expandedWeeks.has(weekId)) {
			expandedWeeks.delete(weekId);
		} else {
			expandedWeeks.add(weekId);
		}
		expandedWeeks = new Set(expandedWeeks); // Trigger reactivity
	}
	
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

			const openTodos = isCurrent
				? todos.filter((todo: Todo) => {
						return todo.status !== 'completed' && todo.todo && new Date(todo.todo) <= weekEnd;
					})
				: [];

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
		
		// Set current week as expanded by default
		const currentWeekId = 'week-0';
		if (!expandedWeeks.has(currentWeekId)) {
			expandedWeeks.add(currentWeekId);
			expandedWeeks = new Set(expandedWeeks);
		}
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
		<div
			class="grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-6 border-b bg-muted/30 px-6 py-4 text-xs"
		>
			<div class="font-semibold text-muted-foreground">WEEK</div>
			<div class="font-semibold text-muted-foreground">DEADLINE</div>
			<div class="font-semibold text-muted-foreground">FINISH BY</div>
			<div class="font-semibold text-muted-foreground">TODO</div>
			{#if weekEvents.some((week) => week.isCurrent)}
				<div class="font-semibold text-muted-foreground">OPEN TODOS</div>
			{/if}
		</div>

		<!-- Body -->
		<div class="divide-y">
			{#each weekEvents as week, i}
				{#if !expandedWeeks.has(week.id)}
					<!-- Week row (collapsed) -->
					<div
						class={`grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-6 px-6 py-4 transition-colors hover:bg-muted/5 ${week.isCurrent ? 'bg-amber-50 hover:bg-amber-50 dark:bg-amber-950/10 dark:hover:bg-amber-950/10' : ''}`}
					>
					<!-- Week dates -->
					<button
						class="font-medium gap-1 flex flex-col items-center justify-center h-8 w-full cursor-pointer hover:bg-muted/20 rounded transition-colors"
						onclick={() => toggleWeek(week.id)}
					>
						<div class="flex items-center gap-1">
							<div class="w-3 h-3">
								{#if expandedWeeks.has(week.id)}
									<ChevronDown class="w-3 h-3" />
								{:else}
									<ChevronRight class="w-3 h-3" />
								{/if}
							</div>
							{#if i === 0 || week.weekStart.getMonth() !== week.weekEnd.getMonth()}
								<div class="flex flex-col items-center">
									<div class="text-[10px] text-muted-foreground leading-tight">
										{#if week.weekStart.getMonth() === week.weekEnd.getMonth()}
											{week.weekStart.toLocaleDateString('en-US', { month: 'short' })}
										{:else}
											{week.weekStart.toLocaleDateString('en-US', { month: 'short' })} – {week.weekEnd.toLocaleDateString('en-US', { month: 'short' })}
										{/if}
									</div>
									<div class="text-xs tabular-nums leading-tight">
										{formatWeekDates(week.weekStart, week.weekEnd)}
									</div>
								</div>
							{:else}
								<div class="text-xs tabular-nums">
									{formatWeekDates(week.weekStart, week.weekEnd)}
								</div>
							{/if}
						</div>
					</button>

					<!-- Deadline column -->
					<div class="space-y-2">
						{#each week.todos.deadline as todo}
							{@const status = getTaskStatus(todo, week.weekStart)}
							<div class="group flex items-start gap-2">
								<span class="mt-0.5 text-base leading-tight">{todo.emoji || '📋'}</span>
								<div class="min-w-0 flex-1">
									<p
										class="truncate text-xs leading-tight group-hover:text-clip group-hover:whitespace-normal"
									>
										{todo.title}
									</p>
								</div>
								{#if status && status.type !== 'on-track'}
									<Badge
										variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
										class="shrink-0 text-xs"
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
							<div class="group flex items-start gap-2">
								<span class="mt-0.5 text-base leading-tight">{todo.emoji || '📋'}</span>
								<div class="min-w-0 flex-1">
									<p
										class="truncate text-xs leading-tight group-hover:text-clip group-hover:whitespace-normal"
									>
										{todo.title}
									</p>
								</div>
								{#if status && status.type !== 'on-track'}
									<Badge
										variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
										class="shrink-0 text-xs"
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
							<div class="group flex items-start gap-2">
								<span class="mt-0.5 text-base leading-tight">{todo.emoji || '📋'}</span>
								<div class="min-w-0 flex-1">
									<p
										class="truncate text-xs leading-tight group-hover:text-clip group-hover:whitespace-normal"
									>
										{todo.title}
									</p>
								</div>
								{#if todo.todo}
									<span class="shrink-0 text-xs text-muted-foreground"
										>{formatTodoDate(todo.todo)}</span
									>
								{/if}
							</div>
						{/each}
					</div>

					<!-- Open Todos column -->
					{#if week.isCurrent}
						<div class="space-y-2">
							{#each week.openTodos as todo}
								{@const status = getTaskStatus(todo, week.weekStart)}
								<div class="group flex items-start gap-2">
									<span class="mt-0.5 text-base leading-tight">{todo.emoji || '📋'}</span>
									<div class="min-w-0 flex-1">
										<p
											class="truncate text-xs leading-tight group-hover:text-clip group-hover:whitespace-normal"
										>
											{todo.title}
										</p>
									</div>
									{#if status && status.type !== 'on-track'}
										<Badge
											variant={status.type === 'overdue' ? 'destructive' : 'secondary'}
											class="shrink-0 text-xs"
										>
											{status.type}
										</Badge>
									{/if}
								</div>
							{/each}
						</div>
					{:else if weekEvents.some((w) => w.isCurrent)}
						<div></div>
					{/if}
					</div>
				{:else}
					<!-- Expanded view (show all 7 days) -->
					{#each Array(7) as _, dayIndex}
						{@const dayDate = new Date(week.weekStart)}
						{@const _date = dayDate.setDate(week.weekStart.getDate() + dayIndex)}
						{@const dayTodos = {
							deadline: week.todos.deadline.filter(todo => {
								const deadline = new Date(todo.deadline!);
								return deadline.toDateString() === dayDate.toDateString();
							}),
							finishBy: week.todos.finishBy.filter(todo => {
								const finishBy = new Date(todo.finishBy!);
								return finishBy.toDateString() === dayDate.toDateString();
							}),
							todo: week.todos.todo.filter(todo => {
								const todoDate = new Date(todo.todo!);
								return todoDate.toDateString() === dayDate.toDateString();
							})
						}}
						<div class={`grid grid-cols-[50px_1fr_1fr_1fr_1fr] gap-6 px-6 py-3 ${dayIndex === 0 && week.isCurrent ? 'bg-amber-50 dark:bg-amber-950/10' : 'bg-muted/5'} ${dayIndex > 0 ? 'border-l-2 border-muted' : ''}`}>
							<!-- Day date -->
							<button
								class="font-medium gap-1 flex flex-col items-center justify-center min-h-[2rem] w-full cursor-pointer hover:bg-muted/20 rounded transition-colors py-1"
								onclick={() => toggleWeek(week.id)}
							>
								<div class="flex items-center gap-1">
									<div class="w-3 h-3">
										{#if dayIndex === 0}
											<ChevronDown class="w-3 h-3" />
										{/if}
									</div>
									<div class="flex flex-col items-center">
										{#if (dayIndex === 0 && i === 0) || (week.weekStart.getMonth() !== week.weekEnd.getMonth() && (dayIndex === 0 || dayDate.getMonth() !== week.weekStart.getMonth()))}
											<div class="text-[10px] text-muted-foreground leading-tight">
												{dayDate.toLocaleDateString('en-US', { month: 'short' })}
											</div>
										{/if}
										<div class="text-[10px] text-muted-foreground">{dayDate.toLocaleDateString('en-US', { weekday: 'short' })}</div>
										<div class="text-xs font-medium">{dayDate.getDate()}</div>
									</div>
								</div>
							</button>
							
							<!-- Day deadline tasks -->
							<div class="space-y-1">
								{#each dayTodos.deadline as todo}
									<div class="flex items-center gap-2 text-xs">
										<span>{todo.emoji || '📋'}</span>
										<span class="truncate">{todo.title}</span>
									</div>
								{/each}
							</div>
							
							<!-- Day finishBy tasks -->
							<div class="space-y-1">
								{#each dayTodos.finishBy as todo}
									<div class="flex items-center gap-2 text-xs">
										<span>{todo.emoji || '📋'}</span>
										<span class="truncate">{todo.title}</span>
									</div>
								{/each}
							</div>
							
							<!-- Day todo tasks -->
							<div class="space-y-1">
								{#each dayTodos.todo as todo}
									<div class="flex items-center gap-2 text-xs">
										<span>{todo.emoji || '📋'}</span>
										<span class="truncate">{todo.title}</span>
									</div>
								{/each}
							</div>
							
							<!-- Empty cell for open todos column -->
							{#if weekEvents.some((w) => w.isCurrent)}
								<div></div>
							{/if}
						</div>
					{/each}
				{/if}
			{/each}
		</div>
	</div>
</div>
