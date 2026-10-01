"use client";

import { AnimatePresence, motion, useInView, Variants } from "motion/react";
import { useRef } from "react";
import { usePrefersReducedMotion } from "@/lib/use-reduced-motion";

// Scroll reveal. Originally Magic UI's blur-fade; now a "rez-in" after
// TRON: Legacy, where things materialize rather than fade in: the block
// is uncovered top to bottom like a scan line passing over it. No blur.
// (The file and export keep their old name so call sites don't churn.)

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  delay?: number;
  /** Kept for call-site compatibility; the rez has no vertical travel. */
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  /** Kept for call-site compatibility; the rez doesn't blur. */
  blur?: string;
}

const REZ: Variants = {
  hidden: { opacity: 0, clipPath: "inset(0% 0% 100% 0%)" },
  // clip-path is cleared once done so nothing (focus rings, tooltips,
  // hover glows) stays clipped to the wrapper.
  visible: {
    opacity: 1,
    clipPath: "inset(0% 0% 0% 0%)",
    transitionEnd: { clipPath: "none" },
  },
};

// Reduced motion: a plain fade. The server can't know the preference, so
// the first paint uses REZ's hidden state, clip-path included; FADE has
// to clear that clip itself (instantly, see `transition`) or the block
// stays invisible after the fade.
const FADE: Variants = {
  hidden: { opacity: 0, clipPath: "inset(0% 0% 0% 0%)" },
  visible: {
    opacity: 1,
    clipPath: "inset(0% 0% 0% 0%)",
    transitionEnd: { clipPath: "none" },
  },
};

const BlurFade = ({
  children,
  className,
  variant,
  duration = 0.5,
  delay = 0,
  // Reveal when scrolled into view. Content already on screen at load
  // animates immediately, so the hero still plays on first paint.
  inView = true,
  inViewMargin = "-50px",
}: BlurFadeProps) => {
  const ref = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const inViewResult = useInView(ref, {
    once: true,
    // motion's margin type is a template-literal union; any CSS margin
    // string works at runtime.
    ...(inViewMargin ? { margin: inViewMargin as `${number}px` } : {}),
  });
  const isInView = !inView || inViewResult;
  const variants = variant || (reduceMotion ? FADE : REZ);
  // The in-view check watches an unclipped outer box: Chromium's
  // IntersectionObserver honors the target's own clip-path, so a fully
  // clipped element would never count as visible and never reveal.
  return (
    <div ref={ref} className={className}>
      <AnimatePresence>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          exit="hidden"
          variants={variants}
          transition={{
            delay: 0.04 + delay,
            duration,
            ease: [0.6, 0, 0.25, 1],
            ...(reduceMotion && !variant
              ? { clipPath: { duration: 0 } }
              : {}),
          }}
          // Paper always gets the finished state, even for blocks the
          // reader never scrolled to.
          className="h-full print:!opacity-100 print:![clip-path:none]"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BlurFade;
