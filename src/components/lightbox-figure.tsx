"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Click-to-zoom image figure. The in-flow thumbnail is a button; clicking it
// (or pressing Enter/Space) opens a full-viewport overlay so text that was
// unreadable at thumbnail size becomes legible. Escape or background click
// closes. Prevents body scroll while open.
//
// The overlay is portaled to <body>. Figures sit inside BlurFade wrappers,
// and any ancestor with a `filter` or `transform` becomes the containing
// block for `position: fixed`, which would clip the overlay to the figure.

export function Lightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  // Parents pass an inline arrow; keep the latest in a ref so the
  // focus/scroll-lock effect below runs once per open, not per render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
      // Only one focusable control inside, so Tab just stays on it.
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
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
        className="max-h-[92vh] max-w-[95vw] cursor-default rounded-md object-contain shadow-2xl animate-in zoom-in-95"
      />
    </div>,
    document.body
  );
}

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
            loading="lazy"
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

      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

// A row of phone screenshots (mobile apps). Each one opens the same
// lightbox. Tall 1080x2125 captures would be ~1300px tall full-width, so
// they sit side by side in device frames instead.
export function PhoneGallery({
  shots,
  caption,
}: {
  shots: ReadonlyArray<{ src: string; alt: string }>;
  caption?: string;
}) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const active = openIdx === null ? null : shots[openIdx];

  return (
    <>
      <figure className="flex flex-col gap-3">
        <div
          className={cn(
            "grid gap-3 sm:gap-4 rounded-xl border border-border bg-[radial-gradient(ellipse_at_center,var(--brand-soft),transparent_75%)] p-4 sm:p-6",
            shots.length >= 3 ? "grid-cols-3" : "grid-cols-2"
          )}
        >
          {shots.slice(0, 3).map((shot, i) => (
            <button
              key={shot.src}
              type="button"
              onClick={() => setOpenIdx(i)}
              aria-label={`Enlarge screenshot: ${shot.alt}`}
              className={cn(
                "group relative overflow-hidden rounded-[1.1rem] border-[3px] border-zinc-800 bg-black shadow-xl transition-transform duration-300 motion-safe:hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                shots.length >= 3 && i === 1 && "sm:-translate-y-3 motion-safe:sm:hover:-translate-y-4"
              )}
            >
              <img
                src={shot.src}
                alt={shot.alt}
                loading="lazy"
                className="aspect-[1080/2125] w-full object-cover object-top transition-opacity group-hover:opacity-90"
              />
            </button>
          ))}
        </div>
        {caption && (
          <figcaption className="text-xs text-pretty leading-relaxed text-muted-foreground">
            {caption}
          </figcaption>
        )}
      </figure>
      {active && (
        <Lightbox
          src={active.src}
          alt={active.alt}
          onClose={() => setOpenIdx(null)}
        />
      )}
    </>
  );
}
