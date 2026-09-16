-- How big a logo is drawn inside its spot, in percent of the fitted size. Set from the admin.
alter table public.bids
  add column if not exists logo_scale integer not null default 100
  check (logo_scale between 25 and 400);
