import { categoryLight, LIGHT_CLASS } from "@/data/lights";
import { cn } from "@/lib/utils";

// A project's categories, each drawn in its own light: a short lit dash
// and the name, the same marks as the legend above the skills. They tell
// the reader what a card's color means without a separate key.
export function CategoryTags({
  categories,
  className,
}: {
  categories: ReadonlyArray<string>;
  className?: string;
}) {
  if (categories.length === 0) return null;
  return (
    <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1", className)}>
      {categories.map((c) => (
        <span
          key={c}
          className={cn(
            LIGHT_CLASS[categoryLight(c)],
            "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-brand"
          )}
        >
          <span
            className="h-[2px] w-3 bg-brand shadow-[0_0_6px_0_var(--brand-glow)]"
            aria-hidden
          />
          {c}
        </span>
      ))}
    </div>
  );
}
