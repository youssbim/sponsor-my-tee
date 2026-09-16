-- Nudges a logo inside its spot, in percent of the spot's width/height. Set from the admin.
alter table public.bids
  add column if not exists logo_offset_x integer not null default 0 check (logo_offset_x between -100 and 100),
  add column if not exists logo_offset_y integer not null default 0 check (logo_offset_y between -100 and 100);
