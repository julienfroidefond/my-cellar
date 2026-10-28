@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npm run test     # Run the Vitest suite once
npm run seed     # Seed database (prisma/seed.ts)
```

Prisma migrations:

```bash
npx prisma migrate dev   # Create and apply migration
npx prisma generate      # Regenerate client after schema changes
```

Vitest runs two layers of tests (`npm run test`, `npm run test:watch`,
`npm run test:coverage`); config lives in `vitest.config.mts`.

- **Unit tests** (`lib/*.test.ts`) cover the business logic in `lib/`. Most are
  pure (fs/fetch mocked where needed); `lib/removals.test.ts` uses the database
  harness below.
- **Integration tests** (`test/**/*.test.ts`) call route handlers and server
  actions directly against a real SQLite database. The DB is created from the
  Prisma schema by `test/global-setup.ts` in a temp directory
  (`$TMPDIR/my-cellar-vitest/cellar.db`, exposed as `DB_PATH`), and
  `test/reset-db.ts` wipes tables between tests. `test/setup.ts` mocks the
  Next.js server APIs (`next/headers` cookies, `next/cache`, `next/navigation`),
  and `test/factories.ts` provides request/record builders. Tests run serially
  (`fileParallelism: false`) because they share the database file.

## Architecture

**Stack**: Next.js 16, React 19, Prisma 7, SQLite (better-sqlite3), Tailwind CSS v4, TypeScript.

### Database

- SQLite at `cellar.db` in the project root (not `prisma/dev.db`).
- Prisma client is generated to `app/generated/prisma/` — import from `@/app/generated/prisma/client`, not `@prisma/client`.
- The adapter (`@prisma/adapter-better-sqlite3`) and datasource URL are configured in `prisma.config.ts`, not inside `schema.prisma`.
- Singleton client is in `lib/db.ts`; import `prisma` from there in API routes.

### Models

- **Wine** — core entity with rack positioning fields (`rackId`, `rackRow`, `rackCol`), drink window (`drinkFrom`, `drinkUntil`), purchase/market prices, and optional image URL.
- **Rack** — physical rack with a name and one **RackLevel** row per shelf (`position`, `front`, `back`). `rows`/`cols` are derived summaries (height, width). Wines FK to rack through slots.

### Rack slot system

Physical positions are stored as `(rackId, rackRow, rackCol)` + `quantity`. The rack layout is stored in the database (`RackLevel`) and editable from the cave page (“Casiers”) or via `POST/PATCH/DELETE /api/racks`. Each shelf can have its own front/back width, so irregular racks (e.g. a half-depth top shelf) are preserved; the designer sends `{ name, layout: [{ front, back }, …] }`. Increasing/decreasing the height adds/removes shelves at the top, and existing bottles are remapped to their new coordinates (or returned to “à ranger” after confirmation when a shelf disappears). `decodeSlot(config, rackRow, rackCol, quantity)` converts a position into human-readable shelf/side/position labels; the cave plan and the 3D view both render the same config.

### Route structure

```
app/
  page.tsx              # Home — wine list
  wines/
    page.tsx            # Wine list with filters (persisted in localStorage)
    [id]/               # Wine detail/edit
    add/                # Add wine form
  cave/
    page.tsx            # Cave overview
    CaveInteractive.tsx # Interactive rack grid
    CellarDesigner.tsx  # Rack layout designer (per-shelf dimensions)
    ShelfLevel.tsx      # Single shelf row rendering
    SlotPickerModal.tsx # Modal to pick a slot when racking a wine
    WineDetailModal.tsx # Wine detail overlay on cave map
  api/
    wines/              # GET list, POST create
    wines/[id]/         # GET, PUT, DELETE
    wines/[id]/rack     # POST — assign bottle to a slot
    wines/[id]/unrack   # POST — remove from slot
    wines/[id]/drink    # POST — decrement quantity
    wines/image-search/ # GET — image search proxy
    wines/upload-image/ # POST — upload wine image
    racks/              # Rack CRUD
    stats/              # Cellar statistics
```
