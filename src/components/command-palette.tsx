"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { converterCategories } from "@/lib/navigation";

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const openRef = React.useRef(open);
  openRef.current = open;

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(!openRef.current);
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onOpenChange]);

  const handleSelect = React.useCallback(
    (path: string) => {
      onOpenChange(false);
      router.push(path);
    },
    [router, onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search categories, tools, or actions" />
      <CommandList>
        <CommandEmpty>No matches found.</CommandEmpty>
        <CommandGroup heading="Categories">
          {converterCategories.map((category) => (
            <CommandItem
              key={category.slug}
              value={category.slug}
              onSelect={() => handleSelect(`/tools/${category.slug}`)}
            >
              <span className="font-medium">{category.title}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Open family
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Popular tools">
          {converterCategories.flatMap((category) =>
            category.tools.map((tool) => (
              <CommandItem
                key={`${category.slug}-${tool.name}`}
                value={`${category.slug}-${tool.name}`}
                onSelect={() => handleSelect(tool.href)}
              >
                <span>{tool.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {category.title}
                </span>
              </CommandItem>
            ))
          )}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
