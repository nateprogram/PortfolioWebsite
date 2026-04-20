"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="link"
      size="icon"
      aria-label={
        !mounted
          ? "Toggle theme"
          : isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className={cn(className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      suppressHydrationWarning
    >
      {mounted ? (
        isDark ? (
          <MoonIcon className="h-full w-full" />
        ) : (
          <SunIcon className="h-full w-full" />
        )
      ) : (
        <span className="block h-full w-full" aria-hidden />
      )}
    </Button>
  );
}
