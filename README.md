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

   - Deadline tasks stay in their original week
   - Finish By tasks are promoted to current week if overdue
   - Completed tasks stay in their original week

2. **Task Hierarchy Tests**: Test parent-child relationships

   - Parent tasks appear before children
   - Parent tasks are shown when subtasks are visible
   - Subtasks are shown when parent tasks are visible

3. **Task Sorting Tests**: Test sorting logic
   - Sort by path to maintain hierarchy
   - Sort by status within same hierarchy level
   - Sort by date within same hierarchy level and status

To run the tests:

```bash
pnpm test
```

### Git Hooks

We use Husky to run tests automatically:

- **Pre-commit Hook**: Runs task management tests before each commit
- **Pre-push Hook**: Runs all tests before pushing to the remote repository

This ensures that task management logic issues are caught early in the development process.
