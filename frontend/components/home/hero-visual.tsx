"use client";

import { motion } from "framer-motion";

/**
 * Decorative hero illustration — a stylized meal bowl with leaves and floating
 * "nutrient" dots. Self-contained inline SVG (no image asset). The gentle float
 * on the dots and glow respects prefers-reduced-motion via the global
 * <MotionConfig reducedMotion="user"> (app/providers.tsx), which strips the
 * transform/opacity loops to a static image for users who opt out.
 */
export function HeroVisual() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative mx-auto aspect-square w-full max-w-sm"
    >
      {/* Soft breathing glow behind the bowl */}
      <motion.div
        className="absolute inset-6 rounded-full bg-primary/20 blur-3xl"
        animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.96, 1.02, 0.96] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
      />

      <svg
        viewBox="0 0 320 320"
        fill="none"
        className="relative h-full w-full"
        role="presentation"
      >
        <defs>
          <radialGradient id="hero-bowl" cx="50%" cy="38%" r="65%">
            <stop offset="0%" stopColor="#1e2624" />
            <stop offset="100%" stopColor="#0e1311" />
          </radialGradient>
          <linearGradient id="hero-leaf" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        {/* Concentric accent rings */}
        <circle cx="160" cy="160" r="150" stroke="#22c55e" strokeOpacity="0.12" />
        <circle cx="160" cy="160" r="118" stroke="#22c55e" strokeOpacity="0.18" />

        {/* Bowl */}
        <circle cx="160" cy="160" r="92" fill="url(#hero-bowl)" stroke="#2a332f" />
        <path
          d="M78 168a82 82 0 0 0 164 0Z"
          fill="#0f2e1f"
          stroke="#22c55e"
          strokeOpacity="0.35"
        />

        {/* Leaves / greens in the bowl */}
        <path
          d="M160 96c26 6 42 26 40 54-26 2-46-16-46-40 0-6 2-11 6-14Z"
          fill="url(#hero-leaf)"
          opacity="0.95"
        />
        <path
          d="M160 96c-26 6-42 26-40 54 26 2 46-16 46-40 0-6-2-11-6-14Z"
          fill="#22c55e"
          opacity="0.8"
        />
        <path
          d="M160 104v52"
          stroke="#06210f"
          strokeOpacity="0.5"
          strokeWidth="2"
        />
      </svg>

      {/* Floating nutrient dots */}
      <FloatingDot className="left-2 top-10 h-3 w-3 bg-primary" delay={0} />
      <FloatingDot
        className="right-4 top-20 h-4 w-4 bg-accent-lime"
        delay={0.8}
      />
      <FloatingDot
        className="bottom-12 left-8 h-2.5 w-2.5 bg-primary"
        delay={1.6}
      />
      <FloatingDot
        className="bottom-20 right-6 h-3 w-3 bg-accent-lime"
        delay={0.4}
      />
    </div>
  );
}

function FloatingDot({
  className,
  delay,
}: {
  className: string;
  delay: number;
}) {
  return (
    <motion.span
      className={`absolute rounded-full shadow-[0_0_12px] shadow-primary/40 ${className}`}
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, delay }}
    />
  );
}
