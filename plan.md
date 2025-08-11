# Todo App UI Implementation Plan

## Overview
Build a professional weekly todo app with a grid-based layout featuring expandable weeks, task categorization by deadline types, and a focus on the current week.

**Tech Stack**: 
- Svelte 5 with Runes (`$state`, `$derived`, `$props`, `$effect`)
- TypeScript
- Tailwind CSS with Neutral theme
- shadcn-svelte components
- Dexie (IndexedDB) for data persistence
- Inter font

## Design Principles
- **Minimal & Professional**: Clean lines, ample whitespace, subtle shadows
- **Classy Typography**: Inter font with careful weight hierarchy
- **Subtle Interactions**: Smooth transitions, hover states, no jarring animations
- **Neutral Palette**: Grays with amber accent for current week
- **Grid-based Layout**: Flexible div-based grid instead of tables

## Core Features
- Grid with 4 columns: Week, Tasks Deadline, Finish By, Todo List
- Show 5 weeks total: past 2 weeks, current week, next 2 weeks
- Expandable weeks to show individual days
- Current week highlighted and expanded by default
- Nested task structure with checkboxes
- Add task button with modal dialog
- Three date types: deadline, finishBy, todo

## Data Model (Using Existing Dexie Schema)

### 1. Existing Todo Type from Dexie
**File:** `src/lib/client/dexie.ts` (Already exists)
```typescript
export interface Todo {
  id: string;
  title: string;
  description: string | null;
  emoji: string | null;
  deadline: Date | null;    // Hard deadline
  finishBy: Date | null;    // Soft deadline
  todo: Date | null;        // Explicit work date
  status: 'todo' | 'active' | 'completed' | 'cancelled';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  path: string;
  level: number;
  parentId: string | null;
  // ... other existing fields
}
```

### 2. Week View Model
**File:** `src/lib/types/week.ts` (New file - 15 lines)
```typescript
export interface Week {
  startDate: Date;
  endDate: Date;
  weekOf: string; // "Mar 3, 2025 - Mar 7, 2025"
  isCurrentWeek: boolean;
  isExpanded: boolean;
  days: Day[];
}

export interface Day {
  date: Date;
  dayName: string; // "Monday"
  dateStr: string; // "Mar 3"
  isToday: boolean;
}
```

### 3. Database Operations (Extend existing)
**File:** `src/lib/client/dexie.ts` (Add these functions)
```typescript
// Get tasks for date range
export async function getTasksForDateRange(startDate: Date, endDate: Date): Promise<Todo[]> {
  return db.todos
    .where('deadline').between(startDate, endDate)
    .or('finishBy').between(startDate, endDate)
    .or('todo').between(startDate, endDate)
    .toArray();
}

// Create new task
export async function createTask(task: Partial<Todo>): Promise<string> {
  const id = generateId();
  await db.todos.add({
    ...task,
    id,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'todo',
    priority: 'P2',
    path: `root.${id}`,
    level: 0
  });
  return id;
}
```

## Component Structure

### 1. Main Page Component
**File:** `src/routes/+page.svelte` (80 lines)
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  import TodoGrid from '$lib/components/TodoGrid.svelte';
  import AddTaskDialog from '$lib/components/AddTaskDialog.svelte';
  import EditTaskDialog from '$lib/components/EditTaskDialog.svelte';
  import { getTasksForDateRange, getTaskById, updateTask, deleteTask, type Todo } from '$lib/client/dexie';
  import { getWeekRanges } from '$lib/utils/dates';
  
  let weeks = $state<Week[]>([]);
  let tasks = $state<Todo[]>([]);
  let showAddDialog = $state(false);
  let showEditDialog = $state(false);
  let editingTask = $state<Todo | null>(null);
  
  onMount(async () => {
    weeks = getWeekRanges();
    const range = getDateRangeForWeeks(weeks);
    tasks = await getTasksForDateRange(range.start, range.end);
  });
  
  async function handleTaskToggle(taskId: string, completed: boolean) {
    await updateTask(taskId, { status: completed ? 'completed' : 'todo' });
    await refreshTasks();
  }
  
  async function handleAddTask(taskData: Partial<Todo>) {
    await createTask(taskData);
    await refreshTasks();
    showAddDialog = false;
  }
  
  async function handleEditTask(taskId: string) {
    const task = await getTaskById(taskId);
    if (task) {
      editingTask = task;
      showEditDialog = true;
    }
  }
  
  async function handleUpdateTask(taskId: string, updates: Partial<Todo>) {
    await updateTask(taskId, updates);
    await refreshTasks();
    showEditDialog = false;
    editingTask = null;
  }
  
  async function handleDeleteTask(taskId: string) {
    await deleteTask(taskId);
    await refreshTasks();
    showEditDialog = false;
    editingTask = null;
  }
</script>

<div class="min-h-screen bg-neutral-50">
  <div class="max-w-[1400px] mx-auto p-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-2xl font-semibold text-neutral-900">Weekly Tasks</h1>
      <Button onclick={() => showAddDialog = true} size="sm" class="gap-2">
        <Plus class="w-4 h-4" />
        Add Task
      </Button>
    </div>
    
    <!-- Main Grid -->
    <TodoGrid 
      {weeks} 
      {tasks} 
      ontaskToggle={handleTaskToggle}
      onedit={handleEditTask}
      ondelete={handleDeleteTask}
      onadd={() => showAddDialog = true}
    />
  </div>
  
  <!-- Add Task Dialog -->
  <AddTaskDialog 
    open={showAddDialog} 
    onclose={() => showAddDialog = false}
    onsubmit={handleAddTask}
  />
  
  <!-- Edit Task Dialog -->
  <EditTaskDialog
    open={showEditDialog}
    task={editingTask}
    onclose={() => {
      showEditDialog = false;
      editingTask = null;
    }}
    onsubmit={handleUpdateTask}
    ondelete={handleDeleteTask}
  />
</div>
```

### 2. TodoGrid Component (Main Grid Layout)
**File:** `src/lib/components/TodoGrid.svelte` (120 lines)
```svelte
<script lang="ts">
  import type { Todo, Week } from '$lib/types';
  import WeekRow from './WeekRow.svelte';
  import { Card } from '$lib/components/ui/card';
  
  let { weeks = [], tasks = [], ontaskToggle } = $props();
  
  // Group tasks by week
  const tasksByWeek = $derived(() => {
    const grouped = new Map<string, Todo[]>();
    // Implementation
    return grouped;
  });
</script>

