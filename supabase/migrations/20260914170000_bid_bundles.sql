-- Several bids paid in one checkout (taking every spot of the lead buyer at once) share a bundle id.
alter table public.bids add column if not exists bundle_id uuid;
create index if not exists bids_bundle_id_idx on public.bids (bundle_id) where bundle_id is not null;
