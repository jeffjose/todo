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

This project includes comprehensive testing for the database initialization process to prevent SQL syntax errors and other issues.

### Database Tests

We have several types of tests for the database:

1. **Unit Tests**: Test the database initialization logic with mocks

   ```bash
   pnpm test:db
   ```

2. **Schema Validation**: Validate SQL syntax for table creation

   ```bash
   pnpm test:db
   ```

3. **Integration Tests**: Test the actual database initialization in a browser environment

   ```bash
   pnpm test:db:integration
   ```

4. **All Database Tests**: Run all database tests
   ```bash
   pnpm test:db:all
   ```

### Git Hooks

We use Husky to run tests automatically:

- **Pre-commit Hook**: Runs database unit tests and schema validation before each commit
- **Pre-push Hook**: Runs all tests before pushing to the remote repository

This ensures that SQL syntax errors and other database issues are caught early in the development process.

### SQL Validation Utilities

The project includes SQL validation utilities in `src/lib/utils/sql-validator.ts` that can be used to validate SQL syntax, particularly for default values in CREATE TABLE statements. These utilities help prevent common SQL syntax errors like unquoted string values.
