"use client";

import { useId, useMemo, useState } from "react";

import type { RevenuePoint } from "@/lib/types/api";
import { formatPHP } from "@/lib/utils";

interface Point {
  x: number;
  y: number;
  raw: RevenuePoint;
}

const W = 720;
const H = 240;
const PAD = { top: 16, right: 12, bottom: 24, left: 12 };

/**
 * Lightweight in-house SVG area chart for daily revenue — no chart dependency
 * (matches the project's in-house Toast precedent). Uses a viewBox so it scales
 * fluidly to its container; hover reveals the value for a day.
 */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const { points, path, area, max } = useMemo(() => {
    const values = data.map((d) => Number(d.revenue) || 0);
    const max = Math.max(1, ...values);
    const innerW = W - PAD.left - PAD.right;
    const innerH = H - PAD.top - PAD.bottom;
    const step = data.length > 1 ? innerW / (data.length - 1) : 0;

    const points: Point[] = data.map((raw, i) => ({
      x: PAD.left + step * i,
      y: PAD.top + innerH - ((Number(raw.revenue) || 0) / max) * innerH,
      raw,
    }));

    const path = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
    const baseY = PAD.top + innerH;
    const area =
      points.length > 0
        ? `${path} L ${points[points.length - 1].x.toFixed(1)} ${baseY} L ${points[0].x.toFixed(1)} ${baseY} Z`
        : "";

    return { points, path, area, max };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="grid h-60 place-items-center text-sm text-muted-foreground">
        No revenue data yet.
      </div>
    );
  }

  const active = hover != null ? points[hover] : null;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-60 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Daily revenue over time"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines at 0/50/100% */}
        {[0, 0.5, 1].map((t) => {
          const y = PAD.top + (H - PAD.top - PAD.bottom) * t;
          return (
            <line
              key={t}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          );
        })}

        {area && <path d={area} fill={`url(#${gradientId})`} />}
        {path && (
          <path
            d={path}
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {active && (
          <circle
            cx={active.x}
            cy={active.y}
            r={4}
            fill="var(--color-primary)"
            stroke="var(--color-background)"
            strokeWidth={2}
          />
        )}

        {/* Invisible hover targets spanning each day column */}
        {points.map((p, i) => {
          const colW = points.length > 1 ? (W - PAD.left - PAD.right) / (points.length - 1) : W;
          return (
            <rect
              key={p.raw.date}
              x={p.x - colW / 2}
              y={0}
              width={colW}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
            />
          );
        })}
      </svg>

      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date}</span>
        <span aria-live="polite">
          {active
            ? `${active.raw.date}: ${formatPHP(active.raw.revenue)}`
            : `Peak ${formatPHP(max)}`}
        </span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
}
