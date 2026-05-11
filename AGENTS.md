# AGENTS.md — Stupid Radar Chart

## Stack

- **Next.js 15** (App Router) with TypeScript
- **React 19**, **Tailwind CSS**, **Chart.js** via `react-chartjs-2`
- **sharp** for server-side PNG generation (`/api/generate-radar`)
- Single-page app: `app/page.tsx` renders config form + live Chart.js preview

## Development Commands

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm start        # start production server
```

## Architecture

- `app/page.tsx` — client component (`'use client'`) with Chart.js UI and server export call
- `app/api/generate-radar/route.ts` — POST endpoint that builds an SVG radar chart and converts to PNG via `sharp`
- No database or external services required

## Critical Gotchas

- The `exportServerPNG` button in `app/page.tsx` calls `/api/generate-radar` with `{title, author, deliverable_type, kpis}`. The KPI shape must match the `kpis: Record<string, number>` expected by the API.
- `sharp` is required for the API route. If it fails to install, `npm install` may need platform-specific flags.

## Modifying KPIs

KPI fields live in exactly one place now: `app/page.tsx` — the `KPI_KEYS` array and `DEFAULT_KPIS` object. The API route accepts any KPI keys dynamically, so no second file to update.
