---
name: API contract boundaries
description: Lessons for this workspace's generated API and Drizzle response boundaries.
---

Generated Zod clients derive response names from operation IDs, so direct object response schemas can collide with generated type exports; prefer a 204 response for fire-and-forget triggers or use non-colliding response shapes.

**Why:** The generator emits both runtime Zod schemas and TypeScript response types, and the shared barrel re-exports both.

**How to apply:** After changing OpenAPI, run codegen and the library typecheck before adding server routes. Serialize Drizzle camelCase records into the snake_case API contract before parsing responses.

Google may retire the model named in an older product brief for new API users; keep the configured model current and retain bounded retries plus a conservative fallback for temporary provider unavailability.

**Why:** The requested Gemini model returned a retirement error, and its replacement then returned a transient high-demand response during verification.

**How to apply:** Treat model IDs as provider configuration, not a permanent invariant; inspect server logs after a real match run before calling the AI path healthy.