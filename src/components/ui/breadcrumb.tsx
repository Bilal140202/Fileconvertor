import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Breadcrumb = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <nav aria-label="breadcrumb" className={cn("flex items-center text-sm", className)} {...props} />
);

export const BreadcrumbList = ({ className, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
  <ol className={cn("flex items-center gap-2 text-muted-foreground", className)} {...props} />
);

export const BreadcrumbItem = ({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
  <li className={cn("flex items-center gap-2", className)} {...props} />
);

export const BreadcrumbLink = ({ className, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a className={cn("text-muted-foreground transition hover:text-foreground", className)} {...props} />
);

export const BreadcrumbSeparator = () => (
  <ChevronRight className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
);

export const BreadcrumbPage = ({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span className={cn("font-medium text-foreground", className)} {...props} />
);
