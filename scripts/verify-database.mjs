// Runs the real migration against an isolated Postgres engine. The fixture models
// the relevant legacy schema/permissions; it never connects to the live project.
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import assert from "node:assert/strict";
const db = new PGlite();
const alice = "11111111-1111-4111-8111-111111111111",
  bob = "22222222-2222-4222-8222-222222222222",
  admin = "33333333-3333-4333-8333-333333333333",
  unconfirmed = "44444444-4444-4444-8444-444444444444";
const place = "55555555-5555-4555-8555-555555555555",
  review = "66666666-6666-4666-8666-666666666666";
await db.exec(`
create role anon; create role authenticated; create schema auth;
create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz);
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
create type public.user_role as enum ('guest','student','admin','dept_admin');
create table public.user_profiles(id uuid primary key references auth.users(id),full_name text,student_id text,role public.user_role);
create table public.entities(id uuid primary key default gen_random_uuid(),name text not null,entity_type text not null,description text,latitude float8 not null,longitude float8 not null,address text,operating_hours jsonb,contact_info jsonb,image_link text,admin_id uuid references auth.users(id));
create table public.reviews(id uuid primary key default gen_random_uuid(),entity_id uuid not null references public.entities(id) on delete cascade,user_id uuid not null references public.user_profiles(id),rating int check(rating between 1 and 5),title text,review_text text not null,created_at timestamptz default now(),updated_at timestamptz default now(),upvote_count int default 0,downvote_count int default 0,unique(entity_id,user_id));
create table public.review_replies(id uuid primary key default gen_random_uuid(),review_id uuid references public.reviews(id) on delete cascade,user_id uuid references public.user_profiles(id),reply_text text,parent_reply_id uuid,created_at timestamptz default now());
alter table user_profiles enable row level security;alter table entities enable row level security;alter table reviews enable row level security;alter table review_replies enable row level security;
grant select on entities,reviews,review_replies to anon,authenticated;grant insert,update,delete on entities,reviews,review_replies to authenticated;
grant select(id,full_name,role) on user_profiles to anon,authenticated;grant update(full_name) on user_profiles to authenticated;
create function public.my_user_role() returns public.user_role language sql stable security definer set search_path='' as $$select role from public.user_profiles where id=(select auth.uid())$$;
revoke all on function public.my_user_role() from public;grant execute on function public.my_user_role() to authenticated;
create policy user_profiles_select_content_authors on user_profiles for select using(true);
create policy user_profiles_select_own on user_profiles for select to authenticated using(id=(select auth.uid()));
create policy entities_read on entities for select using(true);
create policy entities_admin_insert on entities for insert to authenticated with check(admin_id=(select auth.uid()) and (select my_user_role())='admin');
create policy reviews_allow_public_read on reviews for select using(true);
create policy reviews_select_signed_in on reviews for select to authenticated using(true);
create policy reviews_student_insert_own on reviews for insert to authenticated with check(user_id=(select auth.uid()) and (select my_user_role())='student');
create policy reviews_update_own_author on reviews for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy reviews_delete_own_author on reviews for delete to authenticated using(user_id=(select auth.uid()));
create policy review_replies_allow_public_read on review_replies for select using(true);
create policy review_replies_select_signed_in on review_replies for select to authenticated using(true);
insert into auth.users values('${alice}','alice@up.edu.ph',now()),('${bob}','bob@up.edu.ph',now()),('${admin}','editor@up.edu.ph',now()),('${unconfirmed}','new@up.edu.ph',null);
insert into user_profiles values('${alice}','Alice Legal Name',null,'student'),('${bob}','Bob Legal Name',null,'student'),('${admin}','Admin Name',null,'admin'),('${unconfirmed}',null,null,'student');
insert into entities(id,name,entity_type,latitude,longitude,admin_id) values('${place}','Library','facility',10.64,122.22,'${admin}');
insert into reviews(id,entity_id,user_id,rating,title,review_text) values('${review}','${place}','${alice}',4,'Original review','Original firsthand review preserved during migration.');
insert into review_replies(review_id,user_id,reply_text) values('${review}','${bob}','A useful follow-up.');
`);
const migrationDirectory = new URL("../supabase/migrations/", import.meta.url);
for (const file of readdirSync(migrationDirectory)
  .filter((f) => f.endsWith(".sql"))
  .sort()) {
  await db.exec(readFileSync(new URL(file, migrationDirectory), "utf8"));
}
let checks = 0;
async function as(role, user, fn) {
  await db.exec(
    `set role ${role}; select set_config('request.jwt.claim.sub','${user || ""}',false);`,
  );
  try {
    await fn();
  } finally {
    await db.exec("reset role");
  }
}
async function denied(sql) {
  await assert.rejects(() => db.exec(sql));
  checks++;
}
async function rows(sql, count) {
  const result = await db.query(sql);
  assert.equal(result.rows.length, count);
  checks++;
}
await as("anon", null, async () => {
  await rows("select * from entities", 1);
  await rows("select * from reviews", 1);
  await rows("select id,full_name from user_profiles", 0);
  await denied("select * from submissions");
  await denied(
    `insert into reviews(entity_id,user_id,rating,review_text) values('${place}','${bob}',5,'Anonymous writes must not be allowed.')`,
  );
});
await as("authenticated", bob, async () => {
  await rows("select id,full_name from user_profiles", 1);
  await rows(
    `update reviews set review_text='I cannot edit another authorâ€™s review.' where id='${review}' returning id`,
    0,
  );
  await denied(`update reviews set user_id='${bob}' where id='${review}'`);
  await denied(`update reviews set upvote_count=999 where id='${review}'`);
  await db.exec(
    `insert into submissions(user_id,entity_id,kind,details) values('${bob}','${place}','correction','Please verify the library entry with the official source.');`,
  );
  await rows("select * from submissions", 1);
  await denied(
    `insert into submissions(user_id,kind,details,status) values('${bob}','correction','A forged resolved report should fail.','resolved')`,
  );
  await rows("update submissions set status='resolved' returning id", 0);
  await denied(
    `insert into submissions(user_id,kind,details) values('${alice}','correction','I cannot submit this as a different person.')`,
  );
  await db.exec(
    `insert into reviews(entity_id,user_id,rating,title,review_text,display_name,visited_on) values('${place}','${bob}',5,'Useful visit','A valid new firsthand review from Bob.','Bob pseudonym','2026-09-01');`,
  );
  await rows("select * from reviews", 2);
  await denied(
    `insert into reviews(entity_id,user_id,rating,review_text) values('${place}','${bob}',5,'One current review per person per place.')`,
  );
});
await as("authenticated", unconfirmed, async () => {
  await denied(
    `insert into submissions(user_id,kind,details) values('${unconfirmed}','correction','Unconfirmed mailboxes must not be allowed to contribute.')`,
  );
  await denied(
    `insert into reviews(entity_id,user_id,rating,review_text) values('${place}','${unconfirmed}',5,'Unconfirmed users must not create public content.')`,
  );
});
await as("authenticated", alice, async () => {
  await rows("select * from submissions", 0);
  await denied(
    `update reviews set moderation_status='hidden' where id='${review}'`,
  );
  await db.exec(
    `update reviews set display_name='Campus reader',review_text='Updated firsthand review with a safe public display name.' where id='${review}';`,
  );
});
await as("authenticated", admin, async () => {
  await db.exec(
    `insert into public.review_replies(review_id,user_id,reply_text) values('${review}','${admin}','A moderator’s own reply.');`,
  );
  await rows(
    `delete from public.review_replies where user_id='${admin}' returning id`,
    1,
  );
  await rows(
    `delete from public.review_replies where user_id='${bob}' returning id`,
    0,
  );
  await rows("select * from submissions", 1);
  await db.exec(
    "update submissions set status='reviewing',moderator_note='Checking the source.';",
  );
  await db.exec(
    `update reviews set moderation_status='hidden' where id='${review}';`,
  );
  await db.exec(
    `update entities set preparation='Confirm current library arrangements before visiting.' where id='${place}';`,
  );
});
await as("anon", null, async () => {
  await rows("select * from reviews", 1);
  await rows("select * from review_replies", 0);
});
await as("authenticated", alice, async () => {
  await rows(`select * from reviews where id='${review}'`, 1);
  await denied(
    `update reviews set moderation_status='published' where id='${review}'`,
  );
});
await as("authenticated", bob, async () => {
  const r = await db.query("select status,moderator_note from submissions");
  assert.equal(r.rows[0].status, "reviewing");
  assert.equal(r.rows[0].moderator_note, "Checking the source.");
  checks++;
});
await db.close();
console.log(
  `PASS: migration applied and ${checks} Postgres permission/integrity checks passed. No remote database was modified.`,
);
