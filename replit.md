# Campus Lost & Found

A campus-wide reporting and discovery app that helps students reconnect with lost belongings through structured reports and AI-assisted matching.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret: `GEMINI_API_KEY` — server-side Gemini matching key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/campus-lost-found` — React/Vite web app with dashboard, report forms, search, and item detail routes
- `artifacts/api-server/src/routes/items.ts` — item, dashboard, and match API routes
- `artifacts/api-server/src/lib/matching.ts` — background Gemini comparison service and conservative fallback
- `lib/db/src/schema/items.ts` — Drizzle schema for reports and match records
- `lib/api-spec/openapi.yaml` — source of truth for API contracts and generated client hooks
- `artifacts/campus-lost-found/src/index.css` — campus wayfinding theme tokens and visual system

## Architecture decisions

- The browser talks to the shared `/api` service through generated React Query hooks; it never calls Gemini directly.
- The public API uses snake_case while Drizzle keeps camelCase properties internally, so route serializers normalize the boundary.
- Matching runs asynchronously after report creation and can be re-triggered from an item detail page.
- Images are represented as URLs in the MVP; the matching service downloads remote image bytes only on the server when available.

## Product

- Students can report lost or found items with category, description, image URL, location, time, and contact details.
- The overview shows active lost/found totals and recent reports.
- Search supports text, report type, and category filters.
- Item detail pages show AI-generated potential matches, explanations, confidence scores, and resolve actions.

## User preferences

No additional preferences recorded.

## Gotchas

- The API server and web app are separate managed workflows; restart the matching workflow after server changes.
- Run API codegen after changing `lib/api-spec/openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
