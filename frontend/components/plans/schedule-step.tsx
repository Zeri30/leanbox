"use client";

import { DELIVERY_SCHEDULE_LABEL, DELIVERY_SCHEDULES } from "@/lib/subscriptions";
import type { DeliverySchedule } from "@/lib/types/api";
import { cn } from "@/lib/utils";

const SCHEDULE_HINT: Record<DeliverySchedule, string> = {
  daily: "A delivery every day.",
  weekly: "A delivery once a week.",
  biweekly: "A delivery every two weeks.",
};

export function ScheduleStep({
  value,
  onChange,
}: {
  value: DeliverySchedule;
  onChange: (schedule: DeliverySchedule) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {DELIVERY_SCHEDULES.map((schedule) => {
        const selected = value === schedule;
        return (
          <label
            key={schedule}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-colors",
              selected
                ? "border-primary bg-primary-soft/40"
                : "border-border hover:border-border-strong",
            )}
          >
            <input
              type="radio"
              name="delivery_schedule"
              value={schedule}
              checked={selected}
              onChange={() => onChange(schedule)}
              className="size-4 shrink-0 accent-primary"
            />
            <div className="text-sm">
              <div className="font-semibold text-foreground">
                {DELIVERY_SCHEDULE_LABEL[schedule]}
              </div>
              <div className="text-muted-foreground">
                {SCHEDULE_HINT[schedule]}
              </div>
            </div>
          </label>
        );
      })}
    </div>
  );
}
