<script lang="ts">
	import type { HTMLTextareaAttributes } from "svelte/elements";
	import { cn } from "$lib/utils.js";
	
	type Props = HTMLTextareaAttributes & {
		value?: string;
	};
	
	let {
		class: className,
		value = $bindable(),
		...restProps
	}: Props = $props();
</script>

<textarea
	bind:value
	class={cn(
		"flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
		className
	)}
	{...restProps}
/>