<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllTodos, type Todo } from '$lib/client/dexie';
	import WeeklyView2 from '$lib/components/WeeklyView2.svelte';

	let todos: Todo[] = $state([]);

	onMount(async () => {
		await loadTodos();
	});

	async function loadTodos() {
		const newTodos = await getAllTodos();
		todos = [...newTodos];
		document.title = `Todo (${todos.length})`;
	}
</script>

<WeeklyView2 {todos} onTodosChange={loadTodos} />
