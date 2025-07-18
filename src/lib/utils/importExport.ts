import type { Todo } from '$lib/client/dexie';
import { nanoid } from 'nanoid';

export interface ExportFormat {
  version: string;
  exportDate: string;
  todos: ExportedTodo[];
}

export interface ExportedTodo {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  deadline: string | null;
  finishBy: string | null;
  todo: string | null;
  status: string;
  priority: string;
  urgency: string;
  tags: string[];
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  path: string;
  level: number;
  parentId: string | null;
  completed: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function formatDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString();
}

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  return new Date(dateStr);
}

export function exportTodosToMarkdown(todos: Todo[]): string {
  const exportData: ExportFormat = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    todos: todos.map(todo => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      emoji: todo.emoji,
      deadline: formatDate(todo.deadline),
      finishBy: formatDate(todo.finishBy),
      todo: formatDate(todo.todo),
      status: todo.status,
      priority: todo.priority,
      urgency: todo.urgency,
      tags: todo.tags,
      subtasks: todo.subtasks.map(st => ({
        id: st.id,
        title: st.title,
        completed: st.completed
      })),
      path: todo.path,
      level: todo.level,
      parentId: todo.parentId,
      completed: formatDate(todo.completed),
      createdAt: formatDate(todo.createdAt),
      updatedAt: formatDate(todo.updatedAt)
    }))
  };

  // Create markdown content
  let markdown = `# Todo Export\n\n`;
  markdown += `**Export Date:** ${new Date(exportData.exportDate).toLocaleString()}\n`;
  markdown += `**Version:** ${exportData.version}\n`;
  markdown += `**Total Tasks:** ${exportData.todos.length}\n\n`;
  markdown += `---\n\n`;

  // Group todos by hierarchy
  const rootTodos = exportData.todos.filter(t => t.level === 0);
  const childTodosByParent = new Map<string, ExportedTodo[]>();
  
  exportData.todos.filter(t => t.level > 0).forEach(todo => {
    const parentId = todo.parentId!;
    if (!childTodosByParent.has(parentId)) {
      childTodosByParent.set(parentId, []);
    }
    childTodosByParent.get(parentId)!.push(todo);
  });

  // Recursive function to render todos
  function renderTodo(todo: ExportedTodo, indent: string = ''): string {
    let result = '';
    
    // Task title with checkbox
    const checkbox = todo.status === 'completed' ? '[x]' : '[ ]';
    const emoji = todo.emoji ? `${todo.emoji} ` : '';
    result += `${indent}- ${checkbox} ${emoji}**${todo.title}** (${todo.priority}, ${todo.urgency})\n`;
    
    // Metadata
    if (todo.description) {
      result += `${indent}  - Description: ${todo.description}\n`;
    }
    if (todo.deadline) {
      result += `${indent}  - Deadline: ${new Date(todo.deadline).toLocaleDateString()}\n`;
    }
    if (todo.finishBy) {
      result += `${indent}  - Finish By: ${new Date(todo.finishBy).toLocaleDateString()}\n`;
    }
    if (todo.todo) {
      result += `${indent}  - Todo Date: ${new Date(todo.todo).toLocaleDateString()}\n`;
    }
    if (todo.tags.length > 0) {
      result += `${indent}  - Tags: ${todo.tags.join(', ')}\n`;
    }
    if (todo.completed) {
      result += `${indent}  - Completed: ${new Date(todo.completed).toLocaleString()}\n`;
    }
    
    // Subtasks
    if (todo.subtasks.length > 0) {
      result += `${indent}  - Subtasks:\n`;
      todo.subtasks.forEach(st => {
        const stCheckbox = st.completed ? '[x]' : '[ ]';
        result += `${indent}    - ${stCheckbox} ${st.title}\n`;
      });
    }
    
    // Render children
    const children = childTodosByParent.get(todo.id) || [];
    children.forEach(child => {
      result += renderTodo(child, indent + '  ');
    });
    
    result += '\n';
    return result;
  }

  // Render all root todos
  rootTodos.forEach(todo => {
    markdown += renderTodo(todo);
  });

  // Add JSON data at the end for perfect reconstruction
  markdown += `\n---\n\n`;
  markdown += `## Raw Data (for import)\n\n`;
  markdown += `\`\`\`json\n${JSON.stringify(exportData, null, 2)}\n\`\`\`\n`;

  return markdown;
}

