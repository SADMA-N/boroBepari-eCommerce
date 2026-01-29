# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the React + TypeScript app code. Routes live in `src/routes/` (file-based routing), shared state in `src/contexts/`, and mock/demo data in `src/data/`.
- `public/` holds static assets served as-is.
- `tests/` contains test suites and helpers.
- `drizzle/` and `drizzle.config.ts` manage database schemas and migrations.
- `docs/`, `scripts/`, and config files (`vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `prettier.config.js`) define tooling and build behavior.

## Build, Test, and Development Commands
Use Bun for all commands:
- `bun install` — install dependencies.
- `bun run dev` — start the local dev server (Vite, port 3000).
- `bun run build` — create a production build.
- `bun run preview` — preview the production build locally.
- `bun run test` — run the test suite (Vitest).
- `bun run lint` — run ESLint checks.
- `bun run format` — format files with Prettier.
- `bun run check` — auto-format and auto-fix lint issues.
- `bun run db:generate`, `bun run db:migrate`, `bun run db:push` — generate and apply Drizzle migrations.

## Coding Style & Naming Conventions
- Language: TypeScript with React; follow existing file-based routing in `src/routes/`.
- Indentation: 2 spaces; Prettier is the source of truth.
- Naming: components in `PascalCase`, hooks in `useCamelCase`, files in `kebab-case` for routes (e.g., `src/routes/products/$productSlug.tsx`).
- Prefer module boundaries that mirror `src/routes/` and `src/contexts/`.

## Testing Guidelines
- Framework: Vitest via `bun run test`.
- Name tests as `*.test.ts` or `*.test.tsx` in `tests/` or alongside source.
- Keep UI tests focused on observable behavior; mock external services when needed.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits (e.g., `feat: ...`, `feat(scope): ...`, `fix: ...`).
- PRs should include: a clear description, linked issue (if any), and screenshots for UI changes.
- Note any DB or env changes explicitly and include migration steps.

## Configuration & Environment
- Bun auto-loads `.env`; avoid manual dotenv wiring.
- Keep secrets out of the repo; use `.env.local` for local overrides.
