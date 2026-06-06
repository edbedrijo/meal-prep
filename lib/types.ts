export type SourceType = 'tiktok' | 'facebook' | 'manual' | 'other';

export interface Ingredient {
  id: string;
  recipe_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  is_scaling_anchor: boolean;
  position: number;
  note: string | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  created_at?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  source_url: string | null;
  source_type: SourceType;
  source_caption: string | null;
  image_url: string | null;
  category: string | null;
  servings: number;
  prep_minutes: number | null;
  cook_minutes: number | null;
  instructions: string | null;
  notes: string | null;
  is_favorite: boolean;
  created_at?: string;
  updated_at?: string;
  ingredients?: Ingredient[];
}

export interface MacroTotals {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

// A draft ingredient used in the add/edit form before it has an id
export interface IngredientDraft {
  name: string;
  amount: number | null;
  unit: string | null;
  is_scaling_anchor: boolean;
  note: string | null;
  kcal: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
}
