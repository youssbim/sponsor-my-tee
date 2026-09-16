-- One Black Tee: auction for print spots on a black tee.
-- Only the server (secret key) touches these tables; RLS is on with no policies.

create table public.bids (
  id uuid primary key default gen_random_uuid(),
  spot_id text not null,
  amount integer not null check (amount > 0),
  deposit integer not null check (deposit > 0),
  brand text not null check (char_length(brand) between 1 and 60),
  url text,
  x_handle text,
  email text not null,
  logo_path text not null,
  logo_includes_name boolean not null default false,
  lang text not null default 'en' check (lang in ('en', 'it')),
  bidder_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'outbid', 'rejected', 'expired')),
  approved_at timestamptz,
  stripe_session_id text,
  stripe_payment_intent text,
  refunded_at timestamptz,
  refund_id text,
  balance_session_id text,
  balance_paid_at timestamptz,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  outbid_at timestamptz,
  rejected_at timestamptz
);

create index bids_spot_status_idx on public.bids (spot_id, status);
create index bids_bidder_idx on public.bids (bidder_id, created_at desc);
-- At most one leader per spot, enforced by the database.
create unique index bids_one_active_per_spot on public.bids (spot_id) where status = 'active';

create table public.badge_claims (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 60),
  url text,
  x_handle text,
  email text not null,
  amount integer not null check (amount > 0),
  lang text not null default 'en' check (lang in ('en', 'it')),
  bidder_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'held', 'late', 'expired')),
  hidden boolean not null default false,
  stripe_session_id text,
  stripe_payment_intent text,
  refunded_at timestamptz,
  refund_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index badge_claims_status_idx on public.badge_claims (status, paid_at desc);
create index badge_claims_bidder_idx on public.badge_claims (bidder_id, created_at desc);

create table public.site_stats (
  id smallint primary key default 1 check (id = 1),
  views bigint not null default 0
);
insert into public.site_stats (id, views) values (1, 0) on conflict do nothing;

alter table public.bids enable row level security;
alter table public.badge_claims enable row level security;
alter table public.site_stats enable row level security;

-- Confirms a paid bid. Serialised per spot so two payments can't both lead.
create or replace function public.confirm_bid(p_bid uuid, p_payment_intent text, p_increment integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bid public.bids;
  v_leader public.bids;
  v_has_leader boolean;
begin
  select * into v_bid from public.bids where id = p_bid for update;
  if not found then
    return jsonb_build_object('outcome', 'missing');
  end if;
  if v_bid.status <> 'pending' then
    return jsonb_build_object('outcome', 'noop');
  end if;

  perform pg_advisory_xact_lock(hashtext('spot:' || v_bid.spot_id));

  select * into v_leader from public.bids
    where spot_id = v_bid.spot_id and status = 'active'
    for update;
  v_has_leader := found;

  if v_has_leader and v_bid.amount < v_leader.amount + p_increment then
    update public.bids
      set status = 'outbid', stripe_payment_intent = p_payment_intent, confirmed_at = now(), outbid_at = now()
      where id = v_bid.id;
    return jsonb_build_object('outcome', 'late');
  end if;

  if v_has_leader then
    update public.bids set status = 'outbid', outbid_at = now() where id = v_leader.id;
  end if;

  update public.bids
    set status = 'active', stripe_payment_intent = p_payment_intent, confirmed_at = now()
    where id = v_bid.id;

  return jsonb_build_object('outcome', 'leading', 'displaced', case when v_has_leader then v_leader.id end);
end;
$$;

-- Confirms a paid badge claim. The first payment at or above the current price wins.
create or replace function public.confirm_badge_claim(p_claim uuid, p_payment_intent text, p_start integer, p_step integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_claim public.badge_claims;
  v_holder public.badge_claims;
  v_min integer;
begin
  select * into v_claim from public.badge_claims where id = p_claim for update;
  if not found then
    return jsonb_build_object('outcome', 'missing');
  end if;
  if v_claim.status <> 'pending' then
    return jsonb_build_object('outcome', 'noop');
  end if;

  perform pg_advisory_xact_lock(hashtext('badge'));

  select * into v_holder from public.badge_claims
    where status = 'held' and paid_at is not null
    order by paid_at desc
    limit 1;

  if found then
    v_min := v_holder.amount + p_step;
  else
    v_min := p_start;
  end if;

  if v_claim.amount < v_min then
    update public.badge_claims
      set status = 'late', stripe_payment_intent = p_payment_intent, paid_at = now()
      where id = v_claim.id;
    return jsonb_build_object('outcome', 'late');
  end if;

  update public.badge_claims
    set status = 'held', stripe_payment_intent = p_payment_intent, paid_at = now()
    where id = v_claim.id;

  return jsonb_build_object('outcome', 'held', 'previous', v_holder.id);
end;
$$;

create or replace function public.record_view()
returns bigint
language sql
security definer
set search_path = public
as $$
  update public.site_stats set views = views + 1 where id = 1 returning views;
$$;

-- These functions skip RLS, so nobody but the server may call them.
revoke execute on function public.confirm_bid(uuid, text, integer) from public, anon, authenticated;
revoke execute on function public.confirm_badge_claim(uuid, text, integer, integer) from public, anon, authenticated;
revoke execute on function public.record_view() from public, anon, authenticated;
grant execute on function public.confirm_bid(uuid, text, integer) to service_role;
grant execute on function public.confirm_badge_claim(uuid, text, integer, integer) to service_role;
grant execute on function public.record_view() to service_role;

-- Public bucket for approved logos (read by URL; uploads go through the server).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', true, 4194304, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
on conflict (id) do nothing;
