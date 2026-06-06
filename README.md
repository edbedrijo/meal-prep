# Pantry & Plate — Recipe Book

A scaling recipe logbook for Ed & Chantal. Save recipes you find on TikTok / Facebook, then tell it how much meat you actually have and it rescales every ingredient, seasoning, and macro live.

Stack: Next.js (static export) + Supabase (Postgres) + GitHub Pages.

---

## How the scaler works

Each recipe has one ingredient marked as the **scaling anchor** (★) — usually your main protein, e.g. `1000 g ground beef`. On the recipe page you type how much you actually have (e.g. `500`). The app computes:

```
factor = have_amount / anchor_amount   (500 / 1000 = 0.5)
```

Then multiplies every ingredient amount and every macro by that factor. Servings scale too. Salt/pepper marked "to taste" (no amount) stay as-is.

---

## One-time setup

### 1. Create the Supabase project
1. Go to supabase.com, create a free project.
2. Open **SQL Editor → New Query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The anon key is safe to expose in the browser. It is protected by Row Level Security. The schema sets fully-open policies because you chose no auth.

### 2. Add the keys to GitHub
In the repo: **Settings → Secrets and variables → Actions → New repository secret**. Add both:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Turn on GitHub Pages
**Settings → Pages → Build and deployment → Source: GitHub Actions.**

### 4. Push
```bash
git add .
git commit -m "Initial recipe book"
git push origin main
```

The Action builds and deploys automatically. Your site lands at:
```
https://edbedrijo.github.io/meal-prep/
```

---

## Local development

```bash
cp .env.local.example .env.local   # then paste your real Supabase keys
npm install
npm run dev                         # http://localhost:3000
```

---

## A note on TikTok / Facebook auto-import

A static site (no backend server) cannot scrape TikTok or Facebook — they block bots and require auth, and browser CORS prevents direct fetching. So the flow is:

1. Paste the **URL** (it's saved + linked, source auto-detected).
2. Paste the **caption text** from the post into the caption box.
3. Type the ingredients into the structured fields (this is what powers scaling).

If you ever want true auto-import, that needs a small backend (a serverless function calling a scraping API). The current build is the version that works reliably for free on GitHub Pages.

---

## Project structure

```
app/
  page.tsx          # recipe list + search + category filter
  add/page.tsx      # add a recipe
  edit/page.tsx     # edit a recipe (/edit?id=...)
  recipe/page.tsx   # recipe detail + live scaler (/recipe?id=...)
components/
  Header.tsx
  RecipeForm.tsx    # shared add/edit form with ingredient + macro editor
lib/
  supabase.ts       # client
  api.ts            # CRUD
  scaling.ts        # the scaling engine
  units.ts          # metric + optional US conversion
  types.ts
  source.ts         # TikTok/FB URL detection
supabase/schema.sql # run this in Supabase
```

Routes use `?id=` query params instead of dynamic paths so static export works without knowing recipe IDs at build time.
