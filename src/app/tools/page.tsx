import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { converterCategories } from "@/lib/navigation";

export default function ToolsIndexPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Badge variant="outline" className="w-fit">Tools library</Badge>
        <h1 className="text-3xl font-semibold">Pick a converter family.</h1>
        <p className="text-muted-foreground">
          Each workspace ships with privacy guardrails, shared recipes, and offline-ready GPU acceleration.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {converterCategories.map((category) => (
          <Card key={category.slug} className="flex h-full flex-col">
            <CardHeader>
              <CardTitle className="text-xl">{category.title}</CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button asChild className="w-full">
                <Link href={`/tools/${category.slug}`}>Open workspace</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
