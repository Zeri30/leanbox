import { AlertCircle, CheckCircle2 } from "lucide-react";
import * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FieldProps extends InputProps {
  label: string;
  /** Inline validation message shown beneath the field. */
  error?: string;
}

/** Labeled input with an inline error message + aria wiring. */
export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  ({ id, label, error, className, ...props }, ref) => {
    const errorId = error ? `${id}-error` : undefined;
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className={className}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Field.displayName = "Field";

/** Top-level form banner for errors / success messages. */
export function FormBanner({
  variant = "error",
  children,
  className,
}: {
  variant?: "error" | "success";
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
        variant === "success"
          ? "border-success/30 bg-success/10 text-success"
          : "border-destructive/30 bg-destructive/10 text-destructive",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