export async function importTodosFromMarkdown(
  markdownContent: string,
  existingTodos: Todo[]
): Promise<{ todos: Partial<Todo>[], errors: string[] }> {
  const errors: string[] = [];
  const importedTodos: Partial<Todo>[] = [];

  try {
    // First try to extract JSON data from the markdown
    const jsonMatch = markdownContent.match(/```json\n([\s\S]+?)\n```/);
    
    if (jsonMatch && jsonMatch[1]) {
      const exportData: ExportFormat = JSON.parse(jsonMatch[1]);
      
      // Validate version
      if (exportData.version !== '1.0') {
        errors.push(`Warning: Import file version ${exportData.version} may not be fully compatible`);
      }

      // Create a map of existing todos by title for merging
      const existingByTitle = new Map<string, Todo>();
      existingTodos.forEach(todo => {
        existingByTitle.set(todo.title.toLowerCase(), todo);
      });

      // Create ID mapping for maintaining hierarchy
      const idMapping = new Map<string, string>();

      // Process todos
      exportData.todos.forEach(exportedTodo => {
        // Check if todo already exists (by title)
        const existing = existingByTitle.get(exportedTodo.title.toLowerCase());
        
        if (existing) {
          // Skip duplicate
          errors.push(`Skipped duplicate task: "${exportedTodo.title}"`);
          idMapping.set(exportedTodo.id, existing.id);
        } else {
          // Generate new ID
          const newId = nanoid();
          idMapping.set(exportedTodo.id, newId);
          
          // Update parent ID if needed
          let parentId = exportedTodo.parentId;
          if (parentId && idMapping.has(parentId)) {
            parentId = idMapping.get(parentId)!;
          }
          
          // Update path with new IDs
          let path = exportedTodo.path;
          idMapping.forEach((newId, oldId) => {
            path = path.replace(oldId, newId);
          });
          
          // Create new todo
          const newTodo: Partial<Todo> = {
            id: newId,
            title: exportedTodo.title,
            description: exportedTodo.description,
            emoji: exportedTodo.emoji,
            deadline: parseDate(exportedTodo.deadline),
            finishBy: parseDate(exportedTodo.finishBy),
            todo: parseDate(exportedTodo.todo),
            status: exportedTodo.status,
            priority: exportedTodo.priority,
            urgency: exportedTodo.urgency,
            tags: exportedTodo.tags,
            attachments: [], // Attachments are not exported
            urls: [], // URLs are not exported
            comments: [], // Comments are not exported
            subtasks: exportedTodo.subtasks.map(st => ({
              ...st,
              id: nanoid(),
              createdAt: new Date(),
              updatedAt: new Date()
            })),
            path: path,
            level: exportedTodo.level,
            parentId: parentId,
            completed: parseDate(exportedTodo.completed),
            createdAt: parseDate(exportedTodo.createdAt) || new Date(),
            updatedAt: new Date()
          };
          
          importedTodos.push(newTodo);
        }
      });
    } else {
      // Fallback: Try to parse markdown format
      errors.push('No JSON data found, attempting to parse markdown format');
      
      // Basic markdown parsing (limited functionality)
      const lines = markdownContent.split('\n');
      let currentIndent = 0;
      
      lines.forEach(line => {
        const match = line.match(/^(\s*)- \[([ x])\] (.+)$/);
        if (match) {
          const indent = match[1].length;
          const completed = match[2] === 'x';
          const content = match[3];
          
          // Extract emoji if present
          const emojiMatch = content.match(/^([\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}])\s+(.+)$/u);
          const emoji = emojiMatch ? emojiMatch[1] : null;
          const title = emojiMatch ? emojiMatch[2] : content;
          
          // Extract priority and urgency from title
          const titleMatch = title.match(/^\*\*(.+)\*\*\s*\(([^,]+),\s*([^)]+)\)$/);
          const cleanTitle = titleMatch ? titleMatch[1] : title.replace(/\*\*/g, '');
          const priority = titleMatch ? titleMatch[2] : 'P2';
          const urgency = titleMatch ? titleMatch[3] : 'medium';
          
          const newTodo: Partial<Todo> = {
            id: nanoid(),
            title: cleanTitle,
            description: null,
            emoji: emoji,
            deadline: null,
            finishBy: null,
            todo: null,
            status: completed ? 'completed' : 'pending',
            priority: priority,
            urgency: urgency,
            tags: [],
            attachments: [],
            urls: [],
            comments: [],
            subtasks: [],
            path: `root.${nanoid()}`,
            level: Math.floor(indent / 2),
            parentId: null,
            completed: completed ? new Date() : null,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          importedTodos.push(newTodo);
        }
      });
    }

    return { todos: importedTodos, errors };
  } catch (error) {
    errors.push(`Import error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { todos: [], errors };
  }
}

export function downloadMarkdown(content: string, filename: string = 'todos-export.md') {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}