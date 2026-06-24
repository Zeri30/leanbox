"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Restrained entrance animation (respects prefers-reduced-motion via MotionConfig). */
export function MotionHero({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
