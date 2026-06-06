import { Ingredient, MacroTotals, Recipe } from './types';

// Units that are weight/volume and scale cleanly numerically.
const SCALABLE_UNITS = new Set([
  'g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'cup', 'oz', 'lb', 'fl_oz',
]);

/**
 * Round to a sensible number of decimals based on magnitude.
 * Small spice amounts keep more precision; large amounts round cleaner.
 */
export function smartRound(value: number): number {
  if (value === 0) return 0;
  const abs = Math.abs(value);
  if (abs >= 100) return Math.round(value);
  if (abs >= 10) return Math.round(value * 10) / 10;
  if (abs >= 1) return Math.round(value * 100) / 100;
  return Math.round(value * 1000) / 1000;
}

/**
 * The scaling factor = how much you have / how much the recipe calls for.
 * Returns 1 if there is no valid anchor (recipe shown as written).
 */
export function getScaleFactor(
  ingredients: Ingredient[],
  haveAmount: number | null
): number {
  const anchor = ingredients.find((i) => i.is_scaling_anchor);
  if (!anchor || !anchor.amount || haveAmount == null || haveAmount <= 0) {
    return 1;
  }
  return haveAmount / anchor.amount;
}

/**
 * Apply a scale factor to a single ingredient's amount and macros.
 * "to taste" items (amount == null) are left untouched but flagged.
 */
export function scaleIngredient(ing: Ingredient, factor: number): Ingredient {
  const canScaleAmount =
    ing.amount != null && (ing.unit == null || SCALABLE_UNITS.has(ing.unit) || ing.unit === 'pc' || ing.unit === 'clove');

  return {
    ...ing,
    amount: canScaleAmount && ing.amount != null ? smartRound(ing.amount * factor) : ing.amount,
    kcal: ing.kcal != null ? smartRound(ing.kcal * factor) : ing.kcal,
    protein_g: ing.protein_g != null ? smartRound(ing.protein_g * factor) : ing.protein_g,
    carbs_g: ing.carbs_g != null ? smartRound(ing.carbs_g * factor) : ing.carbs_g,
    fat_g: ing.fat_g != null ? smartRound(ing.fat_g * factor) : ing.fat_g,
  };
}

export function scaleAllIngredients(
  ingredients: Ingredient[],
  factor: number
): Ingredient[] {
  return ingredients.map((i) => scaleIngredient(i, factor));
}

/** Sum macros across a list of (already-scaled) ingredients. */
export function totalMacros(ingredients: Ingredient[]): MacroTotals {
  return ingredients.reduce<MacroTotals>(
    (acc, i) => ({
      kcal: acc.kcal + (i.kcal || 0),
      protein_g: acc.protein_g + (i.protein_g || 0),
      carbs_g: acc.carbs_g + (i.carbs_g || 0),
      fat_g: acc.fat_g + (i.fat_g || 0),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  );
}

/** Per-serving macros given total macros and a serving count. */
export function perServing(totals: MacroTotals, servings: number): MacroTotals {
  const s = servings > 0 ? servings : 1;
  return {
    kcal: smartRound(totals.kcal / s),
    protein_g: smartRound(totals.protein_g / s),
    carbs_g: smartRound(totals.carbs_g / s),
    fat_g: smartRound(totals.fat_g / s),
  };
}

/** Scaled serving count (rounded to nearest 0.5). */
export function scaledServings(recipe: Recipe, factor: number): number {
  const raw = recipe.servings * factor;
  return Math.round(raw * 2) / 2;
}

export function formatAmount(amount: number | null, unit: string | null): string {
  if (amount == null) return 'to taste';
  const u = unit ? ` ${unit}` : '';
  return `${smartRound(amount)}${u}`;
}
