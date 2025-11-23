# fixmesleep

fixmesleep is a Turborepo monorepo that packages an Ultrahuman-aware MCP server, a Next.js dashboard, and shared TypeScript tooling for storing and visualizing longitudinal health data.

- **MCP server (`apps/mcp-server`)** – Next.js 16 API route that exposes secure MCP tools (`fetch_daily_metrics`, `refresh_and_store_metrics`, `list_cached_metrics`, `get_metric_summary`) guarded by an API key.
- **Data site (`apps/data-site`)** – Next.js 16 dashboard with Tailwind/shadcn UI, Recharts visualizations, log views, and an AI chat experience powered by the Vercel AI SDK + Anthropic through the AI Gateway.
- **Shared packages** – `@repo/ultrahuman-client` (typed fetcher), `@repo/db` (Drizzle schema + helpers), shared UI + config packages.

Ultrahuman API reference material lives in `ULTRAHUMAN_DOCS.md`.

## Repository layout

| Path | Description |
| --- | --- |
| `apps/mcp-server` | MCP handler + health check routes deployed to Vercel |
| `apps/data-site` | Public-facing dashboard, logs view, and AI chat UI |
| `packages/ultrahuman-client` | Zod-validated Ultrahuman API client + helpers |
| `packages/db` | Drizzle schema, migrations, and data access helpers |
| `packages/ui`, `packages/eslint-config`, `packages/typescript-config` | Turborepo starter packages retained for shared primitives/config |
| `docs/HANDOFF.md` | Deployment/ops checklist |
| `scripts/verify-ultrahuman.ts` | CLI smoke test for Ultrahuman data ingestion |

## Environment variables

Duplicate `.env.example`, fill it locally, and sync to Vercel with `vc env pull` / `vc env add`:

| Variable | Description |
| --- | --- |
| `ULTRAHUMAN_API_TOKEN` | Partner API token (see Ultrahuman docs) |
| `POKE_API_KEY` | Shared secret header for MCP requests |
| `DATABASE_URL` | Neon Postgres connection string |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway token (preferred Anthropic credential) |
| `ANTHROPIC_API_KEY` | Direct Anthropic key fallback |
| `MCP_BASE_URL` | Public MCP URL consumed by the dashboard |
| `ANTHROPIC_MODEL` | Optional Claude model override (`claude-3-haiku-20240307` default) |

### Database environments

- `fixmesleep-dev` – Development/preview Neon database for local work and Vercel preview deployments.
- `fixmesleep` – Production database for Vercel production deployments.

No additional Neon branches are used—schema changes flow dev → prod exclusively through Drizzle migrations.

### Tooling & scripts

- `pnpm dev` – Run both apps through Turborepo.
- `pnpm turbo run dev --filter=apps/mcp-server` – Focused MCP server dev loop.
- `pnpm turbo run dev --filter=apps/data-site` – Focused dashboard dev loop.
- `pnpm turbo run lint`, `pnpm turbo run check-types`, `pnpm turbo run build` – Repo-wide quality gates.
- `pnpm verify:ultrahuman` – Fetch the last 3 days of Ultrahuman metrics via `@repo/ultrahuman-client` and print sleep/readiness summaries. Use this whenever rotating tokens/access codes to ensure the upstream API responds before touching the MCP/database layers.

## Development workflow

```sh
pnpm install
pnpm dev              # full stack
pnpm turbo run lint
pnpm turbo run check-types
```

Environment variables should be managed through the Vercel CLI (`vc env pull` / `vc env add`) rather than committing `.env` files.

## Deployment

Refer to `docs/HANDOFF.md` for the deployment checklist covering Neon provisioning, Vercel project linking, GitHub auto-deploys, the MCP Inspector workflow, and custom domain setup.
