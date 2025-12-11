"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const mode = (theme === "system" ? resolvedTheme : theme) ?? "light";
  const isDark = mode === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <Sun className={`h-4 w-4 transition-all ${isDark ? "scale-0 opacity-0" : "scale-100"}`} />
      <Moon className={`absolute h-4 w-4 transition-all ${isDark ? "scale-100" : "scale-0 opacity-0"}`} />
      {!mounted && <span className="sr-only">Loading preference</span>}
    </Button>
  );
}
