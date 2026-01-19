# Todo App Rewrite Plan

A complete rewrite of the todo app with Svelte 5, Tailwind CSS 4, and shadcn-svelte.

## Design Principles

- **Dark mode first** - zinc-950 base, zinc-900 surfaces
- **App shell feel** - not a website, a webapp
- **Local first** - IndexedDB via Dexie, no backend
- **Minimal UI** - clean, focused, no clutter

## UI Reference (from ~/scripts/colors)

```
Layout:
├── Left sidebar (w-12) - icon navigation
├── Header toolbar (h-11) - context actions
├── Main content - primary workspace
└── Optional right sidebar - properties/details

Colors:
- bg-zinc-950 (background)
- bg-zinc-900 (surfaces, sidebars)
- border-zinc-800 (borders)
- text-zinc-100/200/300 (text hierarchy)
- text-zinc-500/600 (muted text)

Interactions:
- hover:bg-zinc-800
- rounded-md/lg corners
- subtle shadows (shadow-black/50)
```

---

## Phase 1: Foundation

**Goal:** Clean slate with app shell

### Tasks:
- [ ] Remove all existing source files
- [ ] Fresh SvelteKit + Svelte 5 setup
- [ ] Tailwind CSS 4 configuration
- [ ] shadcn-svelte setup
- [ ] App shell layout:
  - Left icon sidebar (w-12)
  - Header toolbar (h-11)
  - Main content area
- [ ] Dark mode as default (no toggle yet)
- [ ] Basic routing structure

### Deliverable:
Empty app shell that looks like a native app

---

## Phase 2: Data Layer

**Goal:** Persistent storage with clean data model

### Data Model (refined):
```typescript
interface Task {
  id: string;
  title: string;
  emoji?: string;

  // The 3 key dates
  deadline?: Date;    // Hard deadline, never moves
  finishBy?: Date;    // Soft deadline, promotes if overdue
  todo?: Date;        // Work date

  // Status
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'P0' | 'P1' | 'P2' | 'P3';

  // Hierarchy
  parentId?: string;
  path: string;       // 'root.parent.child'
  level: number;

  // Metadata
  description?: string;
  tags: string[];
  completed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface WeekEvent {
  id: string;
  weekStart: Date;
  title: string;
  color?: string;
}
```

### Tasks:
- [ ] Dexie database setup
- [ ] Task CRUD operations
- [ ] WeekEvent CRUD operations
- [ ] Type definitions
- [ ] Basic tests

### Deliverable:
Working database layer with full CRUD

---

## Phase 3: Core Components

**Goal:** Basic task display and creation

### Components:
```
TaskRow.svelte       - Single task display
TaskList.svelte      - List of tasks (used in columns)
AddTaskDialog.svelte - Create new task
EditTaskDialog.svelte - Edit existing task
```

### Tasks:
- [ ] TaskRow component
  - Title, emoji, priority badge
  - Status indicator
  - Click to edit
  - Checkbox for completion
- [ ] TaskList component
  - Renders array of tasks
  - Handles empty state
- [ ] AddTaskDialog (shadcn dialog)
  - Title input
  - Date pickers (deadline, finishBy, todo)
  - Priority selector
- [ ] EditTaskDialog
  - Pre-filled form
  - Delete option

### Deliverable:
Can create, view, edit, delete tasks

---

## Phase 4: Three Column Layout

**Goal:** Weekly view with 3 columns

### Column Structure:
```
┌──────────────────────────────────────────────────┐
│  Week of Jan 13, 2025                   [+ Add]  │
├────────────────┬────────────────┬────────────────┤
│   Deadline     │   Finish By    │   Open Todos   │
│                │                │                │
│  Hard dates    │  Soft dates    │  Work items    │
│  Never move    │  Promote if    │  Current week  │
│                │  overdue       │  + past open   │
└────────────────┴────────────────┴────────────────┘
```

### Tasks:
- [ ] WeeklyView component
  - 3-column grid layout
  - Week header with navigation
- [ ] Column component
  - Header with count
  - Task list
  - Column-specific styling
- [ ] Week navigation
  - 2 weeks back, current, 3 weeks forward
  - Current week highlight (amber)
- [ ] Column filtering logic
  - Deadline column: tasks with deadline in this week
  - FinishBy column: tasks with finishBy in this week
  - Todo column: all open tasks for current week

### Deliverable:
3-column layout showing tasks by week

---

## Phase 5: Task Logic

**Goal:** Promotion, badges, work order

