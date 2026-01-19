# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Core Commands

### Development

**Important:** Don't run `pnpm dev` - the user runs it themselves. It reloads changes automatically.

- `pnpm dev` - Start dev server (localhost:5173)
- `pnpm build` - Build for production
- `pnpm check` - Run type checking
- `pnpm check:watch` - Type checking in watch mode

## Architecture Overview

### Project Type

SvelteKit-based task management app with local-first architecture using IndexedDB (Dexie) for persistence.

### Core Task Model

Tasks have three key date fields that determine behavior:

- **deadline**: Hard deadline - tasks stay in original week, show "overdue" badge if past
- **finishBy**: Soft deadline - incomplete tasks promoted to current week, show "slipped" badge
- **todo**: Work date - shown in "Open Todos" column for current/past weeks

### Three Column Layout

```
┌────────────────┬────────────────┬────────────────┐
│   Deadline     │   Finish By    │   Open Todos   │
│  Hard dates    │  Soft dates    │  Work items    │
│  Never move    │  Promote if    │  Current week  │
│                │  overdue       │  + past open   │
└────────────────┴────────────────┴────────────────┘
```

### Key Files

- `src/lib/types.ts` - Type definitions (Task, TaskStatus, TaskPriority)
- `src/lib/db/index.ts` - Dexie database setup
- `src/lib/db/tasks.ts` - Task CRUD operations
- `src/lib/utils/dates.ts` - Date utilities (week calculations, formatting)
- `src/lib/components/WeeklyView.svelte` - Main 3-column view
- `src/lib/components/TaskRow.svelte` - Individual task display
- `src/lib/components/Column.svelte` - Task list column
- `src/lib/components/WeekRow.svelte` - Week row with 3 columns
- `src/lib/components/AddTaskDialog.svelte` - Create task dialog
- `src/lib/components/EditTaskDialog.svelte` - Edit task dialog

### Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | SvelteKit 2.x + Svelte 5 |
| Styling | Tailwind CSS 4 |
| UI Components | shadcn-svelte |
| Database | Dexie 4 (IndexedDB) |
| Icons | Lucide |
| ID Generation | nanoid |

### Design Principles

- **Dark mode first** - zinc-950 base, zinc-900 surfaces
- **App shell feel** - not a website, a webapp
- **Local first** - no backend, IndexedDB storage
- **Minimal UI** - clean, focused, no clutter

### Svelte 5 Patterns

- Uses runes: `$state`, `$derived`, `$effect`, `$props`
- Components use `{#snippet}` for slots
- Event handlers use `onclick` not `on:click`
