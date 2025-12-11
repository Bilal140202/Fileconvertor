export default function RoadmapPage() {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-primary">Product roadmap</p>
      <h1 className="text-3xl font-semibold">Where Converter OS is heading next.</h1>
      <p className="text-muted-foreground">
        This lightweight roadmap keeps stakeholders in sync until the live roadmap widget ships. Everything is built with offline-first guardrails.
      </p>
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-6">
        <h2 className="text-xl font-semibold">Near term</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>GPU-accelerated background removal for massive product catalogs.</li>
          <li>Team templates for legal, creative, and engineering handoffs.</li>
          <li>Audit log export directly into preferred GRC tools.</li>
        </ul>
      </div>
      <div className="space-y-3 rounded-2xl border border-border/70 bg-card p-6">
        <h2 className="text-xl font-semibold">Exploratory</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Realtime collaboration cursors inside conversion workspaces.</li>
          <li>Hardware-backed attestation for government deployments.</li>
          <li>SDK for embedding single converters into third-party apps.</li>
        </ul>
      </div>
    </div>
  );
}
