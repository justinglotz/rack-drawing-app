# Rack Drawing App v2

Monorepo containing the rack drawing application.

## Structure

```
rack-drawing-app-v2/
├── frontend/   # Next.js app (React 19, Tailwind, TanStack Query)
└── backend/    # Express + Prisma API (PostgreSQL)
```

This is an [npm workspaces](https://docs.npmjs.com/cli/using-npm/workspaces) monorepo. Both
packages were merged from their original standalone repos with full git history preserved
(see each subfolder's commit log).

## Getting started

Install all dependencies once from the repo root:

```bash
npm install
```

## Scripts (run from the repo root)

| Command              | What it does                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Run backend and frontend dev servers together |
| `npm run dev:frontend` | Frontend dev server only                    |
| `npm run dev:backend`  | Backend dev server only                     |
| `npm run build`      | Build the frontend                            |
| `npm run test`       | Run backend tests                             |
| `npm run db:seed`    | Seed the backend database                     |

You can also work inside `frontend/` or `backend/` directly with their own scripts.
