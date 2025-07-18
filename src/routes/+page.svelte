<script lang="ts">
	import { onMount } from 'svelte';
	import { getAllTodos, type Todo } from '$lib/client/dexie';
	import WeeklyView from '$lib/components/WeeklyView.svelte';

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

<WeeklyView {todos} onTodosChange={loadTodos} />
