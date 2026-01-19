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

## Phase 1: Working Prototype

**Goal:** Playable 3-column todo app

This phase delivers everything needed for a functional app you can actually use.

### 1.1 Setup & App Shell
- [ ] Remove all existing source files
- [ ] Fresh SvelteKit + Svelte 5 setup
- [ ] Tailwind CSS 4 configuration
- [ ] shadcn-svelte setup (button, dialog, input, select)
- [ ] App shell layout:
  - Left icon sidebar (w-12)
  - Header toolbar (h-11)
  - Main content area
- [ ] Dark mode as default

### 1.2 Data Layer
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

  // Hierarchy (simplified for now)
  parentId?: string;
  path: string;
  level: number;

  // Metadata
  description?: string;
  tags: string[];
  completed?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] Dexie database setup
- [ ] Task CRUD operations (create, read, update, delete)
- [ ] Type definitions

### 1.3 Core Components
- [ ] TaskRow component
  - Title, priority badge (P0-P3 colors)
  - Checkbox for completion
  - Click to edit
- [ ] AddTaskDialog
  - Title input
  - Date pickers (deadline, finishBy, todo)
  - Priority selector
- [ ] EditTaskDialog
  - Pre-filled form
  - Delete option

### 1.4 Three Column Layout
```
┌──────────────────────────────────────────────────┐
│  Week of Jan 13, 2025              [◀] [▶] [+]   │
├────────────────┬────────────────┬────────────────┤
│   Deadline     │   Finish By    │   Open Todos   │
│                │                │                │
│  Hard dates    │  Soft dates    │  Work items    │
│  (this week)   │  (this week)   │  (open tasks)  │
└────────────────┴────────────────┴────────────────┘
```

- [ ] WeeklyView component (3-column grid)
- [ ] Week header with navigation (prev/next)
- [ ] Week rows: 2 weeks back → current → 3 weeks forward
- [ ] Current week: expanded with day rows + amber highlight
- [ ] Basic column filtering:
  - Deadline: tasks with deadline in this week
  - FinishBy: tasks with finishBy in this week
  - Todo: open tasks (no complex promotion yet)

### Deliverable:
A working todo app where you can:
- Create tasks with dates and priorities
- See tasks organized in 3 columns by week
- Navigate between weeks
- Complete/edit/delete tasks

---

## Phase 2: Task Logic

**Goal:** Smart promotion, badges, work order

### Badge System:
| Badge | Color | Condition |
|-------|-------|-----------|
| overdue | Red | deadline in past, not completed |
| slipped | Yellow | finishBy in past, not completed |
| on-track | Green | future date |

### Tasks:
- [ ] Task promotion logic
  - FinishBy tasks: promote to current week if overdue
  - Deadline tasks: stay in original week, show badge
  - Todo tasks: show in current week if open
- [ ] Badge component with day counts ("3d overdue")
- [ ] Work order calculation
  - Rank incomplete deadline tasks
  - Sort by: deadline → priority
  - Display numbered badge (1, 2, 3...)
- [ ] Status styling
  - Completed: strikethrough, muted
  - Blocked: distinct styling

### Deliverable:
Tasks automatically organize themselves, visual indicators show urgency

---

## Phase 3: Task Hierarchy

**Goal:** Parent-child relationships

### Display:
```
├── Parent Task
│   ├── Child Task 1
│   └── Child Task 2
```

### Tasks:
- [ ] "Add subtask" action
- [ ] Path management (auto-generate on create)
- [ ] Indentation by level
- [ ] Visibility rules (parent visible → show children)
- [ ] Sorting by path → level → status

### Deliverable:
Nested task structure with proper display

---

## Phase 4: Week Events

**Goal:** Milestones attached to weeks

### Tasks:
- [ ] WeekEvent data model & CRUD
- [ ] Display in week header
- [ ] AddEventDialog (title, color)

### Deliverable:
Can add context/milestones to weeks

---

## Phase 5: Import/Export

**Goal:** Data portability

### Tasks:
- [ ] Export as YAML/JSON (download file)
- [ ] Import from file (parse, validate, merge/replace)
- [ ] Load initial data on first run

### Deliverable:
Full data import/export capability

---

## Phase 6: Polish

**Goal:** Production-ready

### Tasks:
- [ ] Keyboard shortcuts (n: new, e: edit, d: delete)
- [ ] Empty states with hints
- [ ] Loading/error states
- [ ] Toast notifications
- [ ] Performance optimization
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
│   │   ├── AppShell.svelte
│   │   ├── TaskRow.svelte
│   │   ├── Column.svelte
│   │   ├── WeeklyView.svelte
│   │   ├── WeekRow.svelte
│   │   ├── AddTaskDialog.svelte
│   │   └── EditTaskDialog.svelte
│   ├── db/
│   │   ├── index.ts         # Dexie setup
│   │   └── tasks.ts         # Task operations
│   ├── utils/
│   │   ├── dates.ts         # Date helpers
│   │   └── taskLogic.ts     # Filtering, promotion
│   └── types.ts             # Type definitions
├── routes/
│   ├── +layout.svelte       # App shell
│   └── +page.svelte         # Main view
├── app.css
└── app.html
```

---

## Notes

- Phase 1 is the big one - get to playable ASAP
- Commit after each sub-section (1.1, 1.2, etc.)
- Keep components small and focused
- Use Svelte 5 runes ($state, $derived, $effect)
