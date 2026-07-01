@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
npm run seed     # Seed database (prisma/seed.ts)
```

Prisma migrations:

```bash
npx prisma migrate dev   # Create and apply migration
npx prisma generate      # Regenerate client after schema changes
```

No test suite exists in this project.

## Architecture

**Stack**: Next.js 16, React 19, Prisma 7, SQLite (better-sqlite3), Tailwind CSS v4, TypeScript.

### Database

- SQLite at `cellar.db` in the project root (not `prisma/dev.db`).
- Prisma client is generated to `app/generated/prisma/` — import from `@/app/generated/prisma/client`, not `@prisma/client`.
- The adapter (`@prisma/adapter-better-sqlite3`) and datasource URL are configured in `prisma.config.ts`, not inside `schema.prisma`.
- Singleton client is in `lib/db.ts`; import `prisma` from there in API routes.

### Models

- **Wine** — core entity with rack positioning fields (`rackId`, `rackRow`, `rackCol`), drink window (`drinkFrom`, `drinkUntil`), purchase/market prices, and optional image URL.
- **Rack** — physical rack with name, rows, and cols. Wines FK to rack.

### Rack slot system

Physical positions are stored as `(rackId, rackRow, rackCol)` + `quantity`. The rack layout (front/back shelves per level) is defined statically in `lib/rack-configs.ts` as `RACK_CONFIGS`. `decodeSlot()` converts `(rackName, rackRow, rackCol, quantity)` into human-readable shelf/side/position labels.

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
