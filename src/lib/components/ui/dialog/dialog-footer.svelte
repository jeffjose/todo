<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	
	type Props = HTMLAttributes<HTMLDivElement>;
	
	let {
		class: className,
		children,
		...restProps
	}: Props = $props();
</script>

<div
	class={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
	{...restProps}
>
	{@render children?.()}
</div>