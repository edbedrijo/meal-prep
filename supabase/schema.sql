-- =============================================================
-- Meal Prep Recipe Book - Supabase schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- =============================================================

-- ---------- RECIPES ----------
create table if not exists recipes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  source_url    text,                 -- TikTok / Facebook link
  source_type   text default 'manual',-- 'tiktok' | 'facebook' | 'manual' | 'other'
  source_caption text,                -- pasted caption text from the post
  image_url     text,
  category      text,                 -- e.g. 'Beef', 'Chicken', 'Pork'
  servings      integer default 2,    -- base servings the recipe is written for
  prep_minutes  integer,
  cook_minutes  integer,
  instructions  text,                 -- step-by-step, newline separated
  notes         text,
  is_favorite   boolean default false,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- ---------- INGREDIENTS ----------
-- Every ingredient is tied to a recipe. The "base_recipe" anchor (e.g. 1kg
-- ground beef) is just a normal ingredient flagged with is_scaling_anchor.
-- Scaling: factor = (have_amount / anchor.amount). All amounts * factor.
create table if not exists ingredients (
  id                uuid primary key default gen_random_uuid(),
  recipe_id         uuid not null references recipes(id) on delete cascade,
  name              text not null,
  amount            numeric,          -- numeric quantity (nullable for "to taste")
  unit              text,             -- 'g','kg','ml','l','tbsp','tsp','cup','pc','clove','pinch'
  is_scaling_anchor boolean default false, -- the main protein you measure against
  position          integer default 0,     -- display order
  note              text,             -- e.g. 'finely chopped'
  -- macros PER the listed amount (not per 100g) for simplicity
  kcal              numeric,
  protein_g         numeric,
  carbs_g           numeric,
  fat_g             numeric,
  created_at        timestamptz default now()
);

create index if not exists idx_ingredients_recipe on ingredients(recipe_id);
create index if not exists idx_recipes_category on recipes(category);

-- ---------- updated_at trigger ----------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_recipes_updated on recipes;
create trigger trg_recipes_updated
  before update on recipes
  for each row execute function set_updated_at();

-- ---------- RLS (open access, no auth) ----------
-- You chose "no auth, fully open". The anon key + these policies allow
-- full read/write from the browser. If you ever want to lock it down,
-- replace `true` with auth.uid() checks.
alter table recipes enable row level security;
alter table ingredients enable row level security;

drop policy if exists "open_recipes" on recipes;
create policy "open_recipes" on recipes
  for all using (true) with check (true);

drop policy if exists "open_ingredients" on ingredients;
create policy "open_ingredients" on ingredients
  for all using (true) with check (true);
