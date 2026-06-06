'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import { getRecipes, toggleFavorite } from '@/lib/api';
import { Recipe } from '@/lib/types';
import { sourceLabel } from '@/lib/source';

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('All');

  useEffect(() => {
    getRecipes()
      .then(setRecipes)
      .catch((e) => setError(e.message || 'Failed to load recipes'))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach((r) => r.category && set.add(r.category));
    return ['All', 'Favorites', ...Array.from(set).sort()];
  }, [recipes]);

  const filtered = useMemo(() => {
    return recipes.filter((r) => {
      const matchCat =
        activeCat === 'All' ||
        (activeCat === 'Favorites' ? r.is_favorite : r.category === activeCat);
      const q = search.trim().toLowerCase();
      const matchSearch =
        q === '' ||
        r.title.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [recipes, search, activeCat]);

  async function handleFav(e: React.MouseEvent, r: Recipe) {
    e.preventDefault();
    e.stopPropagation();
    const next = !r.is_favorite;
    setRecipes((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, is_favorite: next } : x))
    );
    try {
      await toggleFavorite(r.id, next);
    } catch {
      // revert on failure
      setRecipes((prev) =>
        prev.map((x) => (x.id === r.id ? { ...x, is_favorite: !next } : x))
      );
    }
  }

  return (
    <>
      <Header />
      <main className="container">
        <section className="page-intro">
          <h1>
            The recipes worth <em>cooking twice.</em>
          </h1>
          <p>
            Everything you found scrolling, kept in one place. Tell it how much
            meat you have and it rescales the whole thing for you.
          </p>
        </section>

        <div className="toolbar">
          <div className="search">
            <input
              placeholder="Search recipes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="chip-row">
            {categories.map((c) => (
              <button
                key={c}
                className={`chip ${activeCat === c ? 'active' : ''}`}
                onClick={() => setActiveCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {loading && <div className="loading">Loading recipes…</div>}
        {error && <div className="error-box">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="empty">
            <div className="big">🍳</div>
            <p>No recipes yet. Add the first one you saved.</p>
            <Link href="/add" className="btn btn-accent" style={{ marginTop: 18 }}>
              + New Recipe
            </Link>
          </div>
        )}

        <div className="grid">
          {filtered.map((r) => (
            <Link key={r.id} href={`/recipe?id=${r.id}`} className="card">
              <button
                className="fav-star"
                onClick={(e) => handleFav(e, r)}
                aria-label="favorite"
              >
                {r.is_favorite ? '★' : '☆'}
              </button>
              {r.image_url ? (
                <div
                  className="card-img"
                  style={{ backgroundImage: `url(${r.image_url})` }}
                />
              ) : (
                <div className="card-img placeholder">🍽</div>
              )}
              <div className="card-body">
                <div className="tag">
                  {r.category || sourceLabel(r.source_type)}
                </div>
                <h3>{r.title}</h3>
                <div className="meta">
                  <span>{r.servings} servings</span>
                  {r.cook_minutes ? <span>{r.cook_minutes} min</span> : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
