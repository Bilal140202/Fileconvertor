import Link from "next/link";
import { ArrowRight, Check, UploadCloud } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ConverterCategory } from "@/lib/navigation";

type ToolLayoutProps = {
  category: ConverterCategory;
};

const defaultChecklist = [
  "Select source files",
  "Choose conversion recipe",
  "Review privacy guardrails",
  "Share verification log",
];

export function ToolLayout({ category }: ToolLayoutProps) {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Badge variant="outline">{category.title}</Badge>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{category.title} workspace</h1>
            <p className="text-muted-foreground lg:max-w-2xl">{category.description}</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/docs">View implementation Docs</Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {category.highlights.map((highlight) => (
            <Badge key={highlight} variant="outline" className="border-dashed">
              {highlight}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Readiness checklist</CardTitle>
              <CardDescription>Mark steps for your team. Coming soon: automated validation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {defaultChecklist.map((item) => (
                <ChecklistItem key={item}>{item}</ChecklistItem>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Available tools</CardTitle>
              <CardDescription>Launch converters optimized for this format family.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.tools.map((tool) => (
                <div key={tool.name} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-center justify-between text-sm font-medium">
                    {tool.name}
                    <Badge variant={tool.status === "available" ? "success" : tool.status === "beta" ? "outline" : "warning"}>
                      {tool.status === "available" ? "Ready" : tool.status === "beta" ? "Beta" : "Soon"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{tool.summary}</p>
                  <Button asChild variant="link" className="mt-2 h-auto px-0 text-xs font-semibold">
                    <Link href={tool.href}>
                      Resume workflow <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="h-full min-h-[320px]">
            <CardHeader>
              <CardTitle>Conversion workspace</CardTitle>
              <CardDescription>Drop files, pick outputs, and capture logs. GPUs + Web Workers spin up in the browser.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
                <UploadCloud className="mx-auto h-10 w-10 text-primary" />
                <p className="text-sm font-semibold">Drop assets or paste a URL</p>
                <p className="text-xs text-muted-foreground">
                  Nothing is uploaded. Watch conversion logs stream in real-time below.
                </p>
                <Button size="sm" className="mx-auto w-full max-w-xs">
                  Browse files
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input placeholder="Source format (e.g. HEIC)" className="border-primary/30" />
                <Input placeholder="Target format (e.g. JPG)" className="border-primary/30" />
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">Conversion log</p>
                <p className="mt-1">Awaiting files… this area will stream progress, GPU allocation, and compliance signatures.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({ children }: { children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-border/70 px-3 py-2 text-sm font-medium">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-border/80 bg-background">
        <Check className="h-3 w-3 text-muted-foreground" />
      </span>
      <span>{children}</span>
    </label>
  );
}

