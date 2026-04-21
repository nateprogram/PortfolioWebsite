"use client";

import { ChevronDown } from "lucide-react";

/**
 * In-page scroll cue.
 *
 * The default browser behavior for anchor clicks is: if the URL hash already
 * matches the target, do nothing. That breaks a scroll cue that's meant to
 * always take you back down to the target section. This component intercepts
 * the click and calls scrollIntoView programmatically instead, so every click
 * scrolls regardless of the current URL.
 *
 * If JS fails or the target id is missing, the plain anchor behavior takes
 * over. Keyboard, middle-click, and modifier-clicks all keep native behavior.
 */
interface ScrollCueProps {
  targetId: string;
  label?: string;
  className?: string;
}

export function ScrollCue({
  targetId,
  label = "Scroll",
  className,
}: ScrollCueProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Let modifier-clicks (cmd/ctrl/shift/middle) keep native behavior.
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
    // Keep the URL hash in sync without triggering a route transition.
    if (window.location.hash !== `#${targetId}`) {
      window.history.replaceState(null, "", `#${targetId}`);
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      aria-label={`Scroll to ${targetId}`}
      className={className}
    >
      <span className="text-[10px] font-mono uppercase tracking-widest">
        {label}
      </span>
      <ChevronDown className="size-4" aria-hidden />
    </a>
  );
}
