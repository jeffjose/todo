import type { Todo } from '$lib/client/dexie';

/**
 * Export todos to markdown format
 */
export function exportTodosToMarkdown(todos: Todo[]): string {
	let markdown = '# Todo Export\n\n';
	markdown += `_Exported on ${new Date().toLocaleString()}_\n\n`;
	
	// Sort todos by status and priority
	const sortedTodos = [...todos].sort((a, b) => {
		// First sort by status
		const statusOrder = { 'pending': 0, 'in-progress': 1, 'blocked': 2, 'completed': 3 };
		const statusDiff = (statusOrder[a.status as keyof typeof statusOrder] ?? 0) - 
		                   (statusOrder[b.status as keyof typeof statusOrder] ?? 0);
		if (statusDiff !== 0) return statusDiff;
		
		// Then by priority
		const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
		return (priorityOrder[a.priority as keyof typeof priorityOrder] ?? 3) - 
		       (priorityOrder[b.priority as keyof typeof priorityOrder] ?? 3);
	});
	
	for (const todo of sortedTodos) {
		markdown += formatTodoAsMarkdown(todo) + '\n';
	}
	
	return markdown;
}

/**
 * Format a single todo as markdown
 */
function formatTodoAsMarkdown(todo: Todo): string {
	let md = '## ';
	
	// Add checkbox based on status
	if (todo.status === 'completed') {
		md += '[x] ';
	} else {
		md += '[ ] ';
	}
	
	// Add emoji and title
	if (todo.emoji) {
		md += `${todo.emoji} `;
	}
	md += todo.title + '\n\n';
	
	// Add metadata
	md += `**ID:** ${todo.id}\n`;
	md += `**Status:** ${todo.status}\n`;
	md += `**Priority:** ${todo.priority}\n`;
	md += `**Urgency:** ${todo.urgency}\n`;
	
	// Add dates if present
	if (todo.deadline) {
		md += `**Deadline:** ${formatDate(todo.deadline)}\n`;
	}
	if (todo.finishBy) {
		md += `**Finish By:** ${formatDate(todo.finishBy)}\n`;
	}
	if (todo.todo) {
		md += `**Todo Date:** ${formatDate(todo.todo)}\n`;
	}
	
	// Add description if present
	if (todo.description) {
		md += `\n**Description:**\n${todo.description}\n`;
	}
	
	// Add tags if present
	if (todo.tags && todo.tags.length > 0) {
		md += `\n**Tags:** ${todo.tags.join(', ')}\n`;
	}
	
	// Add URLs if present
	if (todo.urls && todo.urls.length > 0) {
		md += '\n**URLs:**\n';
		for (const url of todo.urls) {
			md += `- ${url.url}\n`;
		}
	}
	
	// Add timestamps
	md += `\n**Created:** ${formatDate(todo.createdAt)}\n`;
	if (todo.completed) {
		md += `**Completed:** ${formatDate(todo.completed)}\n`;
	}
	
	md += '\n---\n';
	
	return md;
}

/**
 * Import todos from markdown format
 */
export function importTodosFromMarkdown(markdown: string): Partial<Todo>[] {
	const todos: Partial<Todo>[] = [];
	
	// Split by task separator
	const sections = markdown.split(/\n---\n/);
	
	for (const section of sections) {
		const todo = parseTodoFromMarkdown(section);
		if (todo) {
			todos.push(todo);
		}
	}
	
	return todos;
}

/**
 * Parse a single todo from markdown section
 */
function parseTodoFromMarkdown(section: string): Partial<Todo> | null {
	const lines = section.trim().split('\n');
	if (lines.length === 0) return null;
	
	const todo: Partial<Todo> = {
		tags: [],
		urls: [],
		updatedAt: new Date()
	};
	
	// Parse title line
	const titleMatch = lines[0].match(/^##\s*\[(x| )\]\s*(.+)$/);
	if (!titleMatch) return null;
	
	todo.status = titleMatch[1] === 'x' ? 'completed' : 'pending';
	
	// Extract emoji and title
	const titlePart = titleMatch[2].trim();
	const emojiMatch = titlePart.match(/^(\p{Emoji})\s+(.+)$/u);
	if (emojiMatch) {
		todo.emoji = emojiMatch[1];
		todo.title = emojiMatch[2];
	} else {
		todo.title = titlePart;
	}
	
	// Parse metadata
	let inDescription = false;
	let inUrls = false;
	let description = '';
	
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i].trim();
		
		if (line === '') {
			if (inDescription) {
				description += '\n';
			}
			continue;
		}
		
		// Check for metadata fields
		const fieldMatch = line.match(/^\*\*(.+?):\*\*\s*(.*)$/);
		if (fieldMatch) {
			inDescription = false;
			inUrls = false;
			
			const [, field, value] = fieldMatch;
			switch (field) {
				case 'ID':
					todo.id = value;
					break;
				case 'Status':
					todo.status = value;
					break;
				case 'Priority':
					todo.priority = value;
					break;
				case 'Urgency':
					todo.urgency = value;
					break;
				case 'Deadline':
					todo.deadline = parseDate(value);
					break;
				case 'Finish By':
					todo.finishBy = parseDate(value);
					break;
				case 'Todo Date':
					todo.todo = parseDate(value);
					break;
				case 'Tags':
					todo.tags = value.split(',').map(t => t.trim()).filter(Boolean);
					break;
				case 'Created':
					todo.createdAt = parseDate(value) || new Date();
					break;
				case 'Completed':
					todo.completed = parseDate(value);
					break;
				case 'Description':
					inDescription = true;
					break;
				case 'URLs':
					inUrls = true;
					break;
			}
		} else if (inDescription) {
			description += (description ? '\n' : '') + line;
		} else if (inUrls && line.startsWith('- ')) {
			const url = line.substring(2).trim();
			todo.urls!.push({
				url,
				title: null,
				favicon: null
			});
		}
	}
	
	if (description) {
		todo.description = description.trim();
	}
	
	return todo;
}

/**
 * Format date for markdown
 */
function formatDate(date: Date | null): string {
	if (!date) return '';
	return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Parse date from markdown
 */
function parseDate(dateStr: string): Date | null {
	if (!dateStr) return null;
	const date = new Date(dateStr);
	return isNaN(date.getTime()) ? null : date;
}