"use client";

import { useState } from "react";

import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreatePlan,
  useUpdatePlan,
  type PlanPayload,
} from "@/lib/admin/subscriptions";
import type {
  BillingInterval,
  MealType,
  SubscriptionPlan,
} from "@/lib/types/api";

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "high_protein", label: "High protein" },
  { value: "mixed", label: "Mixed" },
];

const INTERVALS: { value: BillingInterval; label: string }[] = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const selectClass =
  "h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

/** Create/edit form for a subscription plan. `plan` undefined = create mode. */
export function PlanForm({
  plan,
  onDone,
}: {
  plan?: SubscriptionPlan;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const isEdit = !!plan;
  const create = useCreatePlan();
  const update = useUpdatePlan();

  const [name, setName] = useState(plan?.name ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [mealType, setMealType] = useState<MealType>(plan?.meal_type ?? "vegetarian");
  const [price, setPrice] = useState(plan?.price ?? "");
  const [interval, setInterval] = useState<BillingInterval>(
    plan?.billing_interval ?? "weekly",
  );
  const [mealsPerCycle, setMealsPerCycle] = useState(
    String(plan?.meals_per_cycle ?? 1),
  );
  const [isActive, setIsActive] = useState(plan?.is_active ?? true);

  const saving = create.isPending || update.isPending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || price === "" || !mealsPerCycle) {
      toast("Name, price and meals per cycle are required.", "error");
      return;
    }
    const payload: PlanPayload = {
      name: name.trim(),
      description: description.trim() || null,
      meal_type: mealType,
      price: Number(price),
      billing_interval: interval,
      meals_per_cycle: Number(mealsPerCycle),
      is_active: isActive,
    };
    try {
      if (isEdit && plan) {
        await update.mutateAsync({ id: plan.id, ...payload });
        toast("Plan saved.", "success");
      } else {
        await create.mutateAsync(payload);
        toast("Plan created.", "success");
      }
      onDone();
    } catch {
      toast("Couldn't save the plan.", "error");
    }
  }

  return (
    <Card>
      <CardHeader className="mb-4">
        <CardTitle>{isEdit ? `Edit ${plan?.name}` : "New plan"}</CardTitle>
      </CardHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="plan-name">Name</Label>
            <Input id="plan-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="plan-desc">Description</Label>
            <textarea
              id="plan-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-subtle focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-meal">Meal type</Label>
            <select
              id="plan-meal"
              value={mealType}
              onChange={(e) => setMealType(e.target.value as MealType)}
              className={selectClass}
            >
              {MEAL_TYPES.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-interval">Billing interval</Label>
            <select
              id="plan-interval"
              value={interval}
              onChange={(e) => setInterval(e.target.value as BillingInterval)}
              className={selectClass}
            >
              {INTERVALS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-price">Price (₱)</Label>
            <Input
              id="plan-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="plan-meals">Meals per cycle</Label>
            <Input
              id="plan-meals"
              type="number"
              min="1"
              value={mealsPerCycle}
              onChange={(e) => setMealsPerCycle(e.target.value)}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="size-4 accent-primary"
          />
          Active (available to subscribe)
        </label>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save plan" : "Create plan"}
          </Button>
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
