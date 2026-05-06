// Sits at the very bottom of every page. The same GitHub / LinkedIn /
// Email links are already in the navbar dock, so the footer's job is to
// surface something the dock doesn't have. Currently: a quiet link to
// the Resume Builder tool, which is otherwise unfindable.

import Link from "next/link";
import { Wand2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 pt-8 pb-4">
      <div className="flex items-center justify-center text-muted-foreground">
        <Link
          href="/tools/resume"
          className="inline-flex items-center gap-2 hover:text-foreground transition-colors"
        >
          <Wand2 className="size-4" aria-hidden />
          <span className="text-sm">Resume Builder</span>
        </Link>
      </div>
    </footer>
  );
}
