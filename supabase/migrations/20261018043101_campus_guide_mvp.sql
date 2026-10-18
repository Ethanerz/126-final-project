-- Additive MVP upgrade for the existing RateUPV schema. No accounts, places,
-- reviews or replies are deleted. Apply to a backup/preview before production.
begin;
alter table public.entities
  add column category text,
  add column campus text not null default 'Miagao',
  add column aliases text[] not null default '{}',
  add column preparation text,
  add column source_url text,
  add column source_checked_at date,
  add column archived_at timestamptz;
alter table public.entities add constraint entities_category_valid check (category is null or category in ('Study & research','Documents & payments','Everyday essentials','Health & support','Spaces & recreation'));
alter table public.entities add constraint entities_source_https check (source_url is null or source_url ~ '^https://');
alter table public.entities add constraint entities_source_date_valid check (source_checked_at is null or (source_url is not null and source_checked_at<=current_date));
alter table public.entities add constraint entities_campus_valid check (campus in ('Miagao','Iloilo City'));
alter table public.entities alter column latitude drop not null, alter column longitude drop not null;
alter table public.entities add constraint entities_coordinates_valid check (latitude between -90 and 90 and longitude between -180 and 180) not valid;

alter table public.reviews
  add column visited_on date,
  add column display_name text not null default 'UP community member',
  add column moderation_status text not null default 'published';
alter table public.reviews add constraint reviews_display_name_valid check (char_length(btrim(display_name)) between 2 and 40);
alter table public.reviews add constraint reviews_status_valid check (moderation_status in ('published','hidden'));
alter table public.reviews add constraint reviews_visit_valid check (visited_on is null or (visited_on >= '2000-01-01' and visited_on <= current_date));
alter table public.reviews add constraint reviews_text_length check (char_length(btrim(review_text)) between 20 and 2000) not valid;
alter table public.reviews add constraint reviews_title_length check (title is null or char_length(btrim(title)) between 1 and 120) not valid;

-- Stop exposing legal names as the public identity of review/reply authors.
-- Owners can still read/edit their existing profile. New reviews carry an
-- explicitly public display name; old reviews retain all their original text.
drop policy if exists user_profiles_select_content_authors on public.user_profiles;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create function private.is_moderator() returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.user_profiles where id=(select auth.uid()) and role='admin'); $$;
revoke all on function private.is_moderator() from public, anon;
grant execute on function private.is_moderator() to authenticated;

drop policy if exists reviews_allow_public_read on public.reviews;
drop policy if exists reviews_select_signed_in on public.reviews;
create policy reviews_public_visible on public.reviews for select to anon using (moderation_status='published');
create policy reviews_authenticated_visible on public.reviews for select to authenticated using (moderation_status='published' or user_id=(select auth.uid()) or (select private.is_moderator()));
drop policy if exists review_replies_allow_public_read on public.review_replies;
drop policy if exists review_replies_select_signed_in on public.review_replies;
create policy replies_visible_parent on public.review_replies for select to anon,authenticated using (exists(select 1 from public.reviews r where r.id=review_id and r.moderation_status='published'));
create policy reviews_admin_moderate on public.reviews for update to authenticated using ((select private.is_moderator())) with check ((select private.is_moderator()));
-- Limit editable columns; neither authors nor moderators can forge vote totals.
revoke insert, update on public.reviews from authenticated;
grant insert(entity_id,user_id,rating,title,review_text,visited_on,display_name) on public.reviews to authenticated;
grant update(rating,title,review_text,visited_on,display_name,moderation_status) on public.reviews to authenticated;

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity_id uuid references public.entities(id) on delete set null,
  review_id uuid references public.reviews(id) on delete set null,
  kind text not null check (kind in ('correction','missing_place','report','deletion')),
  details text not null check (char_length(btrim(details)) between 15 and 2000),
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  moderator_note text check (char_length(moderator_note)<=2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.submissions enable row level security;
grant select on public.submissions to authenticated;
grant insert(user_id,entity_id,review_id,kind,details) on public.submissions to authenticated;
grant update(status,moderator_note) on public.submissions to authenticated;
revoke all on public.submissions from anon;
create policy submissions_own_or_admin on public.submissions for select to authenticated using (user_id=(select auth.uid()) or (select private.is_moderator()));
-- auth.users isn't exposed to clients: use a guarded internal eligibility check.
create function private.can_contribute() returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from auth.users u join public.user_profiles p on p.id=u.id where u.id=(select auth.uid()) and u.email_confirmed_at is not null and lower(u.email) like '%@up.edu.ph' and p.role in ('student','admin')); $$;
revoke all on function private.can_contribute() from public,anon;
grant execute on function private.can_contribute() to authenticated;
create policy submissions_verified_insert on public.submissions for insert to authenticated with check (user_id=(select auth.uid()) and (select private.can_contribute()));
create policy submissions_moderator_update on public.submissions for update to authenticated using ((select private.is_moderator())) with check ((select private.is_moderator()));
create index submissions_user_idx on public.submissions(user_id);
create index submissions_entity_idx on public.submissions(entity_id);
create index submissions_review_idx on public.submissions(review_id);
create index submissions_queue_idx on public.submissions(status,created_at desc);

