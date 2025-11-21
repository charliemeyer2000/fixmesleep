export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            fixmesleep · MCP Server
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Secure tools for Poke
          </h1>
          <p className="text-base text-muted-foreground">
            This app only exposes Model Context Protocol tools at{" "}
            <code className="rounded bg-muted px-1.5 py-1 text-sm">/api/mcp</code>. All
            requests must include{" "}
            <code className="rounded bg-muted px-1.5 py-1 text-sm">X-Poke-Api-Key</code> and
            are logged to Postgres. Use the MCP Inspector locally with{" "}
            <code className="rounded bg-muted px-1.5 py-1 text-sm">pnpm dev</code>, then deploy to
            Vercel at{" "}
            <code className="rounded bg-muted px-1.5 py-1 text-sm">
              mcp.fixmysleep.charliemeyer.xyz
            </code>
            .
          </p>
        </div>

        <section className="grid gap-6 md:grid-cols-2">
          <article className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Health check</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              <code className="rounded bg-muted px-1.5 py-1 text-sm">/api/health</code> returns a
              simple status payload for deployment checks and uptime monitors.
            </p>
          </article>
          <article className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Tools</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
              <li>fetch_daily_metrics</li>
              <li>refresh_and_store_metrics</li>
              <li>list_cached_metrics</li>
              <li>get_metric_summary</li>
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}
