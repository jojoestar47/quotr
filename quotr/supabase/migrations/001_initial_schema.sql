-- ============================================================
-- QUOTR — Initial Schema
-- Run this in the Supabase SQL editor once after creating
-- your project. It sets up all tables, RLS policies, and
-- a trigger to auto-create user profiles on sign-up.
-- ============================================================


-- ── EXTENSIONS ────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ── USER PROFILES ─────────────────────────────────────────
-- Extends auth.users with role and display name.
-- Created automatically via trigger on invite/sign-up.

create table public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null default '',
  last_name   text not null default '',
  role        text not null default 'staff' check (role in ('staff', 'admin')),
  created_at  timestamptz not null default now()
);

-- Trigger: create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── PRODUCTS ──────────────────────────────────────────────

create table public.products (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  code          text not null,
  category      text not null default '',
  size          text not null default '',
  material      text not null default '',
  price         numeric(10,2) not null default 0,
  stock_status  text not null default 'in' check (stock_status in ('in', 'low', 'out')),
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();


-- ── QUOTES ────────────────────────────────────────────────

create table public.quotes (
  id              uuid primary key default uuid_generate_v4(),
  quote_number    text not null unique,
  customer_name   text not null default '',
  customer_phone  text not null default '',
  customer_email  text not null default '',
  discount_pct    numeric(5,2) not null default 0,
  subtotal        numeric(10,2) not null default 0,
  total           numeric(10,2) not null default 0,
  status          text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'expired')),
  created_by      uuid not null references public.user_profiles(id),
  created_at      timestamptz not null default now(),
  sent_at         timestamptz
);


-- ── QUOTE LINES ───────────────────────────────────────────

create table public.quote_lines (
  id              uuid primary key default uuid_generate_v4(),
  quote_id        uuid not null references public.quotes(id) on delete cascade,
  product_id      uuid references public.products(id) on delete set null,
  product_name    text not null,
  product_code    text not null,
  unit_price      numeric(10,2) not null,
  quantity        integer not null default 1 check (quantity > 0),
  line_total      numeric(10,2) not null,
  note            text not null default '',
  sort_order      integer not null default 0
);


-- ── SETTINGS ──────────────────────────────────────────────

create table public.settings (
  key    text primary key,
  value  text not null default ''
);

-- Seed default settings
insert into public.settings (key, value) values
  ('business_name',   ''),
  ('business_phone',  ''),
  ('business_email',  ''),
  ('quote_footer',    'All prices excl. GST. Valid for 30 days.'),
  ('next_quote_num',  '1');


-- ── ROW LEVEL SECURITY ────────────────────────────────────
-- All tables are protected. Users must be authenticated.
-- Admins have full access. Staff have read-only on products
-- and full access to their own quotes only.

alter table public.user_profiles enable row level security;
alter table public.products      enable row level security;
alter table public.quotes        enable row level security;
alter table public.quote_lines   enable row level security;
alter table public.settings      enable row level security;

-- Helper: get current user role without recursion
create or replace function public.current_user_role()
returns text language sql security definer stable as $$
  select role from public.user_profiles where id = auth.uid();
$$;


-- user_profiles
create policy "Users can read own profile"
  on public.user_profiles for select
  using (id = auth.uid() or public.current_user_role() = 'admin');

create policy "Admins can update any profile"
  on public.user_profiles for update
  using (public.current_user_role() = 'admin');

create policy "Admins can delete profiles"
  on public.user_profiles for delete
  using (public.current_user_role() = 'admin');


-- products (all authenticated users can read active products)
create policy "Authenticated users can read active products"
  on public.products for select
  using (auth.uid() is not null and (active = true or public.current_user_role() = 'admin'));

create policy "Admins can insert products"
  on public.products for insert
  with check (public.current_user_role() = 'admin');

create policy "Admins can update products"
  on public.products for update
  using (public.current_user_role() = 'admin');

create policy "Admins can delete products"
  on public.products for delete
  using (public.current_user_role() = 'admin');


