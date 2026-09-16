-- One row per counted visit: only the country Vercel derives from the IP and the time. No IP is stored.
create table if not exists public.visits (
  id bigserial primary key,
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  created_at timestamptz not null default now()
);
create index if not exists visits_created_at_idx on public.visits (created_at desc);
alter table public.visits enable row level security;

drop function if exists public.record_view();
create or replace function public.record_view(p_country text default null)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.visits (country) values (p_country);
  update public.site_stats set views = views + 1 where id = 1 returning views;
$$;

revoke execute on function public.record_view(text) from public, anon, authenticated;
grant execute on function public.record_view(text) to service_role;
