// Optional conversion: metric is primary. These let the UI show an
// approximate US-style equivalent on demand.

const TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const TO_ML: Record<string, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 240,
  fl_oz: 29.5735,
};

export const UNIT_OPTIONS = [
  'g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'pc', 'clove', 'pinch',
] as const;

export function isWeight(unit: string | null): boolean {
  return !!unit && unit in TO_GRAMS;
}

export function isVolume(unit: string | null): boolean {
  return !!unit && unit in TO_ML;
}

/** Convert a weight amount to grams, or null if not a weight unit. */
export function toGrams(amount: number, unit: string | null): number | null {
  if (!unit || !(unit in TO_GRAMS)) return null;
  return amount * TO_GRAMS[unit];
}

/** Convert a volume amount to ml, or null if not a volume unit. */
export function toMl(amount: number, unit: string | null): number | null {
  if (!unit || !(unit in TO_ML)) return null;
  return amount * TO_ML[unit];
}

/**
 * Produce a friendly US-ish conversion string for display.
 * Returns null if no useful conversion exists.
 */
export function usEquivalent(amount: number | null, unit: string | null): string | null {
  if (amount == null || !unit) return null;

  const grams = toGrams(amount, unit);
  if (grams != null) {
    const oz = grams / TO_GRAMS.oz;
    if (oz >= 16) return `${(oz / 16).toFixed(2)} lb`;
    return `${oz.toFixed(1)} oz`;
  }

  const ml = toMl(amount, unit);
  if (ml != null) {
    const cups = ml / TO_ML.cup;
    if (cups >= 0.25) return `${cups.toFixed(2)} cup`;
    const tbsp = ml / TO_ML.tbsp;
    return `${tbsp.toFixed(1)} tbsp`;
  }

  return null;
}
