'use client';

import Header from '@/components/Header';
import RecipeForm from '@/components/RecipeForm';
import { createRecipe } from '@/lib/api';

export default function AddPage() {
  return (
    <>
      <Header showAdd={false} />
      <main className="container">
        <section className="page-intro" style={{ paddingBottom: 8 }}>
          <h1>Log a <em>new recipe.</em></h1>
        </section>
        <RecipeForm
          submitLabel="Save Recipe"
          onSubmit={(input, ings) => createRecipe(input, ings)}
        />
      </main>
    </>
  );
}
