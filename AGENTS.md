# AGENTS.md — Stupid Radar Chart

## Stack

- **Next.js 15** (App Router) with TypeScript
- **React 19**, **Tailwind CSS**, **Chart.js** via `react-chartjs-2`
- **sharp** for server-side PNG generation (`/api/generate-radar`)
- **PostgreSQL** via `pg` driver for cloud persistence (`/api/charts`)
- Single-page app: `app/page.tsx` renders config form + live Chart.js preview

## Development Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # start production server
```

## Architecture

- `app/page.tsx` — client component (`'use client'`) with Chart.js UI, localStorage/URL persistence, and cloud save
- `app/api/generate-radar/route.ts` — POST endpoint that builds an SVG radar chart and converts to PNG via `sharp`
- `app/api/charts/route.ts` — POST to save config, GET to list all charts for KPI stats
- `app/api/charts/[slug]/route.ts` — GET a single saved chart by slug
- `app/s/[slug]/page.tsx` — server-rendered share page displaying a saved chart as SVG
- `lib/db.ts` — `pg` Pool singleton with `DATABASE_URL` + optional `DATABASE_SSL`
- `scripts/init-db.ts` — one-time schema creation script (run manually against target DB)

## Critical Gotchas

- The `exportServerPNG` button in `app/page.tsx` calls `/api/generate-radar` with `{title, author, deliverable_type, kpis}`. The KPI shape must match the `kpis: Record<string, number>` expected by the API.
- `sharp` is required for the API route. If it fails to install, `npm install` may need platform-specific flags.

## Modifying KPIs

KPI fields live in exactly one place now: `app/page.tsx` — the `KPI_KEYS` array and `DEFAULT_KPIS` object. The API route accepts any KPI keys dynamically, so no second file to update.
