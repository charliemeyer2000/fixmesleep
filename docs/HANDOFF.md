# Deployment & Ops Checklist

## Prerequisites

1. **Neon Postgres**
   - Only two databases are used: `fixmesleep-dev` (development/preview) and `fixmesleep` (production).
   - No additional Neon branches are required—Drizzle migrations flow dev ➜ prod.
   - Note both `postgres://` URLs and set `DATABASE_URL` in each environment.

2. **Vercel Projects**
   - Already linked via `vc link`:
     - `apps/mcp-server` → **fixmesleep-mcp**
     - `apps/data-site` → **fixmesleep-dashboard**
   - Build command auto-detected (`next build`). No additional overrides needed.

3. **DNS**
   - `mcp.fixmysleep.charliemeyer.xyz` → MCP app’s Vercel project.
   - `data.fixmysleep.charliemeyer.xyz` → data-site project.
   - Add the apex domain (`charliemeyer.xyz`) to the Vercel team, then run `vc domains add <subdomain> <project>` from each app to provision SSL + CNAME records.

## Environment Variables

| Variable | Description | Apps | Status |
| --- | --- | --- | --- |
| `DATABASE_URL` | Neon connection string | Both | ✅ Added via `vc env add` (dev/preview/prod) |
| `POKE_API_KEY` | Shared secret for MCP | MCP | ✅ Generated with `openssl rand -base64 32` and stored via `vc env add` |
| `AI_GATEWAY_API_KEY` | Vercel AI Gateway key | Data-site | ✅ Added (all envs) |
| `ANTHROPIC_API_KEY` | Direct Anthropic key fallback | Data-site | ✅ Added (all envs) |
| `ULTRAHUMAN_API_TOKEN` | Ultrahuman Partner API token | Both | ✅ Added (dev/preview/prod) |
| `ULTRAHUMAN_ACCESS_CODE` | Ultrahuman access code | Both | ✅ Added (all envs) |
| `MCP_BASE_URL` | Public MCP URL | Data-site | ⛔ Populate after DNS |
| `ANTHROPIC_MODEL` | Optional Claude model name | Data-site | optional |

### Syncing envs locally

```bash
# MCP server envs
cd apps/mcp-server
vc env pull development

# Data-site envs
cd ../data-site
vc env pull development
```

## Deploying MCP (`apps/mcp-server`)

1. Set the env vars above in Vercel.
2. Deploy the Next.js app (MCP handler lives at `/api/mcp`).
3. Verify locally using the MCP Inspector:
   ```bash
   pnpm dlx @modelcontextprotocol/inspector@latest http://localhost:3000 undefined
   ```
4. Test tools: `fetch_daily_metrics`, `refresh_and_store_metrics`, `list_cached_metrics`, `get_metric_summary`.
5. Configure Poke with the deployed URL (`https://mcp.fixmysleep.charliemeyer.xyz/api/mcp`) and provide `POKE_API_KEY`.

## Deploying Data Site (`apps/data-site`)

1. Set env vars (db, Ultrahuman token, MCP URL, AI creds).
2. Deploy via Vercel (Next.js 16).
3. Post-deploy checks:
   - Load `/` and run “Refresh data”. Confirm metrics populate.
   - Visit `/logs` to ensure MCP log ingestion works.
   - Visit `/chat`, ask a question, and confirm Claude responds.

## Local Development

```bash
pnpm install
pnpm db:push      # sync schema
pnpm dev --filter=mcp-server
pnpm dev --filter=data-site
```

Log output is written to the `poke_action_logs` table via the shared Drizzle helpers. Use `pnpm db:generate` if the schema changes.

## Ultrahuman data verification

Use the CLI script to confirm upstream data before invoking MCP tools:

```bash
ULTRAHUMAN_API_TOKEN=... pnpm verify:ultrahuman
```

The helper calls `daily_metrics` for the last 3 days and prints sleep totals/readiness values. If it exits with `[fail]`, double-check that the token/access code have been provisioned inside the Ultrahuman app and that the API is returning JSON responses.

## GitHub → Vercel auto-deploys

1. Push this repo to GitHub (`origin` already points to `https://github.com/charliemeyer2000/fixmesleep.git`).
2. In the Vercel dashboard, open each project and connect it to that Git repo.
3. Set the project’s `Root Directory`:
   - `fixmesleep-mcp` → `apps/mcp-server`
   - `fixmesleep-dashboard` → `apps/data-site`
4. Enable “Deploy Hooks” or the default `main` branch auto-deploy so every push triggers CI/CD (no need for `vc deploy` per app).

Once the domain ownership issue is resolved, assign:

```bash
cd apps/mcp-server && vc domains add mcp.fixmysleep.charliemeyer.xyz
cd ../data-site   && vc domains add data.fixmysleep.charliemeyer.xyz
```

Vercel will then output the CNAME records to add at your DNS host.
