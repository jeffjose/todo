# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.

## Testing

This project includes comprehensive testing for task management logic.

### Task Management Tests

We have several types of tests:

1. **Task Promotion Tests**: Test how tasks are promoted between weeks

   - Deadline tasks stay in original week (`should keep deadline tasks in their original week even if overdue`)
   - Finish By tasks are promoted to current week if overdue (`should promote overdue finishBy tasks to current week`)
   - Completed tasks stay in original week (`should keep completed finishBy tasks in their original week`)
   - Mixed task types (`should handle mixed deadline and finishBy tasks correctly`)

2. **Task Hierarchy Tests**: Test parent-child relationships

   - Parent tasks appear before children (`should sort tasks by path to maintain hierarchy`)
   - Parent tasks are shown when subtasks are visible (`should show parent tasks when subtask is visible`)
   - Subtasks are shown when parent tasks are visible (`should show subtasks when parent task is visible`)
   - Mixed deadline/finishBy with subtasks (`should handle mixed deadline and finishBy tasks with subtasks`)

3. **Task Sorting Tests**: Test sorting logic
   - Sort by path to maintain hierarchy (`should sort tasks by path to maintain hierarchy`)
   - Sort by status within same hierarchy level (`should sort tasks by status within same hierarchy level`)
   - Sort by date within same hierarchy level and status (`should sort tasks by date within same hierarchy level and status`)
   - Tasks with earlier dates appear first (`should promote slipped tasks to current week regardless of finishBy date`)

To run the tests:

```bash
pnpm test
```

# Task Status Behaviors

## Task Types and Status Indicators

### Deadline Tasks

- Tasks with a hard deadline
- If deadline is in the past:
  - Shows "overdue" badge (red) for:
    - Non-completed tasks
    - Completed tasks that were completed after their deadline (shows days overdue)
- Tasks stay in their original week regardless of status

### Finish By Tasks

- Tasks with a softer target completion date
- If finishBy date is in the past and task is not completed:
  - Shows "slipped" badge (yellow)
  - Task is automatically promoted to current week
  - Original finishBy date is preserved
- Completed tasks stay in their original week

### Todo Column Tasks

- Shows all open tasks for current week
- Shows appropriate badges:
  - "overdue" (red) for tasks with past deadline
  - "slipped" (yellow) for tasks with past finishBy date

## Visual Indicators

### Badges

- **overdue** (red):
  - For non-completed tasks with deadline in the past
  - For completed tasks that were completed after their deadline
  - Shows number of days overdue
- **slipped** (yellow):
  - For non-completed tasks with finishBy date in the past
  - Shown in both Finish By column and Todo column

### Task Promotion Logic

1. Deadline tasks:
   - Stay in their original week
   - Show overdue badge if past deadline
2. Finish By tasks:
   - Completed tasks stay in their original week
   - Open tasks from past weeks are promoted to current week
   - Promoted tasks show "slipped" badge
   - Original finishBy date is preserved when promoted

### Task Sorting Order

Tasks are sorted in the following order:

1. By path to maintain hierarchy (e.g., 'root.parent' before 'root.parent.child')
2. By level within the hierarchy (parent tasks before children)
3. By status (completed tasks first within same level)
4. By date (earlier dates first within same status)

This ensures:

- Parent tasks always appear before their children
- Completed tasks are grouped together within each level
- Tasks with earlier dates appear first when status and level are equal

### Week Display

- Current week has amber background
- Past weeks only show completed tasks
- Future weeks show tasks with future dates
- Todo column shows all open tasks for current week, with appropriate badges
