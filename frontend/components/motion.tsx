"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Shared motion primitives (UI/UX §8). All respect prefers-reduced-motion via the
 * <MotionConfig reducedMotion="user"> set in app/providers.tsx, which strips
 * transforms and keeps only opacity changes.
 */

const STANDARD = [0.4, 0, 0.2, 1] as const;

/** Fade-up entrance for sections / hero content (slow, ≤400ms). */
export function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: STANDARD, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Quick fade/fade-up between routes — wrap a page's root element. */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: STANDARD }}
    >
      {children}
    </motion.div>
  );
}

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: STANDARD } },
};

/** Staggered fade-up for lists/grids (40–60ms stagger). Wrap items in <StaggerItem>. */
export function Stagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

/** Card hover-lift (desktop) + tap scale-down (mobile). Pointer-aware via Framer. */
export function HoverLift({
  children,
  className,
  ...props
}: { children: ReactNode } & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.12, ease: STANDARD }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
