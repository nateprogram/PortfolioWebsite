import { cn } from "@/lib/utils";

// A section heading with its light work: the title bar running out to
// the right (.section-title::after) and a parallel pair of rails that
// leave the title, turn the corner together and trace down the section's
// left edge (.rail / .rail-partner in globals.css).
export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 className={cn("section-title text-xl font-bold", className)}>
      <span aria-hidden className="rail" />
      <span aria-hidden className="rail-partner" />
      {children}
    </h2>
  );
}
