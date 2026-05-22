# Hadith Path

Isnad chain analyzer — paste a hadith, and the app separates the isnad from the matn, extracts every narrator in order, matches them against a biographical database, and visualizes the transmission chain as an interactive RTL graph.

## What it does

1. **Text normalization** — cleans Arabic input, strips diacritics, normalizes Unicode variants before any processing
2. **Isnad / matn separation** — uses Claude AI to split the chain of transmission from the hadith body; the split point can be manually adjusted
3. **Narrator extraction** — identifies each narrator name and their position in the chain using Claude AI
4. **Narrator disambiguation** — matches extracted names against the narrator database with trigram similarity scoring; low-confidence and ambiguous matches are flagged for manual review with a guided step-through flow
5. **Narrator database** — bundled biographical database of classical hadith narrators with Arabic names, transliteration, dates, generation, reliability grades, teacher/student relationships, and source collections; supports custom narrator entries
6. **Isnad chain visualization** — renders the chain as a right-to-left reactflow graph; each node shows the narrator's name and reliability grade; clicking a node opens a read-only biography panel
7. **Manual correction editor** — drag a divider to reposition the isnad/matn boundary; the divider snaps to word boundaries in real time; corrected splits are marked with a badge
8. **Multi-variant comparison** — load up to five versions of the same hadith and overlay their chains; narrators shared across versions merge into a single node, divergences branch visually; edges are color-coded per variant with a legend
9. **Matn diff view** — compare the hadith body across loaded variants word by word; matched words are neutral, substitutions and additions are annotated with the variant's color; toggle between inline and side-by-side layouts
10. **Export** — save the full session as JSON and restore it later; export the chain visualization as a JPG; export the complete analysis (split view, narrator table, chain diagram, diff view) as a multi-page PDF

The app runs entirely in the browser. Your Anthropic API key is stored locally and never sent anywhere except the Anthropic API directly.

## Tech stack

- **React + TanStack Router** — frontend, file-based routing
- **Hono + oRPC** — backend API with end-to-end type safety
- **Drizzle + SQLite/Turso** — database
- **Better-Auth** — authentication
- **reactflow + dagre** — interactive chain graph with RTL layout
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
    ├── ui/         # Shared components
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