<Card class="overflow-hidden border-0 shadow-sm">
  <!-- Grid Header -->
  <div class="grid grid-cols-[200px_1fr_1fr_1fr] border-b border-neutral-200 bg-white">
    <div class="px-6 py-4 font-medium text-neutral-700">
      <!-- Empty corner cell -->
    </div>
    <div class="px-6 py-4 border-l border-neutral-100">
      <div class="font-medium text-neutral-900">Tasks deadline</div>
      <div class="text-sm text-neutral-500 mt-0.5">This is what the tasks are for</div>
    </div>
    <div class="px-6 py-4 border-l border-neutral-100">
      <div class="font-medium text-neutral-900">Finish by</div>
      <div class="text-sm text-neutral-500 mt-0.5">Ideally finish by</div>
    </div>
    <div class="px-6 py-4 border-l border-neutral-100">
      <div class="font-medium text-neutral-900">Todo list</div>
      <div class="text-sm text-neutral-500 mt-0.5">Do work</div>
    </div>
  </div>
  
  <!-- Grid Body -->
  <div class="divide-y divide-neutral-200">
    {#each weeks as week}
      <WeekRow 
        {week} 
        tasks={tasksByWeek.get(week.weekOf) || []} 
        {ontaskToggle}
      />
    {/each}
  </div>
</Card>
```

### 3. WeekRow Component (Expandable Week)
**File:** `src/lib/components/WeekRow.svelte` (180 lines)
```svelte
<script lang="ts">
  import type { Week, Todo } from '$lib/types';
  import DayRow from './DayRow.svelte';
  import TaskList from './TaskList.svelte';
  import { ChevronDown, ChevronRight, Target } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  
  let { week, tasks, ontaskToggle, onedit, ondelete, onadd } = $props();
  let isExpanded = $state(week.isCurrentWeek);
  
  // Filter tasks by type
  const deadlineTasks = $derived(tasks.filter(t => t.deadline));
  const finishByTasks = $derived(tasks.filter(t => t.finishBy));
  const todoTasks = $derived(tasks.filter(t => t.todo));
  
  // Row background
  const rowClass = $derived(
    week.isCurrentWeek 
      ? 'bg-amber-50/50 hover:bg-amber-50' 
      : 'bg-white hover:bg-neutral-50/50'
  );
</script>

<!-- Week Summary Row -->
<div class="group">
  <div class="grid grid-cols-[200px_1fr_1fr_1fr] {rowClass} transition-colors">
    <div class="px-6 py-4">
      <Button 
        variant="ghost" 
        size="sm"
        onclick={() => isExpanded = !isExpanded}
        class="gap-2 font-medium text-neutral-700 hover:text-neutral-900"
      >
        {#if week.isCurrentWeek}
          <Target class="w-4 h-4 text-red-500" />
        {/if}
        {#if isExpanded}
          <ChevronDown class="w-4 h-4 transition-transform" />
        {:else}
          <ChevronRight class="w-4 h-4 transition-transform" />
        {/if}
        <span class="text-sm">{week.weekOf}</span>
      </Button>
    </div>
    
    <div class="px-6 py-4 border-l border-neutral-100">
      <TaskList 
        tasks={deadlineTasks} 
        {ontaskToggle}
        {onedit}
        {ondelete}
        {onadd}
      />
    </div>
    
    <div class="px-6 py-4 border-l border-neutral-100">
      <TaskList 
        tasks={finishByTasks} 
        {ontaskToggle}
        {onedit}
        {ondelete}
        {onadd}
      />
    </div>
    
    <div class="px-6 py-4 border-l border-neutral-100">
      <TaskList 
        tasks={todoTasks} 
        {ontaskToggle}
        {onedit}
        {ondelete}
        {onadd}
      />
    </div>
  </div>
  
  <!-- Expanded Days -->
  {#if isExpanded}
    <div class="border-t border-neutral-100">
      {#each week.days as day}
        <DayRow {day} tasks={getTasksForDay(tasks, day)} {ontaskToggle} />
      {/each}
    </div>
  {/if}
</div>
```

### 4. TaskList Component (with hover-reveal actions)
**File:** `src/lib/components/TaskList.svelte` (120 lines)
```svelte
<script lang="ts">
  import type { Todo } from '$lib/client/dexie';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { Button } from '$lib/components/ui/button';
  import { Pencil, Trash2, Plus, MoreVertical } from 'lucide-svelte';
  
  let { tasks = [], ontaskToggle, onedit, ondelete, onadd } = $props();
  
  // Build tree structure from flat list
  const taskTree = $derived(() => {
    const rootTasks = tasks.filter(t => !t.parentId);
    return rootTasks.map(task => ({
      ...task,
      children: tasks.filter(t => t.parentId === task.id)
    }));
  });
</script>

<div class="space-y-1">
  {#if tasks.length === 0}
    <EmptyState type={compact ? 'todo' : 'week'} onadd={onadd} />
  {:else}
    {#each taskTree as task}
    <div class="group/task relative">
      <div class="flex items-start gap-2 py-0.5 pr-8">
        <Checkbox 
          checked={task.status === 'completed'}
          onCheckedChange={(checked) => ontaskToggle?.(task.id, checked)}
          class="mt-0.5"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between">
            <label class="text-sm cursor-pointer {task.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-700'}">
              {#if task.emoji}
                <span class="mr-1">{task.emoji}</span>
              {/if}
              {task.title}
            </label>
            
            <!-- Hover actions - absolutely positioned -->
            <div class="absolute right-0 top-0 flex items-center gap-0.5 opacity-0 group-hover/task:opacity-100 transition-opacity">
              <Button 
                variant="ghost" 
                size="icon"
                onclick={() => onadd?.(task.id)}
                class="h-7 w-7 text-neutral-400 hover:text-neutral-600"
              >
                <Plus class="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onclick={() => onedit?.(task.id)}
                class="h-7 w-7 text-neutral-400 hover:text-neutral-600"
              >
                <Pencil class="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onclick={() => ondelete?.(task.id)}
                class="h-7 w-7 text-neutral-400 hover:text-red-600"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          <!-- Nested tasks -->
          {#if task.children?.length}
            <div class="ml-4 mt-1 space-y-0.5">
              {#each task.children as child}
                <div class="group/child flex items-start gap-2 relative py-0.5 pr-6">
                  <Checkbox 
                    checked={child.status === 'completed'}
                    onCheckedChange={(checked) => ontaskToggle?.(child.id, checked)}
                    class="mt-0.5 h-3 w-3"
                  />
                  <label class="text-xs cursor-pointer {child.status === 'completed' ? 'line-through text-neutral-400' : 'text-neutral-600'}">
                    {child.title}
                  </label>
                  
                  <!-- Hover actions for child -->
                  <div class="absolute right-0 top-0 flex items-center gap-0.5 opacity-0 group-hover/child:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onclick={() => onedit?.(child.id)}
                      class="h-5 w-5 text-neutral-400 hover:text-neutral-600"
                    >
                      <Pencil class="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onclick={() => ondelete?.(child.id)}
                      class="h-5 w-5 text-neutral-400 hover:text-red-600"
                    >
                      <Trash2 class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/each}
  {/if}
</div>
```

### 5. Empty State Component
**File:** `src/lib/components/EmptyState.svelte` (40 lines)
```svelte
<script lang="ts">
  import { Plus, Calendar, CheckCircle2 } from 'lucide-svelte';
  import { Button } from '$lib/components/ui/button';
  
  let { type = 'week', onadd } = $props();
  
  const emptyMessages = {
    week: {
      icon: Calendar,
      title: "No tasks this week",
      description: "Add a task to get started with your weekly planning"
    },
    deadline: {
      icon: Calendar,
      title: "No deadlines",
      description: "Tasks with hard deadlines will appear here"
    },
    finishBy: {
      icon: CheckCircle2,
      title: "No soft deadlines",
      description: "Tasks to ideally finish by a date will appear here"
    },
    todo: {
      icon: CheckCircle2,
      title: "No todos",
      description: "Your work items will appear here"
    }
  };
  
  const config = emptyMessages[type] || emptyMessages.week;
  const Icon = config.icon;
</script>

<div class="flex flex-col items-center justify-center py-8 text-center">
  <Icon class="w-10 h-10 text-neutral-300 mb-3" />
  <p class="text-sm font-medium text-neutral-600 mb-1">{config.title}</p>
  <p class="text-xs text-neutral-400 mb-4">{config.description}</p>
  {#if onadd}
    <Button variant="outline" size="sm" onclick={onadd} class="gap-2">
      <Plus class="w-3.5 h-3.5" />
      Add Task
    </Button>
  {/if}
</div>
```

### 6. EditTaskDialog Component
**File:** `src/lib/components/EditTaskDialog.svelte` (180 lines)
```svelte
<script lang="ts">
  import { Calendar, Clock, AlertCircle } from 'lucide-svelte';
  import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter 
  } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  import type { Todo } from '$lib/client/dexie';
  
  let { open = false, task = null, onclose, onsubmit } = $props();
  
  // Form fields - populated when task changes
  let title = $state('');
  let description = $state('');
  let deadline = $state('');
  let finishBy = $state('');
  let todo = $state('');
  
  // Update form when task changes
  $effect(() => {
    if (task) {
      title = task.title || '';
      description = task.description || '';
      deadline = task.deadline ? formatDateForInput(task.deadline) : '';
      finishBy = task.finishBy ? formatDateForInput(task.finishBy) : '';
      todo = task.todo ? formatDateForInput(task.todo) : '';
    }
  });
  
  function formatDateForInput(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  function handleSubmit() {
    if (!task) return;
    
    const updates = {
      title,
      description: description || null,
      deadline: deadline ? new Date(deadline) : null,
      finishBy: finishBy ? new Date(finishBy) : null,
      todo: todo ? new Date(todo) : null
    };
    
    onsubmit?.(task.id, updates);
    onclose?.();
  }
  
  function handleDelete() {
    if (!task) return;
    if (confirm('Are you sure you want to delete this task?')) {
      ondelete?.(task.id);
      onclose?.();
    }
  }
</script>

<Dialog {open} onOpenChange={onclose}>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Edit Task</DialogTitle>
    </DialogHeader>
    
    <div class="space-y-4 py-4">
      <!-- Title -->
      <div class="space-y-2">
        <Label for="edit-title">Title *</Label>
        <Input 
          id="edit-title"
          bind:value={title}
          placeholder="Enter task title"
          class="w-full"
        />
      </div>
      
      <!-- Description -->
      <div class="space-y-2">
        <Label for="edit-description">Description</Label>
        <Textarea 
          id="edit-description"
          bind:value={description}
          placeholder="Add details about this task"
          class="min-h-[80px] resize-none"
        />
      </div>
      
      <!-- Date Fields -->
      <div class="space-y-3">
        <div class="text-sm font-medium text-neutral-700">Dates</div>
        
        <!-- Deadline -->
        <div class="flex items-center gap-3">
          <Calendar class="w-4 h-4 text-neutral-400" />
          <div class="flex-1">
            <Label for="edit-deadline" class="text-xs text-neutral-600">Deadline</Label>
            <Input 
              id="edit-deadline"
              type="date"
              bind:value={deadline}
              class="mt-1"
            />
          </div>
        </div>
        
        <!-- Finish By -->
        <div class="flex items-center gap-3">
          <Clock class="w-4 h-4 text-neutral-400" />
          <div class="flex-1">
            <Label for="edit-finishBy" class="text-xs text-neutral-600">Finish By</Label>
            <Input 
              id="edit-finishBy"
              type="date"
              bind:value={finishBy}
              class="mt-1"
            />
          </div>
        </div>
        
        <!-- Todo Date -->
        <div class="flex items-center gap-3">
          <Calendar class="w-4 h-4 text-neutral-400" />
          <div class="flex-1">
            <Label for="edit-todo" class="text-xs text-neutral-600">Todo Date</Label>
            <Input 
              id="edit-todo"
              type="date"
              bind:value={todo}
              class="mt-1"
            />
          </div>
        </div>
      </div>
      
      <!-- Danger Zone -->
      <div class="border-t pt-4">
        <Button 
          variant="ghost" 
          onclick={handleDelete}
          class="text-red-600 hover:text-red-700 hover:bg-red-50 w-full justify-start"
        >
          <AlertCircle class="w-4 h-4 mr-2" />
          Delete Task
        </Button>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onclick={onclose}>Cancel</Button>
      <Button onclick={handleSubmit} disabled={!title.trim()}>Save Changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### 7. AddTaskDialog Component
**File:** `src/lib/components/AddTaskDialog.svelte` (150 lines)
```svelte
<script lang="ts">
  import { Calendar, Clock } from 'lucide-svelte';
  import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter 
  } from '$lib/components/ui/dialog';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Textarea } from '$lib/components/ui/textarea';
  import { Label } from '$lib/components/ui/label';
  
  let { open = false, onclose, onsubmit } = $props();
  
  let title = $state('');
  let description = $state('');
  let deadline = $state('');
  let finishBy = $state('');
  let todo = $state('');
  
  function handleSubmit() {
    const taskData = {
      title,
      description: description || null,
      deadline: deadline ? new Date(deadline) : null,
      finishBy: finishBy ? new Date(finishBy) : null,
      todo: todo ? new Date(todo) : null
    };
    onsubmit?.(taskData);
    resetForm();
  }
  
  function resetForm() {
    title = '';
    description = '';
    deadline = '';
    finishBy = '';
    todo = '';
  }
</script>

<Dialog {open} onOpenChange={onclose}>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Add New Task</DialogTitle>
    </DialogHeader>
    
    <div class="space-y-4 py-4">
      <!-- Title -->
      <div class="space-y-2">
        <Label for="title">Title *</Label>
        <Input 
          id="title"
          bind:value={title}
          placeholder="Enter task title"
          class="w-full"
        />
      </div>
      
      <!-- Description -->
      <div class="space-y-2">
        <Label for="description">Description</Label>
        <Textarea 
          id="description"
          bind:value={description}
          placeholder="Add details about this task"
          class="min-h-[80px] resize-none"
        />
      </div>
      
      <!-- Date Fields -->
      <div class="space-y-3">
        <div class="text-sm font-medium text-neutral-700">Dates</div>
        
        <!-- Deadline -->
        <div class="flex items-center gap-3">
          <Calendar class="w-4 h-4 text-neutral-400" />
          <div class="flex-1">
            <Label for="deadline" class="text-xs text-neutral-600">Deadline</Label>
            <Input 
              id="deadline"
              type="date"
              bind:value={deadline}
              class="mt-1"
            />
          </div>
        </div>
        
        <!-- Finish By -->
        <div class="flex items-center gap-3">
          <Clock class="w-4 h-4 text-neutral-400" />
          <div class="flex-1">
            <Label for="finishBy" class="text-xs text-neutral-600">Finish By</Label>
            <Input 
              id="finishBy"
              type="date"
              bind:value={finishBy}
              class="mt-1"
            />
          </div>
        </div>
        
        <!-- Todo Date -->
        <div class="flex items-center gap-3">
          <Calendar class="w-4 h-4 text-neutral-400" />
          <div class="flex-1">
            <Label for="todo" class="text-xs text-neutral-600">Todo Date</Label>
            <Input 
              id="todo"
              type="date"
              bind:value={todo}
              class="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
    
    <DialogFooter>
      <Button variant="outline" onclick={onclose}>Cancel</Button>
      <Button onclick={handleSubmit} disabled={!title.trim()}>Add Task</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Design System

### Colors
```css
/* Professional neutral palette */
--background: 0 0% 98%;        /* Very light gray background */
--foreground: 0 0% 9%;         /* Near black text */
--muted: 0 0% 96%;            /* Subtle backgrounds */
--border: 0 0% 89%;           /* Light borders */
--current-week: 39 100% 97%;  /* Subtle amber for current week */
```

### Typography
```css
/* Font hierarchy with Inter */
.heading-lg { @apply text-2xl font-semibold tracking-tight; }
.heading-md { @apply text-lg font-medium; }
.body { @apply text-sm text-neutral-700; }
.body-muted { @apply text-sm text-neutral-500; }
.caption { @apply text-xs text-neutral-600; }
```

### Spacing & Layout
- Consistent 4px grid system
- Card padding: 24px (px-6 py-4)
- Compact padding: 16px (px-4 py-2)
- Gap between elements: 8px (gap-2)
- Section spacing: 32px (mb-8)

### Professional Touches
- **Hover-reveal Actions**: Edit, delete, and add icons only appear on hover
  - Uses `opacity-0 group-hover:opacity-100 transition-opacity`
  - Icons start at `text-neutral-400` and darken on hover
  - Delete icon turns red on hover for clarity
  - Smaller icons for nested tasks (h-5 w-5 vs h-7 w-7)
- **Minimal by Default**: Interface shows only essential information
- Subtle shadows: `shadow-sm` for cards
- Smooth transitions: `transition-all duration-200`
- Hover states: Slightly darker backgrounds and revealed actions
- Active states: Ring focus indicators
- Border hierarchy: Stronger for main divisions, lighter for sub-sections
- **Icon sizing**: Parent tasks (3.5 size), child tasks (3 size)

## State Management (Svelte 5 Runes)
- **$state**: For reactive local state (isExpanded, form fields, dialog state)
- **$derived**: For computed values (filtered tasks, grouped tasks, CSS classes)
- **$props**: For component properties with defaults
- **$effect**: For side effects like Dexie persistence
- Data fetching in `onMount` with Dexie
- Optimistic UI updates with immediate state changes

## Implementation Steps

### Phase 1: Foundation (2 hours)
1. Set up date utilities in `src/lib/utils/dates.ts` (50 lines)
2. Create Week type in `src/lib/types/week.ts` (15 lines)
3. Extend Dexie functions in `src/lib/client/dexie.ts` (30 lines)

### Phase 2: Core Layout (3 hours)
4. Update `src/routes/+page.svelte` with layout and header (80 lines)
5. Create `TodoGrid.svelte` with grid structure (120 lines)
6. Create `WeekRow.svelte` with expand/collapse (180 lines)

### Phase 3: Task Display (2 hours)
7. Create `TaskList.svelte` with tree structure (80 lines)
8. Create `DayRow.svelte` for expanded days (60 lines)

### Phase 4: Task Creation (2 hours)
9. Create `AddTaskDialog.svelte` with form (150 lines)
10. Wire up Dexie persistence (integrated above)

### Phase 5: Polish (1 hour)
11. Add loading states and error handling (30 lines)
12. Add keyboard shortcuts (Cmd+N for new task) (20 lines)
13. Add subtle animations and transitions (CSS)

## Total Estimated Lines of Code
- Utilities & Types: 95 lines
- Components: 990 lines (includes EmptyState and EditTaskDialog)
  - Main Page: 100 lines
  - TodoGrid: 120 lines
  - WeekRow: 180 lines
  - TaskList: 120 lines
  - EmptyState: 40 lines
  - EditTaskDialog: 180 lines
  - AddTaskDialog: 150 lines
  - DayRow: 60 lines
  - Additional components: 40 lines
- Styles & Polish: 50 lines
- **Total: ~1,135 lines**

## Next Steps
1. Start with Phase 1 - Create date utilities and types
2. Build the grid layout with static data
3. Connect to Dexie for real data
4. Add task creation dialog
5. Polish with animations and keyboard shortcuts