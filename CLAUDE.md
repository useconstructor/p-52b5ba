## Required Git workflow

Every change must use a dedicated branch and a pull request targeting `dev`, the development branch. This applies to features, fixes, refactors, configuration, tests, migrations, and documentation.

1. Fetch the latest remote state and create the work branch from `origin/dev` (for example, `feature/<name>` or `fix/<name>`).
2. Commit all changes required for the work, including relevant tests, migrations, and documentation. Do not include credentials or generated temporary files.
3. Push the work branch and open a pull request with **base `dev`**, containing all changes for that task.
4. Keep integration in `dev`. Do not push changes directly to `dev` or `main`, and do not target feature or fix PRs at `main`.
5. Changes reach `main` through a separately authorized promotion from `dev`.

Only an explicit user instruction can authorize an exception, such as applying a specific documentation update directly to `main`. Never infer an exception.

@AGENTS.md

# CLAUDE.md — Template

## What this is

**Template** — the Next.js starter that Constructor deploys for every client website it builds. An AI agent (Claude Code via AWS Bedrock, or Codex via Azure) edits this repo directly: generates pages, components, copy, and routes based on a natural-language prompt. This is NOT a human-edited codebase.

This repo lives at: `github.com/useconstructor/<project-slug>` (one repo per build job).

## Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind 4 (CSS-based config, no `tailwind.config.ts`) |
| Components | shadcn/ui (all components pre-installed in `src/components/ui/`) |
| Database | Turso (libsql) — `src/lib/db.ts` |
| Theme | `next-themes` — light/dark, system default |
| Charts | Recharts |
| Toasts | Sonner |
| Design QA | Impeccable (`/impeccable` commands — see AGENTS.md) |

## Commands

```bash
npm run dev       # next dev (port 3000)
npm run build     # next build
npm run start     # next start
npm run lint      # eslint
```

## File structure

```
src/
  app/
    layout.tsx          # Root layout — fonts, ThemeProvider, TooltipProvider, Toaster
    globals.css         # Tailwind 4 @theme block + shadcn CSS variables
    page.tsx            # Home page (generated per client)
    api/                # Next.js route handlers (API endpoints)
  components/
    ui/                 # shadcn/ui components — DO NOT edit these directly
    theme-provider.tsx  # next-themes wrapper
    theme-toggle.tsx    # light/dark toggle button
  lib/
    db.ts               # Turso client (libsql) — DATABASE_URL + DATABASE_AUTH_TOKEN
public/                 # Static assets
tmp-tests/              # Temp files only — screenshots, test outputs, never commit
```

## Environment variables

```
DATABASE_URL=           # Turso DB URL (libsql://...)
DATABASE_AUTH_TOKEN=    # Turso auth token
```

## Key rules for agents

- **shadcn/ui is pre-installed** — import from `@/components/ui/<component>`, never re-install.
- **Tailwind 4** — config is in CSS (`@theme inline { }` inside `globals.css`), not `tailwind.config.ts`. Use CSS variables for colors: `bg-[var(--primary)]` or Tailwind tokens like `bg-primary`.
- **Next.js 16** — `LayoutProps<T>` only works for routes in `.next/types/routes.d.ts`; use `{ children: React.ReactNode }` for custom layouts. Read `node_modules/next/dist/docs/` before writing routing code.
- **Turso DB** — client is in `src/lib/db.ts`. Use `@libsql/client`. Schema via raw SQL (`db.execute`).
- **tmp-tests/** — all temp files (screenshots, outputs) go here. Already in `.gitignore`.
- **Impeccable** — run `/impeccable polish` after generating a page. Run `npx impeccable detect src/` before deploying. See AGENTS.md for the full command reference.

## Gotchas

- `LayoutProps<"/some-route">` only resolves if that route is in the type manifest. Use `{ children: React.ReactNode }` if unsure.
- `next-themes` requires `suppressHydrationWarning` on `<html>` — already set in `layout.tsx`.
- Charts (Recharts) require `'use client'` — they use browser APIs.
- `cmdk` (Command component) requires `'use client'`.
- Do not add `tailwind.config.ts` — Tailwind 4 reads from CSS only.
