"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ThemeButton({ className }: { className?: string }) {
  const { setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon-lg"
      className={cn("size-11", className)}
      title="Switch between light and dark mode"
      onClick={() =>
        setTheme(
          document.documentElement.classList.contains("dark")
            ? "light"
            : "dark",
        )
      }
    >
      <span className="relative size-4" aria-hidden="true">
        <Sun className="absolute inset-0 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute inset-0 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
      </span>
      <span className="sr-only dark:hidden">Switch to dark mode</span>
      <span className="sr-only hidden dark:inline">Switch to light mode</span>
    </Button>
  );
}
