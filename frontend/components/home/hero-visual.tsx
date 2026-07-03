"use client";

import { motion } from "framer-motion";
import { Dumbbell, Flame, Leaf } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Decorative hero illustration — a top-down meal-prep box (a literal "Leanbox"):
 * a bento with fresh greens, grilled protein, and grains, ringed by floating
 * fitness / nutrition icon badges for a warm pop of color on the dark-green theme.
 *
 * Self-contained inline SVG (no image asset). The gentle float on the badges and
 * the breathing glow respect prefers-reduced-motion via the global
 * <MotionConfig reducedMotion="user"> (app/providers.tsx), which strips the
 * transform/opacity loops to a static image for users who opt out.
 */
export function HeroVisual() {
  return (
    <div
      aria-hidden
      className="pointer-events-none relative mx-auto aspect-square w-full max-w-sm"
    >
      {/* Soft breathing glow behind the box */}
      <motion.div
        className="absolute inset-8 rounded-full bg-primary/25 blur-3xl"
        animate={{ opacity: [0.45, 0.8, 0.45], scale: [0.95, 1.03, 0.95] }}
        transition={{ duration: 6, ease: "easeInOut", repeat: Infinity }}
      />

      <svg
        viewBox="0 0 320 320"
        fill="none"
        className="relative h-full w-full drop-shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
        role="presentation"
      >
        {/* Box body + inner tray */}
        <rect x="46" y="54" width="228" height="212" rx="28" fill="#141b18" stroke="#3a463f" strokeWidth="2" />
        <rect x="54" y="62" width="212" height="196" rx="22" fill="#0e1311" stroke="#2a332f" />

        {/* Compartment dividers */}
        <path d="M162 70v180" stroke="#2a332f" strokeWidth="3" strokeLinecap="round" />
        <path d="M162 160h96" stroke="#2a332f" strokeWidth="3" strokeLinecap="round" />

        {/* Left compartment — fresh salad + cherry tomatoes */}
        <g>
          <circle cx="96" cy="150" r="27" fill="#15803d" />
          <circle cx="122" cy="164" r="25" fill="#22c55e" />
          <circle cx="100" cy="182" r="21" fill="#4ade80" />
          <circle cx="128" cy="146" r="17" fill="#a3e635" />
          <circle cx="86" cy="168" r="15" fill="#16a34a" />
          <circle cx="110" cy="160" r="7.5" fill="#f59e0b" />
          <circle cx="93" cy="177" r="6" fill="#fbbf24" />
          <circle cx="126" cy="178" r="5.5" fill="#f59e0b" />
        </g>

        {/* Right-top compartment — grilled protein strips */}
        <g>
          <rect x="182" y="92" width="54" height="14" rx="7" fill="#f59e0b" />
          <rect x="182" y="112" width="54" height="14" rx="7" fill="#fbbf24" />
          <rect x="182" y="132" width="54" height="14" rx="7" fill="#f59e0b" />
          <path d="M199 92v54M219 92v54" stroke="#92400e" strokeOpacity="0.55" strokeWidth="2" />
        </g>

        {/* Right-bottom compartment — grains + edamame/broccoli */}
        <g>
          <circle cx="196" cy="196" r="11" fill="#16a34a" />
          <circle cx="217" cy="210" r="10" fill="#22c55e" />
          <circle cx="200" cy="221" r="8" fill="#4ade80" />
          <g fill="#dbe4de" opacity="0.9">
            <circle cx="228" cy="192" r="3" />
            <circle cx="240" cy="200" r="3" />
            <circle cx="232" cy="210" r="3" />
            <circle cx="244" cy="216" r="3" />
            <circle cx="224" cy="220" r="3" />
            <circle cx="236" cy="226" r="3" />
            <circle cx="212" cy="232" r="3" />
          </g>
        </g>
      </svg>

      {/* Floating fitness / nutrition badges — the pop of color */}
      <FloatingBadge className="left-0 top-8 bg-primary text-primary-foreground" delay={0}>
        <Dumbbell className="h-5 w-5" strokeWidth={2.5} />
      </FloatingBadge>
      <FloatingBadge className="right-1 top-16 bg-warning text-[#3b2606]" delay={0.9}>
        <Flame className="h-5 w-5" strokeWidth={2.5} />
      </FloatingBadge>
      <FloatingBadge className="bottom-6 left-6 bg-accent-lime text-[#06210f]" delay={1.7}>
        <Leaf className="h-5 w-5" strokeWidth={2.5} />
      </FloatingBadge>
    </div>
  );
}

function FloatingBadge({
  className,
  delay,
  children,
}: {
  className: string;
  delay: number;
  children: ReactNode;
}) {
  return (
    <motion.span
      className={`absolute flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg shadow-black/30 ring-1 ring-white/10 ${className}`}
      animate={{ y: [0, -9, 0] }}
      transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, delay }}
    >
      {children}
    </motion.span>
  );
}
