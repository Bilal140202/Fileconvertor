export default function DocsPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-primary">Documentation preview</p>
      <h1 className="text-3xl font-semibold">Everything you need to embed Converter OS.</h1>
      <p className="text-muted-foreground">
        Full API documentation, SDK guides, and architecture notes will live here. For now, this stub summarises how client-side conversions keep data private while remaining compliant.
      </p>
      <div className="rounded-2xl border border-border/70 bg-card p-6">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            <span className="font-semibold text-foreground">Install the shell:</span> drop-in Next.js provider exposes theming, command palette hooks, and category metadata.
          </li>
          <li>
            <span className="font-semibold text-foreground">Wire converters:</span> hydrate the placeholder workspace with your own WASM workers or web pipelines.
          </li>
          <li>
            <span className="font-semibold text-foreground">Verify privacy:</span> attach your packet capture or logging integration to prove files never leave the browser.
          </li>
        </ol>
      </div>
    </div>
  );
}
