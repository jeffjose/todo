<script lang="ts">
	import { Dialog as DialogPrimitive } from "bits-ui";
	
	type Props = DialogPrimitive.TriggerProps;
	
	let {
		ref = $bindable(null),
		children,
		...restProps
	}: Props = $props();
</script>

<DialogPrimitive.Trigger bind:ref {...restProps}>
	{@render children?.()}
</DialogPrimitive.Trigger>