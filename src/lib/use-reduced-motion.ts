"use client";

import { useSyncExternalStore } from "react";

// Hydration-safe `prefers-reduced-motion`. motion/react's useReducedMotion
// reads the media query on the client's first render, so anything that
// renders differently based on it mismatches the server HTML. Here the
// server snapshot (false) is used during hydration and the real value
// arrives in the next render.

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