-- Review eligibility is checked in the database, including mailbox confirmation.
drop policy if exists reviews_student_insert_own on public.reviews;
create policy reviews_verified_insert on public.reviews for insert to authenticated with check (user_id=(select auth.uid()) and (select private.can_contribute()));
drop policy if exists review_replies_student_insert_own on public.review_replies;
create policy replies_verified_insert on public.review_replies for insert to authenticated with check (user_id=(select auth.uid()) and (select private.can_contribute()) and exists(select 1 from public.reviews where id=review_id and moderation_status='published'));

-- Moderation is retained separately from author edits, so editing cannot unhide
-- a moderated review. Existing owner RLS remains the authorization check.
create function private.guard_review_write() returns trigger
language plpgsql security invoker set search_path=''
as $$ begin
  if TG_OP='UPDATE' and new.moderation_status is distinct from old.moderation_status and not private.is_moderator() then
    raise exception 'Only a moderator can change content visibility.';
  end if;
  new.updated_at=now();
  return new;
end $$;
revoke all on function private.guard_review_write() from public,anon,authenticated;
create trigger reviews_guard_write before update on public.reviews for each row execute function private.guard_review_write();

-- Keep review history; archive places rather than deleting them in the editor.
create policy entities_shared_admin_update on public.entities for update to authenticated using ((select private.is_moderator())) with check ((select private.is_moderator()));
create index reviews_entity_created_idx on public.reviews(entity_id,created_at desc);

-- Category tags are classifications inferred from existing names, not new
-- claims about requirements, opening times, accessibility or pin accuracy.
update public.entities set category=case
 when lower(name) ~ 'library|rrc|research|print' then 'Study & research'
 when lower(name) ~ 'admin|cash|registrar' and lower(name) !~ 'atm' then 'Documents & payments'
 when lower(name) ~ 'comfort|atm|food|canteen' then 'Everyday essentials'
 when lower(name) ~ 'health|clinic|support|osa|guidance' then 'Health & support'
 else 'Spaces & recreation' end where category is null;
update public.entities set aliases=array['library','study','books','reading'] where name='UPV New Library';
update public.entities set aliases=array['pay','payment','cashier','fees'] where name='New Admin Cash Office';
update public.entities set aliases=array['cash','withdraw','bank','atm'] where name='New Admin LandBank ATM';
update public.entities set aliases=array['toilet','restroom','bathroom','CR'] where name ilike '%Comfort%';

-- Editorial starter information, paraphrased from fetched first-party sources.
-- The checked date records reading the source, not an on-site inspection.
update public.entities set
 preparation='For payments related to academic document requests, consult the Registrar’s payment-options page first. It describes in-person and online payment routes. For online payments, keep the billing statement and payment evidence and follow the source’s receipt instructions. Confirm the applicable process with the Cash Office before paying; this guide does not confirm opening hours.',
 source_url='https://our.upv.edu.ph/index.php/payment-options',
 source_checked_at='2026-10-18',
 contact_info='{"Email":"cash.upvisayas@up.edu.ph","Miagao telephone":"(033) 315-2277"}'::jsonb
 where name='New Admin Cash Office' and source_url is null;
update public.entities set
 preparation='The university announced the i2i Makerspace in 2025, including 3D printing and scanning equipment. Before taking a project there, ask the Engineering Section about present availability, file requirements, costs and scheduling. Those practical details have not been confirmed by this guide.',
 source_url='https://ovcre.upv.edu.ph/rrc-launches-more-spaces-and-services-for-ideas-and-innovations/',
 source_checked_at='2026-10-18',
 contact_info='{"Engineering Section":"engg.rrc@upv.edu.ph","RRC":"rrc.upvisayas@up.edu.ph"}'::jsonb
 where name in ('UPV RRC','UPV RRC 3D Printing Service') and source_url is null;
commit;
