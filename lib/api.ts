import { supabase } from './supabase';
import { Recipe, Ingredient, IngredientDraft } from './types';

export async function getRecipes(): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const { data: recipe, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  if (!recipe) return null;

  const { data: ingredients, error: ingErr } = await supabase
    .from('ingredients')
    .select('*')
    .eq('recipe_id', id)
    .order('position', { ascending: true });
  if (ingErr) throw ingErr;

  return { ...recipe, ingredients: ingredients || [] };
}

export interface RecipeInput {
  title: string;
  description: string | null;
  source_url: string | null;
  source_type: Recipe['source_type'];
  source_caption: string | null;
  image_url: string | null;
  category: string | null;
  servings: number;
  prep_minutes: number | null;
  cook_minutes: number | null;
  instructions: string | null;
  notes: string | null;
}

export async function createRecipe(
  input: RecipeInput,
  ingredients: IngredientDraft[]
): Promise<string> {
  const { data: recipe, error } = await supabase
    .from('recipes')
    .insert(input)
    .select('id')
    .single();
  if (error) throw error;

  const recipeId = recipe.id as string;
  await replaceIngredients(recipeId, ingredients);
  return recipeId;
}

export async function updateRecipe(
  id: string,
  input: RecipeInput,
  ingredients: IngredientDraft[]
): Promise<void> {
  const { error } = await supabase.from('recipes').update(input).eq('id', id);
  if (error) throw error;
  await replaceIngredients(id, ingredients);
}

export async function replaceIngredients(
  recipeId: string,
  ingredients: IngredientDraft[]
): Promise<void> {
  // simplest reliable approach: wipe and re-insert with fresh positions
  const { error: delErr } = await supabase
    .from('ingredients')
    .delete()
    .eq('recipe_id', recipeId);
  if (delErr) throw delErr;

  if (ingredients.length === 0) return;

  const rows = ingredients.map((ing, idx) => ({
    recipe_id: recipeId,
    name: ing.name,
    amount: ing.amount,
    unit: ing.unit,
    is_scaling_anchor: ing.is_scaling_anchor,
    position: idx,
    note: ing.note,
    kcal: ing.kcal,
    protein_g: ing.protein_g,
    carbs_g: ing.carbs_g,
    fat_g: ing.fat_g,
  }));

  const { error: insErr } = await supabase.from('ingredients').insert(rows);
  if (insErr) throw insErr;
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleFavorite(id: string, value: boolean): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .update({ is_favorite: value })
    .eq('id', id);
  if (error) throw error;
}
