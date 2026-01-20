<script lang="ts" module>
	export interface ToastMessage {
		id: string;
		message: string;
		type: 'success' | 'error' | 'info';
	}

	// Global toast state
	let toasts = $state<ToastMessage[]>([]);

	export function showToast(message: string, type: ToastMessage['type'] = 'info') {
		const id = Math.random().toString(36).slice(2);
		toasts = [...toasts, { id, message, type }];

		// Auto-dismiss after 3 seconds
		setTimeout(() => {
			toasts = toasts.filter((t) => t.id !== id);
		}, 3000);
	}

	export function getToasts() {
		return toasts;
	}
</script>

<script lang="ts">
	import { CheckCircle, XCircle, Info, X } from '@lucide/svelte';

	let currentToasts = $derived(toasts);

	function dismissToast(id: string) {
		toasts = toasts.filter((t) => t.id !== id);
	}

	const icons = {
		success: CheckCircle,
		error: XCircle,
		info: Info
	};

	const colors = {
		success: 'bg-green-500/20 border-green-500/30 text-green-300',
		error: 'bg-red-500/20 border-red-500/30 text-red-300',
		info: 'bg-blue-500/20 border-blue-500/30 text-blue-300'
	};
</script>

{#if currentToasts.length > 0}
	<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
		{#each currentToasts as toast (toast.id)}
			{@const Icon = icons[toast.type]}
			<div
				class="flex items-center gap-2 px-3 py-2 rounded-lg border shadow-lg {colors[toast.type]} animate-in slide-in-from-right"
			>
				<Icon class="w-4 h-4 shrink-0" />
				<span class="text-sm">{toast.message}</span>
				<button
					class="ml-2 opacity-60 hover:opacity-100 transition-opacity"
					onclick={() => dismissToast(toast.id)}
				>
					<X class="w-3 h-3" />
				</button>
			</div>
		{/each}
	</div>
{/if}
