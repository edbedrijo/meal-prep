'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IngredientDraft, Recipe, SourceType } from '@/lib/types';
import { UNIT_OPTIONS } from '@/lib/units';
import { detectSource } from '@/lib/source';
import { RecipeInput } from '@/lib/api';

function emptyIngredient(): IngredientDraft {
  return {
    name: '',
    amount: null,
    unit: 'g',
    is_scaling_anchor: false,
    note: null,
    kcal: null,
    protein_g: null,
    carbs_g: null,
    fat_g: null,
  };
}

interface Props {
  initial?: Recipe;
  onSubmit: (input: RecipeInput, ingredients: IngredientDraft[]) => Promise<string | void>;
  submitLabel: string;
}

export default function RecipeForm({ initial, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [showMacros, setShowMacros] = useState<Record<number, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [sourceUrl, setSourceUrl] = useState(initial?.source_url || '');
  const [sourceCaption, setSourceCaption] = useState(initial?.source_caption || '');
  const [imageUrl, setImageUrl] = useState(initial?.image_url || '');
  const [category, setCategory] = useState(initial?.category || '');
  const [servings, setServings] = useState(initial?.servings?.toString() || '2');
  const [prep, setPrep] = useState(initial?.prep_minutes?.toString() || '');
  const [cook, setCook] = useState(initial?.cook_minutes?.toString() || '');
  const [instructions, setInstructions] = useState(initial?.instructions || '');
  const [notes, setNotes] = useState(initial?.notes || '');

  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    initial?.ingredients?.map((i) => ({
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      is_scaling_anchor: i.is_scaling_anchor,
      note: i.note,
      kcal: i.kcal,
      protein_g: i.protein_g,
      carbs_g: i.carbs_g,
      fat_g: i.fat_g,
    })) || [emptyIngredient()]
  );

  function updateIng(idx: number, patch: Partial<IngredientDraft>) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === idx ? { ...ing, ...patch } : ing))
    );
  }

  function setAnchor(idx: number) {
    setIngredients((prev) =>
      prev.map((ing, i) => ({ ...ing, is_scaling_anchor: i === idx ? !ing.is_scaling_anchor : false }))
    );
  }

  function addIng() {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  }
  function removeIng(idx: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  function num(v: string): number | null {
    if (v.trim() === '') return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  }

  async function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError('Give the recipe a title.');
      return;
    }
    const cleanIngredients = ingredients.filter((i) => i.name.trim() !== '');
    if (cleanIngredients.length === 0) {
      setError('Add at least one ingredient.');
      return;
    }

    const sourceType: SourceType = sourceUrl ? detectSource(sourceUrl) : 'manual';

    const input: RecipeInput = {
      title: title.trim(),
      description: description.trim() || null,
      source_url: sourceUrl.trim() || null,
      source_type: sourceType,
      source_caption: sourceCaption.trim() || null,
      image_url: imageUrl.trim() || null,
      category: category.trim() || null,
      servings: parseInt(servings) || 2,
      prep_minutes: num(prep),
      cook_minutes: num(cook),
      instructions: instructions.trim() || null,
      notes: notes.trim() || null,
    };

    setSaving(true);
    try {
      const id = await onSubmit(input, cleanIngredients);
      if (typeof id === 'string') {
        router.push(`/recipe?id=${id}`);
      } else {
        router.push('/');
      }
    } catch (e: any) {
      setError(e.message || 'Could not save. Check your Supabase setup.');
      setSaving(false);
    }
  }

  return (
    <div className="form-wrap">
      {error && <div className="error-box">{error}</div>}

      <div className="field">
        <label>Recipe Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Spicy Garlic Ground Beef Bowl" />
      </div>

      <div className="row">
        <div className="field">
          <label>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Beef, Chicken, Pork…" />
        </div>
        <div className="field">
          <label>Image URL (optional)</label>
          <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" />
        </div>
      </div>

      <div className="field">
        <label>Short Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="One line about what this is" style={{ minHeight: 60 }} />
      </div>

      <div className="section-label">Where you found it</div>
      <div className="field">
        <label>Source URL (TikTok / Facebook / Web)</label>
        <input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="Paste the link…" />
        {sourceUrl && (
          <p className="hint">Detected: {detectSource(sourceUrl)}</p>
        )}
      </div>
      <div className="field">
        <label>Pasted Caption / Notes from the post</label>
        <textarea
          value={sourceCaption}
          onChange={(e) => setSourceCaption(e.target.value)}
          placeholder="Paste the caption text here, then type the ingredients into the fields below. (Auto-import from TikTok/FB isn't possible from a static site.)"
        />
      </div>

      <div className="row">
        <div className="field">
          <label>Base Servings *</label>
          <input type="number" min="1" value={servings} onChange={(e) => setServings(e.target.value)} />
        </div>
        <div className="field">
          <label>Prep (min)</label>
          <input type="number" value={prep} onChange={(e) => setPrep(e.target.value)} />
        </div>
        <div className="field">
          <label>Cook (min)</label>
          <input type="number" value={cook} onChange={(e) => setCook(e.target.value)} />
        </div>
      </div>

      <div className="section-label">
        <span>Ingredients</span>
        <span className="hint" style={{ fontStyle: 'normal' }}>★ = scaling anchor</span>
      </div>
      <p className="hint" style={{ marginTop: 0, marginBottom: 14 }}>
        Mark your main protein (e.g. ground beef) as the ★ anchor. That&apos;s what the scaler measures against.
      </p>

      {ingredients.map((ing, idx) => (
        <div key={idx}>
          <div className="ing-row">
            <button
              type="button"
              className={`anchor-btn ${ing.is_scaling_anchor ? 'on' : ''}`}
              onClick={() => setAnchor(idx)}
              title="Set as scaling anchor"
            >
              ★
            </button>
            <input
              placeholder="Ingredient name"
              value={ing.name}
              onChange={(e) => updateIng(idx, { name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Qty"
              value={ing.amount ?? ''}
              onChange={(e) => updateIng(idx, { amount: e.target.value === '' ? null : parseFloat(e.target.value) })}
            />
            <select value={ing.unit || ''} onChange={(e) => updateIng(idx, { unit: e.target.value || null })}>
              <option value="">—</option>
              {UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
            <button type="button" className="del" onClick={() => removeIng(idx)} title="Remove">✕</button>
          </div>
          <div style={{ marginLeft: 36, marginTop: -2, marginBottom: 6 }}>
            <input
              placeholder="note (optional, e.g. finely chopped)"
              value={ing.note ?? ''}
              onChange={(e) => updateIng(idx, { note: e.target.value || null })}
              style={{ width: '60%', padding: '6px 9px', border: '1.5px solid var(--line)', borderRadius: 8, background: 'transparent', fontFamily: 'inherit', fontSize: '0.82rem' }}
            />
            <button
              type="button"
              className="add-ing-btn"
              style={{ marginLeft: 8, marginTop: 0, padding: '6px 10px' }}
              onClick={() => setShowMacros((s) => ({ ...s, [idx]: !s[idx] }))}
            >
              {showMacros[idx] ? 'hide macros' : '+ macros'}
            </button>
          </div>
          {showMacros[idx] && (
            <div className="macro-row">
              <input type="number" placeholder="kcal" value={ing.kcal ?? ''} onChange={(e) => updateIng(idx, { kcal: e.target.value === '' ? null : parseFloat(e.target.value) })} />
              <input type="number" placeholder="protein g" value={ing.protein_g ?? ''} onChange={(e) => updateIng(idx, { protein_g: e.target.value === '' ? null : parseFloat(e.target.value) })} />
              <input type="number" placeholder="carbs g" value={ing.carbs_g ?? ''} onChange={(e) => updateIng(idx, { carbs_g: e.target.value === '' ? null : parseFloat(e.target.value) })} />
              <input type="number" placeholder="fat g" value={ing.fat_g ?? ''} onChange={(e) => updateIng(idx, { fat_g: e.target.value === '' ? null : parseFloat(e.target.value) })} />
            </div>
          )}
        </div>
      ))}
      <button type="button" className="add-ing-btn" onClick={addIng}>+ Add ingredient</button>

      <div className="section-label">Instructions</div>
      <div className="field">
        <label>Steps (one per line)</label>
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={'Brown the beef over high heat\nAdd garlic and chili\nSimmer 10 minutes'}
          style={{ minHeight: 160 }}
        />
      </div>

      <div className="field">
        <label>Personal Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What you'd change next time, Chantal's verdict, etc." style={{ minHeight: 70 }} />
      </div>

      <div className="detail-actions">
        <button className="btn btn-accent" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
        <button className="btn btn-ghost" onClick={() => router.back()} disabled={saving}>
          Cancel
        </button>
      </div>
    </div>
  );
}
