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

## Phase 1: Working Prototype ✅

**Goal:** Playable 3-column todo app

This phase delivers everything needed for a functional app you can actually use.

### 1.1 Setup & App Shell
- [x] Fresh SvelteKit + Svelte 5 setup
- [x] Tailwind CSS 4 configuration
- [x] shadcn-svelte setup (button, dialog, input, select)
- [x] App shell layout with header toolbar (h-11)
- [x] Dark mode as default

### 1.2 Data Layer
- [x] Dexie database setup
- [x] Task CRUD operations (create, read, update, delete)
- [x] Type definitions

### 1.3 Core Components
- [x] TaskRow component with priority badges, checkbox, click to edit
- [x] AddTaskDialog with date pickers and priority selector
- [x] EditTaskDialog with pre-filled form and delete option

### 1.4 Three Column Layout
- [x] WeeklyView component (3-column grid)
- [x] Week header with navigation (prev/next)
- [x] Week rows: 2 weeks back → current → 3 weeks forward
- [x] Current week: expanded with day rows + amber highlight
- [x] Column filtering for deadline, finishBy, todo

---

## Phase 2: Task Logic ✅

**Goal:** Smart promotion, badges, work order

### Implemented:
- [x] Task promotion logic (finishBy/todo tasks promote to current week)
- [x] Badge component with day counts ("3d overdue", "2d slipped")
- [x] Work order calculation (numbered badges for deadline tasks)
- [x] Status styling (completed strikethrough, blocked styling)
- [x] Urgency meter (4 dots that fill based on time pressure)
- [x] Overflow bars for overdue tasks (visual danger level)
- [x] Todo column grouping (DUE / FINISH / TODO sections)
- [x] Relative date formatting ("due tomorrow", "due next Wed")
- [x] Past weeks collapse by default

---

## Phase 3: Task Hierarchy ✅

**Goal:** Parent-child relationships

### Implemented:
- [x] Path management (auto-generate on create)
- [x] Indentation by level
- [x] Demo mode with hierarchical project tasks
- [x] Subtask display in demo data

### Not implemented (deferred):
- [ ] "Add subtask" action UI
- [ ] Visibility rules (parent visible → show children)
- [ ] Sorting by path → level → status

---

## Phase 4: Week Events ✅

**Goal:** Milestones attached to weeks

### Implemented:
- [x] WeekEvent data model & CRUD
- [x] Display in week header as colored badges
- [x] WeekEventDialog (title, color picker, delete)
- [x] 6 colors: blue, green, amber, red, purple, pink
- [x] Add event button on hover
- [x] Demo events included in demo mode

---

## Phase 5: Import/Export ✅

**Goal:** Data portability

### Implemented:
- [x] Export as JSON (download file with tasks + events)
- [x] Import from file with validation
- [x] Import modes: Replace (clear existing) or Merge (add to existing)
- [x] File validation with error reporting
- [x] Import summary (task count, event count)

### Not implemented (deferred):
- [ ] YAML export format
- [ ] Load initial data on first run

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

## File Structure (Current)

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── TaskRow.svelte         # Task display with urgency meter
│   │   ├── WeeklyView.svelte      # Main 3-column view
│   │   ├── WeekRow.svelte         # Individual week display
│   │   ├── AddTaskDialog.svelte   # Create task dialog
│   │   ├── EditTaskDialog.svelte  # Edit task dialog
│   │   ├── WeekEventDialog.svelte # Create/edit week event
│   │   └── ImportDialog.svelte    # Import data dialog
│   ├── db/
│   │   ├── index.ts               # Dexie setup
│   │   ├── tasks.ts               # Task CRUD operations
│   │   ├── weekEvents.ts          # Week event operations
│   │   ├── exportImport.ts        # Export/import utilities
│   │   ├── demoData.ts            # Demo mode data generator
│   │   └── testData.ts            # Test data (legacy)
│   ├── utils/
│   │   └── dates.ts               # Date helpers
│   └── types.ts                   # Type definitions
├── routes/
│   ├── +layout.svelte             # App shell
│   └── +page.svelte               # Main view
├── app.css
└── app.html
```

---

## Notes

- Phase 1-5 complete
- Demo mode allows trying features without affecting real data
- Export/import enables data backup and portability
- Next: Phase 6 polish (keyboard shortcuts, empty states, toasts)
