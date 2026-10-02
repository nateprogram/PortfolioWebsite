import { cn } from "@/lib/utils";

// A section heading with its light work: the title bar running out to
// the right (.section-title::after) and a parallel pair of rails that
// leave the title, turn the corner together and trace down the section's
// left edge (.rail / .rail-partner in globals.css). `railLength` keeps
// the rails inside a short section, so they don't run into the next one.
export function SectionTitle({
  children,
  className,
  railLength,
}: {
  children: React.ReactNode;
  className?: string;
  /** In px; defaults to 260. */
  railLength?: number;
}) {
  return (
    <h2
      className={cn("section-title text-xl font-bold", className)}
      style={railLength ? ({ "--rail-len": `${railLength}px` } as React.CSSProperties) : undefined}
    >
      <span aria-hidden className="rail" />
      <span aria-hidden className="rail-partner" />
      {children}
    </h2>
  );
}
