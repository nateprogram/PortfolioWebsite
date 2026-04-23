"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Click-to-zoom image figure. The in-flow thumbnail is a button; clicking it
// (or pressing Enter/Space) opens a full-viewport overlay so text that was
// unreadable at thumbnail size becomes legible. Escape or background click
// closes. Prevents body scroll while open.

export function LightboxFigure({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <figure className={cn("flex flex-col gap-2", className)}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Enlarge figure: ${alt}`}
          className="group relative block w-full overflow-hidden rounded-xl border border-border bg-muted/30 ring-1 ring-inset ring-white/[0.04] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-auto bg-background transition-opacity group-hover:opacity-90"
          />
          <span className="pointer-events-none absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-background/80 px-2 py-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground shadow-sm backdrop-blur-sm">
            <Maximize2 className="size-3" aria-hidden />
            Click to enlarge
          </span>
        </button>
        {caption && (
          <figcaption className="text-xs text-pretty leading-relaxed text-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close enlarged figure"
            className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="size-3.5" aria-hidden />
            Close
          </button>
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] max-w-[95vw] cursor-default rounded-md object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
