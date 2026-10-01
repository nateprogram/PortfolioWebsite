"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

// "Back" that returns the reader to where they were. If they got here by
// navigating inside the site, it goes back in history (the browser and
// Next restore the scroll position: the hero stat they clicked, the card
// they came from). If they landed here directly (a shared link, a search
// result), there's nothing of ours to go back to, so it falls back to
// `href`.

// Whether this tab has navigated between pages of the site since load.
// Module state: it survives client-side navigation and resets on reload.
let navigatedInApp = false;
let lastPath: string | null = null;

/** Mounted once in the root layout; notes in-app page changes. */
export function NavHistory() {
  const pathname = usePathname();
  useEffect(() => {
    if (lastPath !== null && lastPath !== pathname) navigatedInApp = true;
    lastPath = pathname;
  }, [pathname]);
  return null;
}

export function BackLink({ href, className }: { href: string; className?: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (!navigatedInApp || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        router.back();
      }}
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      Back
    </Link>
  );
}
