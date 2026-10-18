-- Disposable fixtures exist only inside this transaction. No auth email is sent.
-- Run through the Supabase SQL tool as postgres; every fixture is rolled back.
begin;
select set_config('rateupv_test.student',gen_random_uuid()::text,true),
       set_config('rateupv_test.other',gen_random_uuid()::text,true),
       set_config('rateupv_test.admin',gen_random_uuid()::text,true),
       set_config('rateupv_test.place',gen_random_uuid()::text,true),
       set_config('rateupv_test.review',gen_random_uuid()::text,true);
insert into auth.users(id,email,email_confirmed_at,aud,role)
select current_setting('rateupv_test.'||who)::uuid,
       'rateupv-transaction-test-'||current_setting('rateupv_test.'||who)||'@up.edu.ph',now(),'authenticated','authenticated'
from unnest(array['student','other','admin']) as who;
update public.user_profiles set role='admin' where id=current_setting('rateupv_test.admin')::uuid;
insert into public.entities(id,name,entity_type,latitude,longitude,admin_id)
values(current_setting('rateupv_test.place')::uuid,'ROLLBACK ONLY: test place','facility',10.64,122.22,current_setting('rateupv_test.admin')::uuid);
insert into public.reviews(id,entity_id,user_id,rating,title,review_text,display_name,visited_on)
values(current_setting('rateupv_test.review')::uuid,current_setting('rateupv_test.place')::uuid,current_setting('rateupv_test.student')::uuid,4,'ROLLBACK ONLY','This is a transactional fixture and will never be committed.','Fixture pseudonym','2026-09-01');
set local role anon;
do $$ begin
  if (select count(*) from public.reviews where id=current_setting('rateupv_test.review')::uuid)<>1 then raise exception 'Public read failed'; end if;
  if (select count(*) from public.user_profiles where id=current_setting('rateupv_test.student')::uuid)<>0 then raise exception 'Profile privacy failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('rateupv_test.student'),true);
set local role authenticated;
insert into public.submissions(user_id,entity_id,kind,details) values(current_setting('rateupv_test.student')::uuid,current_setting('rateupv_test.place')::uuid,'correction','ROLLBACK ONLY: verify this entry with its source.');
update public.reviews set display_name='Updated fixture name' where id=current_setting('rateupv_test.review')::uuid;
do $$ begin
  if (select display_name from public.reviews where id=current_setting('rateupv_test.review')::uuid)<>'Updated fixture name' then raise exception 'Own review update failed'; end if;
  if (select count(*) from public.submissions where entity_id=current_setting('rateupv_test.place')::uuid)<>1 then raise exception 'Own submission read failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('rateupv_test.other'),true);
set local role authenticated;
do $$ declare changed_count integer; begin
  if (select count(*) from public.submissions where entity_id=current_setting('rateupv_test.place')::uuid)<>0 then raise exception 'Submission privacy failed'; end if;
  update public.reviews set display_name='Forged name' where id=current_setting('rateupv_test.review')::uuid;
  get diagnostics changed_count=row_count;
  if changed_count<>0 then raise exception 'Cross-author write was allowed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub',current_setting('rateupv_test.admin'),true);
set local role authenticated;
insert into public.review_replies(review_id,user_id,reply_text) values(current_setting('rateupv_test.review')::uuid,current_setting('rateupv_test.admin')::uuid,'ROLLBACK ONLY: a moderator author’s reply.');
do $$ declare changed_count integer; begin
 delete from public.review_replies where review_id=current_setting('rateupv_test.review')::uuid and user_id=current_setting('rateupv_test.admin')::uuid;
 get diagnostics changed_count=row_count;
 if changed_count<>1 then raise exception 'Admin author could not delete own reply'; end if;
end $$;
update public.submissions set status='reviewing',moderator_note='ROLLBACK ONLY: verified moderator response.' where entity_id=current_setting('rateupv_test.place')::uuid;
update public.reviews set moderation_status='hidden' where id=current_setting('rateupv_test.review')::uuid;
do $$ begin
  if (select status from public.submissions where entity_id=current_setting('rateupv_test.place')::uuid)<>'reviewing' then raise exception 'Moderator update failed'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','',true);
set local role anon;
do $$ begin
  if (select count(*) from public.reviews where id=current_setting('rateupv_test.review')::uuid)<>0 then raise exception 'Hidden review visible to public'; end if;
end $$;
reset role;
rollback;
select 'PASS: live public read, private profiles, own contribution, private submissions, cross-author denial and moderator visibility; all fixtures rolled back.' as verification;
