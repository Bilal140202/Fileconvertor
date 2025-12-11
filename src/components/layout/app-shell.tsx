"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  ExternalLink,
  Menu,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/command-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { converterCategories } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [navOpen, setNavOpen] = React.useState(false);

  const breadcrumbItems = React.useMemo(() => buildBreadcrumbs(pathname), [pathname]);
  const nav = <CategoryNav pathname={pathname} onNavigate={() => setNavOpen(false)} />;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Sheet open={navOpen} onOpenChange={setNavOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] px-4 py-6">
                <CategoryNav pathname={pathname} onNavigate={() => setNavOpen(false)} />
              </SheetContent>
            </Sheet>
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                λ
              </span>
              <span>Converter OS</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            <Button
              variant="outline"
              className="hidden items-center gap-2 text-sm text-muted-foreground md:flex"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-4 w-4" />
              Quick search
              <kbd className="ml-2 rounded border border-border/80 bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setCommandOpen(true)}
            >
              <Search className="h-5 w-5" />
              <span className="sr-only">Open search</span>
            </Button>
            <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
              <Link href="/roadmap">
                <Compass className="mr-1.5 h-4 w-4" /> Roadmap
              </Link>
            </Button>
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/docs" className="flex items-center gap-1">
                Docs <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-8 px-4 py-6 lg:px-8">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          {nav}
        </aside>
        <div className="flex flex-1 flex-col">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              {breadcrumbItems.map((item, index) => (
                <BreadcrumbItem key={item.href}>
                  {index === breadcrumbItems.length - 1 ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <Link href={item.href} className="text-muted-foreground transition hover:text-foreground">
                      {item.label}
                    </Link>
                  )}
                  {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <main className="flex-1 pb-12">{children}</main>
        </div>
      </div>
    </div>
  );
}

type CategoryNavProps = {
  pathname: string;
  onNavigate?: () => void;
};

function CategoryNav({ pathname, onNavigate }: CategoryNavProps) {
  return (
    <nav className="flex flex-col gap-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Converter families</p>
        <div className="mt-3 flex flex-col gap-2">
          {converterCategories.map((category) => {
            const Icon = category.icon;
            const href = `/tools/${category.slug}`;
            const active = pathname?.startsWith(href);

            return (
              <Link
                key={category.slug}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-start gap-3 rounded-2xl border px-3 py-3 transition",
                  active
                    ? "border-primary/30 bg-primary/5 text-foreground shadow-sm"
                    : "border-transparent bg-muted/40 text-muted-foreground hover:bg-muted/70"
                )}
              >
                <span className="mt-0.5 rounded-xl bg-background/80 p-2 text-primary shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex flex-1 flex-col">
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {category.title}
                    {category.badge && <Badge variant="outline">{category.badge}</Badge>}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {category.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Everything runs locally</p>
        <p className="mt-1 text-sm">
          Drop files into any converter—packets never touch our servers. Ideal for regulated teams.
        </p>
        <Button asChild size="sm" className="mt-3 w-full">
          <Link href="/roadmap" onClick={onNavigate}>
            Explore roadmap
          </Link>
        </Button>
      </div>
    </nav>
  );
}

function buildBreadcrumbs(pathname: string | null): { label: string; href: string }[] {
  if (!pathname) return [{ label: "Home", href: "/" }];
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [{ label: "Home", href: "/" }];
  let route = "";

  for (const segment of segments) {
    route += `/${segment}`;
    if (segment === "tools") {
      crumbs.push({ label: "Tools", href: route });
      continue;
    }

    const match = converterCategories.find((category) => category.slug === segment);
    crumbs.push({ label: match ? match.title : capitalize(segment), href: route });
  }

  return crumbs;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, " ");
}