### Badge System:
```
┌─────────────┬────────────┬──────────────────────────────┐
│ Badge       │ Color      │ Condition                    │
├─────────────┼────────────┼──────────────────────────────┤
│ overdue     │ Red        │ deadline in past             │
│ slipped     │ Yellow     │ finishBy in past             │
│ on-track    │ Green      │ future date, not overdue     │
└─────────────┴────────────┴──────────────────────────────┘
```

### Tasks:
- [ ] Task promotion logic
  - FinishBy tasks: promote to current week if overdue
  - Deadline tasks: stay in original week, show badge
  - Todo tasks: show in current week if open
- [ ] Badge component
  - Visual styling per type
  - Days count (e.g., "3d overdue")
- [ ] Work order calculation
  - Rank incomplete deadline tasks
  - Sort by: deadline (earliest) → priority (P0-P3)
  - Display numbered badge
- [ ] Status styling
  - Completed: strikethrough, muted
  - Blocked: distinct styling
  - In-progress: highlight

### Deliverable:
Smart task organization with visual indicators

---

## Phase 6: Task Hierarchy

**Goal:** Parent-child relationships

### Hierarchy Display:
```
├── Parent Task
│   ├── Child Task 1
│   └── Child Task 2
│       └── Grandchild
```

### Tasks:
- [ ] Parent-child creation
  - "Add subtask" action
  - Assign parentId
- [ ] Path management
  - Auto-generate path on create
  - Update children on parent move
- [ ] Hierarchy display
  - Indentation by level
  - Expand/collapse (optional)
- [ ] Visibility rules
  - When task visible, show parent + children
- [ ] Sorting
  - By path → level → status → date

### Deliverable:
Nested task structure with proper display

---

## Phase 7: Week Events

**Goal:** Milestones attached to weeks

### Tasks:
- [ ] WeekEvent display
  - Show in week header or dedicated row
  - Color-coded badges
- [ ] AddEventDialog
  - Title, color picker
  - Week selection
- [ ] Event CRUD
  - Create, edit, delete events

### Deliverable:
Can add context/milestones to weeks

---

## Phase 8: Import/Export

**Goal:** Data portability

### Formats:
- YAML (human-readable)
- JSON (programmatic)

### Tasks:
- [ ] Export functionality
  - Export all tasks as YAML/JSON
  - Download as file
- [ ] Import functionality
  - File picker
  - Parse and validate
  - Merge or replace options
- [ ] Initial data loading
  - Load from /data/initial_tasks.yaml on first run

### Deliverable:
Full data import/export capability

---

## Phase 9: Polish

**Goal:** Production-ready

### Tasks:
- [ ] Keyboard shortcuts
  - n: new task
  - e: edit selected
  - d: delete selected
  - ↑↓: navigate
- [ ] Empty states
  - No tasks messaging
  - Getting started hints
- [ ] Loading states
  - Skeleton loaders
- [ ] Error handling
  - Toast notifications
  - Graceful failures
- [ ] Performance
  - Virtual scrolling for large lists
  - Optimized re-renders
- [ ] Dark/Light toggle (optional)

### Deliverable:
Polished, production-ready app

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | SvelteKit 2.x + Svelte 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn-svelte |
| Database | Dexie 4 (IndexedDB) |
| Icons | Lucide |
| ID Generation | nanoid |
| Testing | Vitest |
| Build | Vite |

---

## File Structure (Target)

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── TaskRow.svelte
│   │   ├── TaskList.svelte
│   │   ├── Column.svelte
│   │   ├── WeeklyView.svelte
│   │   ├── AddTaskDialog.svelte
│   │   ├── EditTaskDialog.svelte
│   │   └── ...
│   ├── db/
│   │   ├── index.ts         # Dexie setup
│   │   ├── tasks.ts         # Task operations
│   │   └── events.ts        # Event operations
│   ├── utils/
│   │   ├── dates.ts         # Date helpers
│   │   ├── taskLogic.ts     # Promotion, badges
│   │   └── workOrder.ts     # Work order calc
│   └── types/
│       └── index.ts         # Type definitions
├── routes/
│   ├── +layout.svelte       # App shell
│   └── +page.svelte         # Main view
├── app.css
└── app.html
```

---

## Notes

- Each phase should be fully functional before moving to next
- Commit after each major step
- Test core logic (promotion, badges, hierarchy) thoroughly
- Keep components small and focused
- Use Svelte 5 runes ($state, $derived, $effect)
