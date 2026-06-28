import type { NutritionFact } from "@/lib/types/api";

interface Row {
  label: string;
  value: string | number | null;
  unit?: string;
}

/** Nutrition facts table (UI/UX §6). Rows with no value are omitted. */
export function NutritionFacts({ nutrition }: { nutrition: NutritionFact }) {
  const rows: Row[] = [
    { label: "Calories", value: nutrition.calories, unit: "kcal" },
    { label: "Protein", value: nutrition.protein_g, unit: "g" },
    { label: "Carbohydrates", value: nutrition.carbs_g, unit: "g" },
    { label: "Fat", value: nutrition.fat_g, unit: "g" },
    { label: "Fiber", value: nutrition.fiber_g, unit: "g" },
    { label: "Sugar", value: nutrition.sugar_g, unit: "g" },
    { label: "Sodium", value: nutrition.sodium_mg, unit: "mg" },
  ].filter((r) => r.value !== null && r.value !== undefined);

  if (rows.length === 0 && !nutrition.serving_size) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      {nutrition.serving_size && (
        <div className="border-b border-border bg-elevated px-4 py-2.5 text-sm text-muted-foreground">
          Serving size:{" "}
          <span className="font-medium text-foreground">
            {nutrition.serving_size}
          </span>
        </div>
      )}
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.label}
              className={i % 2 === 1 ? "bg-surface/50" : undefined}
            >
              <th
                scope="row"
                className="px-4 py-2.5 text-left font-medium text-muted-foreground"
              >
                {row.label}
              </th>
              <td className="px-4 py-2.5 text-right font-semibold text-foreground">
                {row.value}
                {row.unit ? ` ${row.unit}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
