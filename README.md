# My Cellar

Personal wine cellar management application. It catalogs wines and vintages, tracks quantities and storage locations, displays drinking windows and cellar statistics, and keeps a history of bottles that have left the cellar.

## Features

- dashboard with statistics, estimated value, and breakdowns by color and region;
- wine and vintage records with producer, appellation, grape varieties, prices, notes, and food pairings;
- quantity tracking and storage by rack, row, and column;
- drinking-window estimates, with support for manually entered periods;
- maps of French appellations and foreign origins;
- history of bottles consumed, gifted, removed, or adjusted;
- password authentication and token-protected API access;
- bottle-image upload and storage.

## Stack

- [Next.js](https://nextjs.org/) 16 with the App Router;
- React 19 and TypeScript;
- Prisma 7 with SQLite;
- Tailwind CSS 4;
- Vitest for testing;
- Docker and GitHub Actions for delivery.

## Requirements

- Node.js 20 or newer;
- npm;
- native build dependencies for `better-sqlite3` when the module must be compiled locally.

## Local setup

```bash
git clone <repository-url>
cd my-cellar
npm ci --legacy-peer-deps
npx prisma generate
```

Create a `.env.local` file at the project root:

```dotenv
DATABASE_URL="file:./cellar.db"
DB_PATH="/absolute/path/to/cellar.db"
AUTH_PASSWORD="a-local-password"
AUTH_SECRET="a-long-secret-value"
```

`DB_PATH` is used by the application to open the SQLite database. In development it can be omitted; the application then uses `cellar.db` at the project root. Never commit `.env.local`, a database containing personal data, or an API token.

Initialize the database and optional sample data:

```bash
npx prisma migrate deploy
npm run seed
```

Use the seed only with a development database. Back up any real database before running migrations or imports.

## Development

```bash
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000).

Useful commands:

```bash
npm run lint             # ESLint checks
npm run test             # Vitest suite
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Tests with coverage
npm run build            # Production Next.js build
npm run start            # Start the production build
```

After changing the Prisma schema:

```bash
npx prisma migrate dev --name description-of-the-change
npx prisma generate
```

The generated Prisma client in `app/generated/prisma` is ignored by Git and must be regenerated in each new environment.

## Project structure

```text
app/                 Next.js pages, layouts, and API routes
components/          UI components and visualizations
lib/                 Data access, authentication, and domain logic
prisma/              Schema, migrations, and seed scripts
public/              Static assets and bottle images
scripts/             Import, image, and icon-generation tools
test/                Test configuration and utilities
.github/workflows/   CI and Docker deployment workflows
```

The database is SQLite. The main records are organized around `Wine`, `WineVintage`, `WineVintageSlot`, `Rack`, and `WineHistory`.

## Docker

Build and run the application locally:

```bash
docker compose up --build
```

`docker-compose.yml` stores the database in the `cellar-db` volume and images in the `cellar-images` volume. `AUTH_PASSWORD` and `AUTH_SECRET` must be supplied through the Docker environment, for example with a local, uncommitted `.env` file.

The container automatically runs `prisma migrate deploy` at startup. Migrations must therefore be present in `prisma/migrations` before deploying a new version.

## Tests and quality

GitHub Actions runs on pushes to `main`, pull requests, and manual dispatches. It uses Node.js 20, generates the Prisma client, then runs ESLint and the Vitest coverage suite.

```bash
npm ci --legacy-peer-deps
npx prisma generate
npm run lint
npm run test:coverage
```

## Deployment

A push to `main` triggers `.github/workflows/deploy.yml`:

1. the Docker image is built for `linux/amd64`;
2. it is published to Docker Hub with `latest`, version, and commit tags;
3. the Mac mini self-hosted runner pulls the new image;
4. the `my-cellar` service is restarted through the production Docker stack.

Deployment requires the GitHub secrets `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`, as well as a correctly configured self-hosted runner. Persistent data must not live only inside the container; use the production volumes for the database and images.

## Production access

The production instance is available at [cellar.julienfroidefond.com](https://cellar.julienfroidefond.com).

The protected export is available through `GET /api/export` with a token provided by the local `CELLAR_API_TOKEN` variable:

```bash
curl \
  -H "Authorization: Bearer ${CELLAR_API_TOKEN}" \
  https://cellar.julienfroidefond.com/api/export
```

This access is intended for read-only audits and exports. Never put the token in the README, repository, logs, or reports. Any production data change must be targeted, explicitly authorized, and followed by a read-back from production for verification.

## Backups

The SQLite database and image directory are persistent data. Before a migration or maintenance operation:

- back up the SQLite database;
- back up the image volume;
- confirm that the Docker volumes belong to the intended production instance;
- check the application after restarting and re-read important records.

## License

Private project for personal use.
