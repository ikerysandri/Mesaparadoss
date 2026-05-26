-- =============================================
-- MESA PARA DOS — Supabase Schema
-- Pega esto en el SQL Editor de Supabase
-- =============================================

-- Tabla de restaurantes
create table if not exists restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  visited boolean default false,
  price_range text default null,
  food_type text default null,
  lat float default 40.4168,
  lng float default -3.7038,
  created_at timestamptz default now()
);

-- Tabla de valoraciones (separada para poder actualizar sin tocar el restaurante)
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id) on delete cascade,
  sabor float,
  rcp float,
  ambiente float,
  servicio float,
  repetiria float,
  wow float,
  experiencia float,
  updated_at timestamptz default now(),
  unique(restaurant_id)
);

-- Activar Row Level Security (lectura pública, escritura pública para que funcione sin login)
alter table restaurants enable row level security;
alter table ratings enable row level security;

create policy "Public read restaurants" on restaurants for select using (true);
create policy "Public insert restaurants" on restaurants for insert with check (true);
create policy "Public update restaurants" on restaurants for update using (true);
create policy "Public delete restaurants" on restaurants for delete using (true);

create policy "Public read ratings" on ratings for select using (true);
create policy "Public insert ratings" on ratings for insert with check (true);
create policy "Public update ratings" on ratings for update using (true);
create policy "Public delete ratings" on ratings for delete using (true);

-- Vista combinada para facilitar las queries
create or replace view restaurants_with_ratings as
  select
    r.*,
    rat.sabor,
    rat.rcp,
    rat.ambiente,
    rat.servicio,
    rat.repetiria,
    rat.wow,
    rat.experiencia,
    rat.updated_at as rated_at
  from restaurants r
  left join ratings rat on r.id = rat.restaurant_id;
