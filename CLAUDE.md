# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Core Commands

### Development

Important - Dont run pnpm dev, because the user will be running it themselves. It reloads changes automatically.

- `pnpm dev` - Start the development server (opens at localhost:5173)
- `pnpm dev -- --open` - Start dev server and open in browser
- `pnpm preview` - Preview production build

### Building and Type Checking

- `pnpm build` - Build for production
- `pnpm check` - Run SvelteKit sync and type checking
- `pnpm check:watch` - Type checking in watch mode

### Testing

- `pnpm test` - Run all tests once
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:db` - Run Dexie database tests specifically
- `pnpm test:db:all` - Run all database tests
- `pnpm test:db:integration` - Run database integration tests

To run a single test file: `pnpm test path/to/test.ts`
To run tests matching a pattern: `pnpm test -t "pattern"`

### Code Quality

- `pnpm lint` - Check code formatting with Prettier
- `pnpm format` - Auto-format code with Prettier

## Architecture Overview

### Project Type

SvelteKit-based task management web application with local-first architecture using IndexedDB for persistence.

### Core Task Model

Tasks (`Todo` type) have three key date fields that determine behavior:

- **deadline**: Hard deadline, tasks stay in their original week even if overdue
- **finishBy**: Soft deadline, incomplete tasks get promoted to current week when overdue
- **todo**: Explicit work date, shown in "Open Todos" column for current/past weeks

### Task Promotion Logic and Status Behaviors

The key differentiator between task types:

1. **Deadline tasks**: 
   - Never move weeks, stay in their original week
   - If deadline is past and task not completed:
     - Shows "overdue" badge (red)
     - Appears in Todo column of current week
   - Completed tasks stay in their original week

2. **FinishBy tasks**: 
   - Open tasks from past weeks are "promoted" to current week
   - If finishBy date is past and task not completed:
     - Shows "slipped" badge (yellow) 
     - Automatically promoted to current week
     - Original finishBy date is preserved
   - Completed tasks stay in their original week

3. **Todo tasks**: 
   - Past incomplete tasks appear in current week's "Open Todos"
   - Show appropriate badges based on their deadline/finishBy dates

### Visual Indicators and Badges

- **overdue** (red badge): Only for tasks with a deadline date in the past
- **slipped** (yellow badge): For tasks with a finishBy date in the past, shown in:
  - Finish By column when task appears in current week
  - Todo column for all slipped tasks
- **on-track** (green): Default for non-overdue tasks

### Week Display Rules

- Current week has amber background
- Past weeks only show completed tasks
- Future weeks show tasks with future dates
- Todo column shows all open tasks for current week with appropriate badges

### Key Architecture Patterns

#### Database Layer (`src/lib/client/db/`)

- Uses Dexie.js (IndexedDB wrapper) for client-side persistence
- All CRUD operations in `dexie.ts`
- Test data loading from YAML/JSON files
- Indexes on id, title, status, priority, path, level, parentId, and date fields

#### Task Logic (`src/lib/utils/`)

- `taskFilters.ts`: Core filtering logic for weekly views, includes parent/child expansion
- `taskLogic.ts`: Status calculations, badge styling, date utilities
- `task.ts`: Task type definitions and utilities

#### Component Structure (`src/lib/components/`)

- Svelte 5 with runes (`$state`, `$effect`)
- Component-level state management (no global stores)
- Parent-child communication via props and callbacks

#### Routing (`src/routes/`)

- SvelteKit file-based routing
- Demo routes include authentication (Lucia auth)
- Main application at root route

### Task Hierarchy

- Tasks support parent-child relationships via `parentId`
- Path structure: `root.parent.child` (dot-separated)
- When a task is visible, its parent and immediate children are also shown
- Sorting maintains hierarchy (by path, then level, then status)

### Testing Strategy

- Vitest for unit and integration tests
- Comprehensive test coverage for task promotion logic
- Database integration tests with special utilities
- Component testing with Testing Library

### Tech Stack

- **Frontend**: Svelte 5, SvelteKit, TypeScript
- **Styling**: Tailwind CSS with custom theme
- **Database**: Dexie (IndexedDB)
- **Testing**: Vitest, Testing Library
- **Build**: Vite
- **Package Manager**: pnpm (preferred)
- **Auth**: Lucia (for demo routes)

### Performance Considerations

- Built-in performance tracking for database operations
- Client-side only, no backend API calls
- Efficient indexing for task queries
- Virtual scrolling considerations for large task lists
