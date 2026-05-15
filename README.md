# Hadith Path

Isnad chain analyzer — paste a hadith, and the app separates the isnad from the matn, extracts every narrator in order, and visualizes the transmission chain as an interactive graph.

## What it does

1. **Text normalization** — cleans and normalizes Arabic input (diacritics, Unicode variants)
2. **Isnad / matn separation** — splits the chain of transmission from the hadith body using Claude AI
3. **Narrator extraction** — identifies each narrator name and their position in the chain
4. **Chain visualization** — renders the isnad as a directed graph with narrator bio cards

The app runs entirely in the browser. Your Anthropic API key is stored locally and never sent anywhere except the Anthropic API directly.

## Tech stack

- **React + TanStack Router** — frontend, file-based routing
- **Hono + oRPC** — backend API with end-to-end type safety
- **Drizzle + SQLite/Turso** — database
- **Better-Auth** — authentication
- **Turborepo + Bun** — monorepo build system
- **Biome** — linting and formatting

## Getting started

```bash
bun install
```

Copy the env file and fill in your credentials:

```bash
cp apps/server/.env.example apps/server/.env
```

Push the database schema:

```bash
bun run db:push
```

Start the dev server:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173). Add your Anthropic API key in the settings panel to enable AI features.

## Project structure

```
hadith-path/
├── apps/
│   ├── web/        # React frontend (TanStack Router)
│   └── server/     # Hono + oRPC API
└── packages/
    ├── ui/         # Shared shadcn/ui components
    ├── api/        # API layer and routers
    ├── auth/       # Authentication config
    └── db/         # Drizzle schema and migrations
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start all apps in dev mode |
| `bun run build` | Build all apps |
| `bun run check-types` | TypeScript check across all packages |
| `bun run test` | Run all tests |
| `bun run check` | Biome lint + format fix |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |
