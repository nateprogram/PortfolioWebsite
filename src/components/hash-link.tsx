"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

/**
 * Same-page hash link with reliable re-click behavior.
 *
 * Plain anchor navigation (and Next.js <Link href="#foo">) goes through the
 * browser's hash-change handling. If the URL hash already matches the target,
 * the browser treats the click as a no-op and does not re-scroll. That breaks
 * hero CTAs and scroll cues that users expect to always scroll.
 *
 * HashLink calls scrollIntoView programmatically on every click, so every
 * click scrolls regardless of current URL. Modifier-clicks, middle-click,
 * keyboard, and no-JS fallback all keep native behavior.
 */
interface HashLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  targetId: string;
  children: ReactNode;
}

export function HashLink({
  targetId,
  children,
  onClick,
  ...rest
}: HashLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0
    ) {
      return;
    }
    const target = document.getElementById(targetId);
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (window.location.hash !== `#${targetId}`) {
      window.history.replaceState(null, "", `#${targetId}`);
    }
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}
