'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import RecipeForm from '@/components/RecipeForm';
import { getRecipe, updateRecipe } from '@/lib/api';
import { Recipe } from '@/lib/types';

function EditInner() {
  const params = useSearchParams();
  const id = params.get('id');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('No recipe selected.');
      setLoading(false);
      return;
    }
    getRecipe(id)
      .then((r) => {
        if (!r) setError('Recipe not found.');
        else setRecipe(r);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading">Loading…</div>;
  if (error || !recipe)
    return <div className="error-box" style={{ marginTop: 40 }}>{error}</div>;

  return (
    <>
      <section className="page-intro" style={{ paddingBottom: 8 }}>
        <h1>Edit <em>recipe.</em></h1>
      </section>
      <RecipeForm
        initial={recipe}
        submitLabel="Save Changes"
        onSubmit={async (input, ings) => {
          await updateRecipe(recipe.id, input, ings);
          return recipe.id;
        }}
      />
    </>
  );
}

export default function EditPage() {
  return (
    <>
      <Header showAdd={false} />
      <main className="container">
        <Suspense fallback={<div className="loading">Loading…</div>}>
          <EditInner />
        </Suspense>
      </main>
    </>
  );
}
