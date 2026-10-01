// Sits at the very bottom of every page. The dock already carries the
// social links, so the footer is a quiet sign-off plus the two links a
// recruiter is most likely to want again: the resume. (No source link:
// the repo is private.)
//
// The Job Tracker tool still lives at /tools/applications (unlock-key
// gated); it's just no longer advertised here.

import Link from "next/link";
import { DATA } from "@/data";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 pt-8 pb-4 print:hidden">
      <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground sm:flex-row sm:justify-between">
        <span>
          © {new Date().getFullYear()} {DATA.name}
        </span>
        <div className="flex items-center gap-4">
          <Link href="/resume" className="hover:text-foreground transition-colors">
            Resume
          </Link>
        </div>
      </div>
    </footer>
  );
}
