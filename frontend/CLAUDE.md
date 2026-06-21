## Workflow Orchestration

**Plan Mode**: Use for non-trivial tasks (3+ steps, architectural decisions, multi-file changes). Don't push through if something goes wrong—re-plan instead.

**Verification**: Always prove work before marking complete. Run tests, check logs, compare outputs. Never ship untested code.

**Context Management**: Use subagents for research and investigation to keep main conversation focused. Use `/clear` between unrelated tasks.

## Code Style & Conventions

- **Module syntax**: ES modules (import/export), not CommonJS
- **Custom hooks**: Wrap React Query mutations in custom hooks (`use*` prefix) for reusability
- **Query keys**: Define in `api/queryKeys.ts` using TanStack factory pattern
- **Naming**: Components in PascalCase; API functions/hooks in camelCase
- **Type safety**: MUST validate all API responses with Zod. No `any` types—use `unknown` + type guards
- **Styling**: Use Tailwind classes directly; avoid inline styles unless dynamic
- **Error handling**: Toast errors for user feedback; type error responses from API

## Development Workflow

- Run `npm run dev` to start Next.js dev server
- Run `npm run lint` to check ESLint before committing
- **IMPORTANT**: Run lint and verify no TypeScript errors before marking tasks complete
- Test forms in the browser after changes to ensure they work end-to-end

## Project Structure

```
api/              - API clients (queryKeys.ts, flex.ts)
components/       - React components (ui/ for shadcn, forms/ for features)
hooks/            - Custom React hooks (React Query wrappers)
app/              - Next.js App Router (layout.tsx, providers.tsx, pages)
```

## Git Workflow

- Commit frequently with clear messages describing the "why"
- Branch: `<type>/<short-description>` (e.g., `feat/flex-import`)
- NEVER force-push unless explicitly authorized
- When opening PRs, provide clear description of changes and test instructions
