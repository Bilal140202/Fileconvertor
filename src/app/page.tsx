import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { converterCategories } from "@/lib/navigation";

const heroPoints = [
  "Local-first WebAssembly workers keep payloads offline",
  "Audit-friendly logs prove files never leave your browser",
  "Granular workspace roles for legal, creative, and eng",
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="grid gap-8 rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-8 shadow-soft lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Badge variant="outline" className="w-fit px-3 py-1 text-xs uppercase tracking-wide">
            Client-side privacy
          </Badge>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              The conversion shell for teams who can’t afford to leak files.
            </h1>
            <p className="text-lg text-muted-foreground">
              Converter OS runs entirely in-browser using WebAssembly and WebGPU. Security teams get verifiable privacy, while producers get a cohesive set of converters for every media and data format.
            </p>
          </div>
          <ul className="grid gap-3 text-sm text-foreground/90 sm:grid-cols-2">
            {heroPoints.map((point) => (
              <li key={point} className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-success" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/tools/images">Launch workspace</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/roadmap">View roadmap</Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="gap-2">
              <Link href="/docs">
                Read docs <Sparkles className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-border/70 bg-card p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Privacy telemetry</p>
            <Badge variant="success">Healthy</Badge>
          </div>
          <div className="mt-6 grid gap-4">
            <Metric label="Files processed locally" value="8,420" trend="↑ 18%" />
            <Metric label="Server round trips avoided" value="12,308" trend="↑ 31%" />
            <Metric label="Review-ready audit logs" value="24" trend="Synced" />
          </div>
          <div className="mt-6 rounded-xl border border-dashed border-success/40 bg-success/5 p-4 text-sm text-muted-foreground">
            <p className="font-semibold text-success">Zero-knowledge guarantee</p>
            <p className="mt-1">
              When a teammate drags a file in, it is transformed locally. Packet captures prove nothing leaves the device.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Choose a converter family</p>
            <h2 className="text-2xl font-semibold">Every format shares the same workspace language.</h2>
            <p className="text-muted-foreground">
              Cards preview the tooling available today. Click through to pin custom checklists, drop files, and review conversion recipes with your team.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/tools/documents">Continue where you left off</Link>
          </Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {converterCategories.map((category) => (
            <Card key={category.slug} className="flex h-full flex-col">
              <CardHeader className="space-y-3">
                <Badge variant="outline" className="w-fit">
                  {category.title}
                </Badge>
                <CardTitle className="text-xl">{category.description}</CardTitle>
                <CardDescription>{category.highlights.join(" • ")}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between gap-4">
                <div className="space-y-3">
                  {category.tools.map((tool) => (
                    <div key={tool.name} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2">
                      <div>
                        <p className="text-sm font-semibold">{tool.name}</p>
                        <p className="text-xs text-muted-foreground">{tool.summary}</p>
                      </div>
                      <Badge variant={computeStatusVariant(tool.status)}>{statusLabel(tool.status)}</Badge>
                    </div>
                  ))}
                </div>
                <Button asChild className="w-full">
                  <Link href={`/tools/${category.slug}`}>Open {category.title}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

type MetricProps = {
  label: string;
  value: string;
  trend: string;
};

function Metric({ label, value, trend }: MetricProps) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">
          {value}
        </p>
      </div>
      <div className="flex items-center gap-1 text-sm text-success">
        <CheckCircle2 className="h-4 w-4" />
        {trend}
      </div>
    </div>
  );
}

function computeStatusVariant(status: "available" | "beta" | "soon") {
  if (status === "available") return "success" as const;
  if (status === "beta") return "outline" as const;
  return "warning" as const;
}

function statusLabel(status: "available" | "beta" | "soon") {
  if (status === "available") return "Ready";
  if (status === "beta") return "Beta";
  return "Coming";
}
