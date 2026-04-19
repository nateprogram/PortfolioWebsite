"use client";

import { Button } from "@/components/ui/button";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="link"
      size="icon"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(className)}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <SunIcon className={cn("h-full w-full", isDark && "hidden")} />
      <MoonIcon className={cn("h-full w-full", !isDark && "hidden")} />
    </Button>
  );
}