-- quotes (staff see own, admins see all)
create policy "Staff see own quotes, admins see all"
  on public.quotes for select
  using (created_by = auth.uid() or public.current_user_role() = 'admin');

create policy "Authenticated users can insert quotes"
  on public.quotes for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "Staff update own quotes, admins update all"
  on public.quotes for update
  using (created_by = auth.uid() or public.current_user_role() = 'admin');

create policy "Staff delete own draft quotes, admins delete all"
  on public.quotes for delete
  using (
    (created_by = auth.uid() and status = 'draft')
    or public.current_user_role() = 'admin'
  );


-- quote_lines (access mirrors parent quote)
create policy "Quote lines follow quote access"
  on public.quote_lines for select
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id
      and (q.created_by = auth.uid() or public.current_user_role() = 'admin')
    )
  );

create policy "Authenticated users can insert quote lines"
  on public.quote_lines for insert
  with check (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id and q.created_by = auth.uid()
    )
  );

create policy "Quote line update mirrors quote update"
  on public.quote_lines for update
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id
      and (q.created_by = auth.uid() or public.current_user_role() = 'admin')
    )
  );

create policy "Quote line delete mirrors quote delete"
  on public.quote_lines for delete
  using (
    exists (
      select 1 from public.quotes q
      where q.id = quote_id
      and (q.created_by = auth.uid() or public.current_user_role() = 'admin')
    )
  );


-- settings (all authenticated users read, only admins write)
create policy "Authenticated users can read settings"
  on public.settings for select
  using (auth.uid() is not null);

create policy "Admins can update settings"
  on public.settings for update
  using (public.current_user_role() = 'admin');


-- ── SEED PRODUCTS ─────────────────────────────────────────
-- Sample data. Replace or extend with your real catalogue.
-- Delete these rows in the Supabase table editor before go-live.

insert into public.products (name, code, category, size, material, price, stock_status) values
  ('Heritage Panel Door',    'HD-102', 'Entry',     '2040×920mm',  'Timber',       890.00,  'in'),
  ('Heritage Panel Door',    'HD-103', 'Entry',     '2040×820mm',  'Timber',       860.00,  'in'),
  ('Grand Arch Entry',       'GA-201', 'Entry',     '2400×1000mm', 'Hardwood',    2150.00,  'low'),
  ('Stacking Bi-fold 4P',    'BF-401', 'French',    '2100×3600mm', 'Aluminium',   3400.00,  'in'),
  ('Stacking Bi-fold 6P',    'BF-601', 'French',    '2100×5400mm', 'Aluminium',   4900.00,  'in'),
  ('French Door Pair',       'FD-201', 'French',    '2040×1200mm', 'Timber',      1480.00,  'in'),
  ('Flush Modern Slab',      'MS-101', 'Modern',    '2040×920mm',  'MDF/Veneer',   420.00,  'in'),
  ('Flush Modern Slab',      'MS-102', 'Modern',    '2040×820mm',  'MDF/Veneer',   395.00,  'in'),
  ('Vertical Groove Slab',   'VG-301', 'Modern',    '2040×920mm',  'MDF',          510.00,  'in'),
  ('Fire Door FD30',         'FR-301', 'Fire Rated','2040×920mm',  'Composite',    740.00,  'low'),
  ('Fire Door FD60',         'FR-601', 'Fire Rated','2040×920mm',  'Composite',    980.00,  'in'),
  ('Glazed Interior Single', 'GI-201', 'Interior',  '2040×820mm',  'Timber/Glass', 650.00,  'in'),
  ('Solid Interior Passage', 'IP-101', 'Interior',  '2040×820mm',  'Pine',         185.00,  'in'),
  ('Solid Interior Passage', 'IP-102', 'Interior',  '2040×920mm',  'Pine',         195.00,  'in'),
  ('Cavity Slider Single',   'CS-101', 'Interior',  '2040×820mm',  'MDF',          320.00,  'out');
