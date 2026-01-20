<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { validateImportData, readFileAsText, type ImportMode, type ImportValidation } from '$lib/db/exportImport';
	import { Upload, AlertCircle, CheckCircle } from '@lucide/svelte';

	interface Props {
		open: boolean;
		onImport: (jsonString: string, mode: ImportMode) => Promise<void>;
	}

	let { open = $bindable(), onImport }: Props = $props();

	let fileInput: HTMLInputElement;
	let selectedFile = $state<File | null>(null);
	let validation = $state<ImportValidation | null>(null);
	let importMode = $state<ImportMode>('replace');
	let isImporting = $state(false);

	// Reset when dialog opens
	$effect(() => {
		if (open) {
			selectedFile = null;
			validation = null;
			importMode = 'replace';
			isImporting = false;
		}
	});

	async function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		selectedFile = file;
		const text = await readFileAsText(file);
		validation = validateImportData(text);
	}

	async function handleImport() {
		if (!selectedFile || !validation?.valid) return;

		isImporting = true;
		try {
			const text = await readFileAsText(selectedFile);
			await onImport(text, importMode);
			open = false;
		} finally {
			isImporting = false;
		}
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[450px] bg-zinc-900 border-zinc-800">
		<Dialog.Header>
			<Dialog.Title class="text-zinc-100">Import Data</Dialog.Title>
			<Dialog.Description class="text-zinc-400">
				Import tasks and events from a JSON file
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4">
			<!-- File Input -->
			<input
				bind:this={fileInput}
				type="file"
				accept=".json"
				class="hidden"
				onchange={handleFileSelect}
			/>

			<button
				class="w-full border-2 border-dashed border-zinc-700 rounded-lg p-6 hover:border-zinc-600 hover:bg-zinc-800/50 transition-colors text-center"
				onclick={triggerFileInput}
			>
				<Upload class="w-8 h-8 mx-auto mb-2 text-zinc-500" />
				{#if selectedFile}
					<p class="text-sm text-zinc-300">{selectedFile.name}</p>
					<p class="text-xs text-zinc-500 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
				{:else}
					<p class="text-sm text-zinc-400">Click to select a JSON file</p>
				{/if}
			</button>

			<!-- Validation Result -->
			{#if validation}
				{#if validation.valid}
					<div class="flex items-start gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
						<CheckCircle class="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
						<div>
							<p class="text-sm text-green-300">File is valid</p>
							<p class="text-xs text-green-400/70 mt-1">
								{validation.summary?.tasks} tasks, {validation.summary?.weekEvents} events
							</p>
						</div>
					</div>
				{:else}
					<div class="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
						<AlertCircle class="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
						<div>
							<p class="text-sm text-red-300">Invalid file</p>
							<ul class="text-xs text-red-400/70 mt-1 list-disc list-inside">
								{#each validation.errors.slice(0, 3) as error}
									<li>{error}</li>
								{/each}
								{#if validation.errors.length > 3}
									<li>...and {validation.errors.length - 3} more errors</li>
								{/if}
							</ul>
						</div>
					</div>
				{/if}
			{/if}

			<!-- Import Mode -->
			{#if validation?.valid}
				<div class="space-y-2">
					<Label class="text-zinc-300">Import Mode</Label>
					<div class="flex gap-2">
						<button
							class="flex-1 px-3 py-2 rounded-lg border text-sm transition-colors {importMode === 'replace' ? 'bg-zinc-700 border-zinc-600 text-zinc-100' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-300'}"
							onclick={() => (importMode = 'replace')}
						>
							<div class="font-medium">Replace</div>
							<div class="text-xs opacity-70 mt-0.5">Clear existing data first</div>
						</button>
						<button
							class="flex-1 px-3 py-2 rounded-lg border text-sm transition-colors {importMode === 'merge' ? 'bg-zinc-700 border-zinc-600 text-zinc-100' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-300'}"
							onclick={() => (importMode = 'merge')}
						>
							<div class="font-medium">Merge</div>
							<div class="text-xs opacity-70 mt-0.5">Add to existing data</div>
						</button>
					</div>
				</div>
			{/if}
		</div>

		<div class="flex justify-end gap-2 mt-4">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button
				disabled={!validation?.valid || isImporting}
				onclick={handleImport}
			>
				{isImporting ? 'Importing...' : 'Import'}
			</Button>
		</div>
	</Dialog.Content>
</Dialog.Root>
