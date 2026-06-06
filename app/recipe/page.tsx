'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getRecipe, deleteRecipe, toggleFavorite } from '@/lib/api';
import { Recipe } from '@/lib/types';
import {
  getScaleFactor,
  scaleAllIngredients,
  totalMacros,
  perServing,
  scaledServings,
  formatAmount,
  smartRound,
} from '@/lib/scaling';
import { usEquivalent } from '@/lib/units';
import { sourceLabel } from '@/lib/source';

function RecipeDetail() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get('id');

  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [haveInput, setHaveInput] = useState<string>('');
  const [showConv, setShowConv] = useState(false);
  const [macroView, setMacroView] = useState<'total' | 'serving'>('serving');
  const [unitMode, setUnitMode] = useState<'native' | 'kg' | 'lbs'>('native');

  useEffect(() => {
    if (!id) {
      setError('No recipe selected.');
      setLoading(false);
      return;
    }
    getRecipe(id)
      .then((r) => {
        if (!r) {
          setError('Recipe not found.');
        } else {
          setRecipe(r);
          const anchor = r.ingredients?.find((i) => i.is_scaling_anchor);
          if (anchor?.amount) setHaveInput(String(anchor.amount));
        }
      })
      .catch((e) => setError(e.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }, [id]);

  const anchor = recipe?.ingredients?.find((i) => i.is_scaling_anchor);

  // Unit toggle helpers — only relevant when anchor is lbs or kg
  const anchorUnit = anchor?.unit ?? '';
  const canToggleUnit = anchorUnit === 'lbs' || anchorUnit === 'kg';
  const displayUnit =
    unitMode === 'native' ? anchorUnit :
    unitMode === 'kg' ? 'kg' : 'lbs';

  function toDisplayUnit(val: number | null | undefined): number | null {
    if (val == null) return null;
    if (!canToggleUnit || unitMode === 'native') return val;
    if (unitMode === 'kg' && anchorUnit === 'lbs') return parseFloat((val * 0.453592).toFixed(3));
    if (unitMode === 'lbs' && anchorUnit === 'kg') return parseFloat((val * 2.20462).toFixed(3));
    return val;
  }

  function toAnchorUnit(val: number | null): number | null {
    if (val == null) return null;
    if (!canToggleUnit || unitMode === 'native') return val;
    if (unitMode === 'kg' && anchorUnit === 'lbs') return val / 0.453592;
    if (unitMode === 'lbs' && anchorUnit === 'kg') return val / 2.20462;
    return val;
  }

  function handleUnitToggle(next: 'kg' | 'lbs') {
    // Convert current input value to the new display unit
    const parsed = haveInput.trim() === '' ? null : parseFloat(haveInput);
    if (parsed != null) {
      let converted: number;
      if (next === 'kg' && anchorUnit === 'lbs') converted = parsed * 0.453592;
      else if (next === 'lbs' && anchorUnit === 'kg') converted = parsed * 2.20462;
      else if (next === 'kg' && unitMode === 'lbs') converted = parsed * 0.453592;
      else converted = parsed / 0.453592;
      setHaveInput(String(parseFloat(converted.toFixed(3))));
    }
    setUnitMode(next);
  }

  const haveAmount = haveInput.trim() === '' ? null : parseFloat(haveInput);
  const haveAmountInAnchorUnit = toAnchorUnit(haveAmount);

  const factor = useMemo(() => {
    if (!recipe?.ingredients) return 1;
    return getScaleFactor(recipe.ingredients, haveAmountInAnchorUnit);
  }, [recipe, haveAmountInAnchorUnit]);

  const scaled = useMemo(() => {
    if (!recipe?.ingredients) return [];
    return scaleAllIngredients(recipe.ingredients, factor);
  }, [recipe, factor]);

  const totals = useMemo(() => totalMacros(scaled), [scaled]);
  const sServings = recipe ? scaledServings(recipe, factor) : 0;
  const perServ = useMemo(
    () => perServing(totals, sServings || 1),
    [totals, sServings]
  );

  async function handleDelete() {
    if (!recipe) return;
    if (!confirm('Delete this recipe? This cannot be undone.')) return;
    try {
      await deleteRecipe(recipe.id);
      router.push('/');
    } catch (e: any) {
      alert(e.message || 'Delete failed.');
    }
  }

  async function handleFav() {
    if (!recipe) return;
    const next = !recipe.is_favorite;
    setRecipe({ ...recipe, is_favorite: next });
    try {
      await toggleFavorite(recipe.id, next);
    } catch {
      setRecipe({ ...recipe, is_favorite: !next });
    }
  }

  if (loading) return <div className="loading">Loading recipe…</div>;
  if (error)
    return (
      <main className="container">
        <div className="error-box" style={{ marginTop: 40 }}>{error}</div>
        <Link href="/" className="back-link">← Back to all recipes</Link>
      </main>
    );
  if (!recipe) return null;

  const steps = (recipe.instructions || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const hasMacros = scaled.some((i) => i.kcal || i.protein_g || i.carbs_g || i.fat_g);
  const displayMacros = macroView === 'serving' ? perServ : totals;

  return (
    <main className="container">
      <Link href="/" className="back-link">← All recipes</Link>

      <div className="detail-head">
        <h1>{recipe.title}</h1>
        <div className="sub">
          {recipe.category && <span>{recipe.category}</span>}
          <span>{recipe.servings} base servings</span>
          {recipe.prep_minutes ? <span>{recipe.prep_minutes}m prep</span> : null}
          {recipe.cook_minutes ? <span>{recipe.cook_minutes}m cook</span> : null}
          <span>via {sourceLabel(recipe.source_type)}</span>
        </div>
        {recipe.description && (
          <p style={{ marginTop: 12, color: 'var(--ink-soft)', maxWidth: '60ch' }}>
            {recipe.description}
          </p>
        )}
        {recipe.source_url && (
          <div>
            <a href={recipe.source_url} target="_blank" rel="noopener noreferrer" className="source-link">
              ↗ Open original on {sourceLabel(recipe.source_type)}
            </a>
          </div>
        )}
        <div className="detail-actions">
          <button className="btn btn-ghost" onClick={handleFav}>
            {recipe.is_favorite ? '★ Favorited' : '☆ Favorite'}
          </button>
          <Link href={`/edit?id=${recipe.id}`} className="btn btn-ghost">Edit</Link>
          <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* LEFT: scaler + ingredients */}
        <div>
          {anchor ? (
            <div className="scaler">
              <h4>How much do you have?</h4>
              <div className="anchor-name">{anchor.name}</div>
              <div className="have-input">
                <input
                  type="number"
                  value={haveInput}
                  onChange={(e) => setHaveInput(e.target.value)}
                  placeholder={String(toDisplayUnit(anchor.amount) ?? '')}
                />
                <span className="unit-badge">{displayUnit}</span>
                {canToggleUnit && (
                  <div className="unit-toggle">
                    <button
                      className={displayUnit === 'kg' ? 'active' : ''}
                      onClick={() => handleUnitToggle('kg')}
                    >kg</button>
                    <button
                      className={displayUnit === 'lbs' ? 'active' : ''}
                      onClick={() => handleUnitToggle('lbs')}
                    >lbs</button>
                  </div>
                )}
              </div>
              <div>
                <span className="factor-pill">
                  ×{smartRound(factor)} · makes ~{sServings} servings
                </span>
              </div>
              <p className="hint" style={{ marginTop: 10 }}>
                Recipe is written for {formatAmount(toDisplayUnit(anchor.amount), displayUnit, anchor.name)}. Everything below rescales live.
              </p>
              <div className="quick-btns">
                {anchor.amount != null &&
                  [0.5, 1, 1.5, 2].map((m) => {
                    const dispVal = toDisplayUnit(anchor.amount! * m);
                    return (
                      <button
                        key={m}
                        onClick={() => setHaveInput(String(dispVal != null ? parseFloat(dispVal.toFixed(3)) : anchor.amount! * m))}
                      >
                        {dispVal != null ? parseFloat(dispVal.toFixed(2)) : smartRound(anchor.amount! * m)}{displayUnit}
                      </button>
                    );
                  })}
              </div>

              {hasMacros && (
                <>
                  <div className="macro-toggle">
                    <button
                      className={macroView === 'serving' ? 'active' : ''}
                      onClick={() => setMacroView('serving')}
                    >
                      Per serving
                    </button>
                    <button
                      className={macroView === 'total' ? 'active' : ''}
                      onClick={() => setMacroView('total')}
                    >
                      Whole batch
                    </button>
                  </div>
                  <div className="macros">
                    <div className="macro">
                      <div className="val">{Math.round(displayMacros.kcal)}</div>
                      <div className="lbl">kcal</div>
                    </div>
                    <div className="macro">
                      <div className="val">{smartRound(displayMacros.protein_g)}</div>
                      <div className="lbl">protein</div>
                    </div>
                    <div className="macro">
                      <div className="val">{smartRound(displayMacros.carbs_g)}</div>
                      <div className="lbl">carbs</div>
                    </div>
                    <div className="macro">
                      <div className="val">{smartRound(displayMacros.fat_g)}</div>
                      <div className="lbl">fat</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="scaler">
              <h4>No scaling anchor set</h4>
              <p className="hint">
                Edit this recipe and mark your main protein with ★ to enable
                live scaling.
              </p>
              {hasMacros && (
                <div className="macros" style={{ marginTop: 14 }}>
                  <div className="macro"><div className="val">{Math.round(perServ.kcal)}</div><div className="lbl">kcal/srv</div></div>
                  <div className="macro"><div className="val">{smartRound(perServ.protein_g)}</div><div className="lbl">protein</div></div>
                  <div className="macro"><div className="val">{smartRound(perServ.carbs_g)}</div><div className="lbl">carbs</div></div>
                  <div className="macro"><div className="val">{smartRound(perServ.fat_g)}</div><div className="lbl">fat</div></div>
                </div>
              )}
            </div>
          )}

          <div className="ing-section" style={{ marginTop: 28 }}>
            <h3>
              Ingredients
              <button
                className="add-ing-btn"
                style={{ float: 'right', marginTop: -4 }}
                onClick={() => setShowConv((v) => !v)}
              >
                {showConv ? 'hide US units' : 'show US units'}
              </button>
            </h3>
            <ul className="ing-list">
              {scaled.map((ing) => {
                const conv = showConv ? usEquivalent(ing.amount, ing.unit) : null;
                return (
                  <li key={ing.id}>
                    <span className={`iname ${ing.is_scaling_anchor ? 'is-anchor' : ''}`}>
                      {ing.name}
                      {ing.note && <span className="inote"> — {ing.note}</span>}
                    </span>
                    <span className="iamt">
                      {formatAmount(ing.amount, ing.unit, ing.name)}
                      {conv && <span className="conv">≈ {conv}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* RIGHT: instructions + notes */}
        <div>
          <div className="instructions">
            <h3>Method</h3>
            {steps.length > 0 ? (
              <ol>
                {steps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            ) : (
              <p className="hint">No steps recorded.</p>
            )}
          </div>

          {recipe.source_caption && (
            <div className="notes-box" style={{ borderLeftColor: 'var(--ink-soft)' }}>
              <strong style={{ fontStyle: 'normal', fontFamily: "'DM Mono', monospace", fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Original caption
              </strong>
              {recipe.source_caption}
            </div>
          )}

          {recipe.notes && (
            <div className="notes-box">
              <strong style={{ fontStyle: 'normal', fontFamily: "'DM Mono', monospace", fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
                Our notes
              </strong>
              {recipe.notes}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function RecipePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="loading">Loading…</div>}>
        <RecipeDetail />
      </Suspense>
    </>
  );
}
