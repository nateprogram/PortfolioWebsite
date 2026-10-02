"use client";

import { Printer } from "lucide-react";

// window.print() blocks the page until the print dialog closes. Called
// straight from the click, that whole wait counts against the click
// (dev tools flagged a 6s interaction). Waiting one frame lets the click
// finish and paint first; the dialog then opens on its own task.
function printAfterPaint() {
  requestAnimationFrame(() => setTimeout(() => window.print(), 0));
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={printAfterPaint}
      className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-xs font-medium text-foreground/90 shadow-sm hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Printer className="size-3.5" aria-hidden />
      Print
    </button>
  );
}
