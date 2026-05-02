-- VYNT Supabase setup.
-- Applied to project cveuacvoiaiadtdzqwog via Supabase MCP.

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null,
  price numeric not null,
  image text not null,
  description text not null,
  colors text[] not null default '{}',
  sizes text[] not null default '{}',
  gallery text[] not null default '{}',
  is_new boolean not null default false,
  is_featured boolean not null default false,
  subtitle text,
  scarcity_message text,
  created_at timestamptz not null default now()
);

create table if not exists public.vouchers (
  code text primary key,
  type text not null check (type in ('percent', 'fixed')),
  value numeric not null,
  min_order numeric,
  active boolean not null default true,
  usage_limit integer,
  used_count integer not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  created_at_ms bigint not null,
  customer jsonb not null,
  items jsonb not null,
  subtotal numeric not null,
  shipping numeric not null,
  discount numeric not null,
  total numeric not null,
  payment_method text not null default 'bkash',
  transaction_id text,
  voucher_code text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'shipped', 'delivered')),
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  email text primary key
);

create schema if not exists private;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

create or replace function public.increment_voucher_usage_from_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.voucher_code is not null and length(trim(new.voucher_code)) > 0 then
    update public.vouchers
    set used_count = used_count + 1
    where code = upper(new.voucher_code);
  end if;

  return new;
end;
$$;

drop trigger if exists orders_increment_voucher_usage on public.orders;
create trigger orders_increment_voucher_usage
after insert on public.orders
for each row execute function public.increment_voucher_usage_from_order();

revoke all on function public.increment_voucher_usage_from_order() from public, anon, authenticated;
revoke all on schema private from public, anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 10485760, array['image/*'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

alter table public.products enable row level security;
alter table public.vouchers enable row level security;
alter table public.orders enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "Admin users read" on public.admin_users;
create policy "Admin users read" on public.admin_users
for select to authenticated using (private.is_admin());

drop policy if exists "Public products read" on public.products;
create policy "Public products read" on public.products for select using (true);
drop policy if exists "Admin products insert" on public.products;
create policy "Admin products insert" on public.products
for insert to authenticated with check (private.is_admin());
drop policy if exists "Admin products update" on public.products;
create policy "Admin products update" on public.products
for update to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admin products delete" on public.products;
create policy "Admin products delete" on public.products
for delete to authenticated using (private.is_admin());

drop policy if exists "Public vouchers read" on public.vouchers;
create policy "Public vouchers read" on public.vouchers for select using (true);
drop policy if exists "Admin vouchers insert" on public.vouchers;
create policy "Admin vouchers insert" on public.vouchers
for insert to authenticated with check (private.is_admin());
drop policy if exists "Admin vouchers update" on public.vouchers;
create policy "Admin vouchers update" on public.vouchers
for update to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admin vouchers delete" on public.vouchers;
create policy "Admin vouchers delete" on public.vouchers
for delete to authenticated using (private.is_admin());

drop policy if exists "Public orders insert" on public.orders;
create policy "Public orders insert" on public.orders
for insert to anon with check (
  id like 'VYNT-%'
  and created_at_ms > 0
  and jsonb_typeof(customer) = 'object'
  and jsonb_typeof(items) = 'array'
  and jsonb_array_length(items) > 0
  and subtotal >= 0
  and shipping >= 0
  and discount >= 0
  and total >= 0
  and payment_method = 'bkash'
  and status = 'pending'
);
drop policy if exists "Authenticated orders insert" on public.orders;
create policy "Authenticated orders insert" on public.orders
for insert to authenticated with check (
  id like 'VYNT-%'
  and created_at_ms > 0
  and jsonb_typeof(customer) = 'object'
  and jsonb_typeof(items) = 'array'
  and jsonb_array_length(items) > 0
  and subtotal >= 0
  and shipping >= 0
  and discount >= 0
  and total >= 0
  and payment_method = 'bkash'
  and status = 'pending'
);
drop policy if exists "Admin orders select" on public.orders;
create policy "Admin orders select" on public.orders
for select to authenticated using (private.is_admin());
drop policy if exists "Admin orders update" on public.orders;
create policy "Admin orders update" on public.orders
for update to authenticated using (private.is_admin()) with check (private.is_admin());
drop policy if exists "Admin orders delete" on public.orders;
create policy "Admin orders delete" on public.orders
for delete to authenticated using (private.is_admin());

drop policy if exists "Admin product images upload" on storage.objects;
create policy "Admin product images upload" on storage.objects
for insert to authenticated with check (bucket_id = 'product-images' and private.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table public.products;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'vouchers'
  ) then
    alter publication supabase_realtime add table public.vouchers;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'orders'
  ) then
    alter publication supabase_realtime add table public.orders;
  end if;
end $$;
