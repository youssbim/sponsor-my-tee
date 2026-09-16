-- The fundraising goal shown on the site, editable from the admin.
alter table public.site_stats add column if not exists goal integer not null default 1500 check (goal > 0);
