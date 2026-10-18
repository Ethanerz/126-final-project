-- Confirmed contributors can manage their own replies regardless of whether
-- their database role is student or admin. Ownership remains mandatory.
begin;
drop policy if exists review_replies_student_update_own on public.review_replies;
drop policy if exists review_replies_student_delete_own on public.review_replies;
create policy replies_verified_update_own on public.review_replies for update to authenticated
 using(user_id=(select auth.uid()) and (select private.can_contribute()))
 with check(user_id=(select auth.uid()) and (select private.can_contribute()));
create policy replies_verified_delete_own on public.review_replies for delete to authenticated
 using(user_id=(select auth.uid()) and (select private.can_contribute()));
commit;
