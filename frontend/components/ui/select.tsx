"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  /** Applied to the trigger button — control its width here. */
  className?: string;
  "aria-label"?: string;
}

/**
 * Custom dropdown built on Radix Select — fully styled trigger AND option list
 * (unlike a native <select>, whose list is sized by the OS). Keyboard, focus,
 * and a11y are handled by Radix. Note: Radix forbids an empty-string option
 * value, so callers use a sentinel (e.g. "all") for an "all/none" choice.
 */
export function Select({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  className,
  ...aria
}: SelectProps) {
  // Pass the selected label to <Select.Value> explicitly: Radix mounts the
  // option list lazily, so a preset value otherwise renders blank until the
  // menu is first opened.
  const selected = options.find((o) => o.value === value);
  return (
    <SelectPrimitive.Root
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectPrimitive.Trigger
        aria-label={aria["aria-label"]}
        className={cn(
          "flex h-10 items-center justify-between gap-2 rounded-lg border border-input bg-surface px-3 text-sm text-foreground transition-colors data-placeholder:text-subtle hover:border-border-strong focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder}>
          {selected?.label}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-64 min-w-(--radix-select-trigger-width) overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-lg"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="relative flex cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-3 text-sm text-foreground outline-none data-highlighted:bg-elevated data-[state=checked]:font-medium data-[state=checked]:text-primary data-disabled:pointer-events-none data-disabled:opacity-50"
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2 flex items-center">
                  <Check className="size-4" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
