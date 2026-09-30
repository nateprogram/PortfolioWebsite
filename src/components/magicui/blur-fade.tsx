"use client";

import { AnimatePresence, motion, useInView, Variants } from "motion/react";
import { useRef } from "react";

interface BlurFadeProps {
  children: React.ReactNode;
  className?: string;
  variant?: {
    hidden: { y: number };
    visible: { y: number };
  };
  duration?: number;
  delay?: number;
  yOffset?: number;
  inView?: boolean;
  inViewMargin?: string;
  blur?: string;
}
const BlurFade = ({
  children,
  className,
  variant,
  duration = 0.4,
  delay = 0,
  yOffset = 6,
  // Reveal when scrolled into view. Content already on screen at load
  // animates immediately, so the hero still plays on first paint.
  inView = true,
  inViewMargin = "-50px",
  blur = "6px",
}: BlurFadeProps) => {
  const ref = useRef(null);
  const inViewResult = useInView(ref, {
    once: true,
    ...(inViewMargin ? { margin: inViewMargin as any } : {})
  });
  const isInView = !inView || inViewResult;
  const defaultVariants: Variants = {
    hidden: { y: -yOffset, opacity: 0, filter: `blur(${blur})` },
    // `filter: none` once done: a lingering blur(0px) makes this wrapper
    // the containing block for any position:fixed child (lightboxes).
    visible: {
      y: 0,
      opacity: 1,
      filter: `blur(0px)`,
      transitionEnd: { filter: "none" },
    },
  };
  const combinedVariants = variant || defaultVariants;
  return (
    <AnimatePresence>
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        exit="hidden"
        variants={combinedVariants}
        transition={{
          delay: 0.04 + delay,
          duration,
          ease: "easeOut",
        }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default BlurFade;
