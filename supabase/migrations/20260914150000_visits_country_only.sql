-- The feed only shows visits with a known country; visits without one (local dev, previews) still count.
create or replace function public.record_view(p_country text default null)
returns bigint
language sql
security definer
set search_path = public
as $$
  insert into public.visits (country) select p_country where p_country is not null;
  update public.site_stats set views = views + 1 where id = 1 returning views;
$$;

delete from public.visits where country is null;
