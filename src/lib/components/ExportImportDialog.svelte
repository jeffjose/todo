<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Button } from "$lib/components/ui/button";
	import { Textarea } from "$lib/components/ui/textarea";
	import { Label } from "$lib/components/ui/label";
	import { Download, Upload, Copy, Check } from 'lucide-svelte';
	import { exportTodosToMarkdown, importTodosFromMarkdown } from '$lib/utils/markdownExport';
	import { getAllTodos, updateTodo, createTodo, generateId, type Todo } from '$lib/client/dexie';
	
	interface Props {
		open?: boolean;
		onSuccess?: (message: string) => void;
		onError?: (message: string) => void;
	}
	
	let { open = $bindable(false), onSuccess, onError }: Props = $props();
	
	let activeTab = $state<'export' | 'import'>('export');
	let exportContent = $state('');
	let importContent = $state('');
	let isProcessing = $state(false);
	let copied = $state(false);
	
	// Load export content when dialog opens
	$effect(() => {
		if (open && activeTab === 'export') {
			loadExportContent();
		}
	});
	
	async function loadExportContent() {
		try {
			const todos = await getAllTodos();
			exportContent = exportTodosToMarkdown(todos);
		} catch (error) {
			console.error('Failed to load todos for export:', error);
			onError?.('Failed to load tasks for export');
		}
	}
	
	async function handleDownload() {
		const blob = new Blob([exportContent], { type: 'text/markdown' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `todo-export-${new Date().toISOString().split('T')[0]}.md`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
		
		onSuccess?.('Tasks exported successfully');
	}
	
	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(exportContent);
			copied = true;
			setTimeout(() => {
				copied = false;
			}, 2000);
			onSuccess?.('Copied to clipboard');
		} catch (error) {
			console.error('Failed to copy:', error);
			onError?.('Failed to copy to clipboard');
		}
	}
	
	async function handleImport() {
		if (!importContent.trim()) {
			onError?.('Please paste your markdown content');
			return;
		}
		
		isProcessing = true;
		
		try {
			const importedTodos = importTodosFromMarkdown(importContent);
			
			if (importedTodos.length === 0) {
				onError?.('No valid tasks found in the markdown');
				return;
			}
			
			let created = 0;
			let updated = 0;
			
			for (const todoData of importedTodos) {
				if (todoData.id) {
					// Try to update existing
					try {
						await updateTodo(todoData.id, todoData);
						updated++;
					} catch {
						// If update fails, create new with generated ID
						delete todoData.id;
						todoData.id = generateId(12);
						todoData.createdAt = todoData.createdAt || new Date();
						await createTodo(todoData as Todo);
						created++;
					}
				} else {
					// Create new todo
					todoData.id = generateId(12);
					todoData.createdAt = todoData.createdAt || new Date();
					await createTodo(todoData as Todo);
					created++;
				}
			}
			
			onSuccess?.(`Import complete: ${created} created, ${updated} updated`);
			open = false;
			
			// Reload the page to show new todos
			window.location.reload();
		} catch (error) {
			console.error('Import failed:', error);
			onError?.('Import failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
		} finally {
			isProcessing = false;
		}
	}
	
	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;
		
		const reader = new FileReader();
		reader.onload = (e) => {
			importContent = e.target?.result as string;
		};
		reader.onerror = () => {
			onError?.('Failed to read file');
		};
		reader.readAsText(file);
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-[600px]">
		<Dialog.Header>
			<Dialog.Title>Export/Import Tasks</Dialog.Title>
			<Dialog.Description>
				Export your tasks to markdown or import from markdown
			</Dialog.Description>
		</Dialog.Header>
		
		<div class="flex gap-2 mb-4">
			<Button
				variant={activeTab === 'export' ? 'default' : 'outline'}
				size="sm"
				onclick={() => activeTab = 'export'}
			>
				<Download class="w-4 h-4 mr-2" />
				Export
			</Button>
			<Button
				variant={activeTab === 'import' ? 'default' : 'outline'}
				size="sm"
				onclick={() => activeTab = 'import'}
			>
				<Upload class="w-4 h-4 mr-2" />
				Import
			</Button>
		</div>
		
		{#if activeTab === 'export'}
			<div class="space-y-4">
				<div class="grid gap-2">
					<Label for="export-content">Markdown Export</Label>
					<Textarea
						id="export-content"
						bind:value={exportContent}
						rows={12}
						readonly
						class="font-mono text-xs"
					/>
				</div>
				
				<div class="flex gap-2">
					<Button onclick={handleDownload} size="sm">
						<Download class="w-4 h-4 mr-2" />
						Download .md
					</Button>
					<Button onclick={handleCopy} variant="outline" size="sm">
						{#if copied}
							<Check class="w-4 h-4 mr-2" />
							Copied!
						{:else}
							<Copy class="w-4 h-4 mr-2" />
							Copy to Clipboard
						{/if}
					</Button>
				</div>
			</div>
		{:else}
			<div class="space-y-4">
				<div class="grid gap-2">
					<Label for="import-content">Paste Markdown Content</Label>
					<Textarea
						id="import-content"
						bind:value={importContent}
						rows={12}
						placeholder="Paste your markdown content here..."
						class="font-mono text-xs"
					/>
				</div>
				
				<div class="flex items-center gap-4">
					<Button onclick={handleImport} disabled={isProcessing} size="sm">
						{#if isProcessing}
							Importing...
						{:else}
							<Upload class="w-4 h-4 mr-2" />
							Import Tasks
						{/if}
					</Button>
					
					<div class="text-sm text-muted-foreground">
						or
					</div>
					
					<div>
						<input
							type="file"
							accept=".md,.markdown,.txt"
							onchange={handleFileSelect}
							class="hidden"
							id="file-input"
						/>
						<Label for="file-input" class="cursor-pointer">
							<Button variant="outline" size="sm" onclick={(e) => e.preventDefault()}>
								Choose File
							</Button>
						</Label>
					</div>
				</div>
				
				<div class="text-xs text-muted-foreground">
					<p>• Tasks with matching IDs will be updated</p>
					<p>• Tasks without IDs will be created as new</p>
					<p>• Invalid entries will be skipped</p>
				</div>
			</div>
		{/if}
		
		<Dialog.Footer>
			<Button variant="outline" onclick={() => open = false} size="sm">
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>