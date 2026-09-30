"use client";

import { MotionConfig } from "motion/react";

// Every motion/react animation on the site respects the OS-level
// "reduce motion" setting: transforms are skipped, opacity still fades.
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
