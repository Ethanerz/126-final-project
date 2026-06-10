# Testing

## Automated tests

```bash
npm test          # run once
npm run test:watch
```

Unit tests (Vitest + React Testing Library, jsdom) cover the pure logic and
shared primitives:

| Area | File | What it proves |
|---|---|---|
| Filtering/sorting | `src/hooks/useEntityFilters.test.jsx` | 0 / 1 / 1500-item lists, both data shapes, unicode + emoji search, null name/description safety, boundary min-rating, filter stacking |
| Vote math | `src/utils/votes.test.js` | every transition (add, toggle off, switch), deltas never exceed ±1 |
| Validation | `src/utils/validation.test.js` | UP-email spoofing attempts, lat/lng boundaries, NaN/string input |
| RatingBadge | `src/components/ui/RatingBadge.test.jsx` | null/zero-count fallback, decimal formatting, score classification at boundaries |
| Avatar | `src/components/ui/Avatar.test.jsx` | initials, unicode, whitespace, missing-name fallback |
| ErrorState | `src/components/ui/ErrorState.test.jsx` | alert role, retry callback, optional retry |

## Database-level guarantees (verified against the live schema)

These were verified by inspecting `pg_constraint`, `pg_policies`, and triggers
on the production Supabase project — integrity does **not** rely on
application code:

| Guarantee | Mechanism |
|---|---|
| Rating must be 1–5 | `reviews_rating_check` CHECK constraint |
| One review per user per place | `unique_user_entity_review` UNIQUE(user_id, entity_id) — double-submits surface as error 23505, which the UI maps to "You've already reviewed this." |
| One vote per user per review | `votes_user_id_target_id_target_type_key` UNIQUE — double-clicking vote buttons cannot duplicate votes |
| Vote/target types constrained | CHECK constraints (`upvote/downvote`, `review` targets only) |
| Deleting an entity removes its reviews/votes/replies | `ON DELETE CASCADE` chain (entity → reviews → votes + replies) — intentional |
| Deleting an auth user removes profile + votes | `ON DELETE CASCADE` on `user_profiles.id`, `votes.user_id` |
| Only `@up.edu.ph` signups | `restrict_up_email_signups` trigger on `auth.users` (server-side; the client check is cosmetic) |
| Vote counts stay correct | `update_vote_counts` trigger (INSERT/DELETE), clamped at ≥0 |

**Known limitation (documented, not a bug):** a user who has written reviews
or replies cannot be hard-deleted — `reviews.user_id` / `review_replies.user_id`
reference `user_profiles` with no cascade, so Postgres blocks the delete. There
is no account-deletion feature in the app; if one is added, decide between
cascading deletes or content anonymization first.

**Known limitation (vendor):** `@maptiler/sdk` 4.0.2 (latest stable) logs a
non-fatal internal TypeError (`migrateProjection`) and style deprecation
warnings during every map load, regardless of constructor options. The map
renders and behaves correctly. Re-test and remove this note when upgrading to
SDK 4.0.3+.

**Race conditions reviewed:** the vote flow is delete-then-insert; the worst
interleaving (two tabs) hits the UNIQUE constraint, the write fails, and the
optimistic UI rolls back. Review submission races resolve to 23505 → friendly
message. No unguarded read-then-write paths remain.

## Manual test plan

Run before releases. ✅ = behavior implemented and code-reviewed; verify it
still holds.

### Inputs
- [ ] Review/reply with only spaces → inline "can't be just spaces" error, nothing saved ✅
- [ ] 10k-character review → input stops at maxLength (2000); title at 120 ✅
- [ ] Emoji + unicode in review text and profile name → stored and rendered verbatim (React escapes; map popups escape HTML explicitly) ✅
- [ ] `<script>alert(1)</script>` as review title/entity name → renders as literal text everywhere, including map popups ✅
- [ ] Admin form: latitude 91, longitude -200, letters in number fields → inline range errors, no request sent ✅
- [ ] Sign-up with `someone@gmail.com` → client error; bypassing the client (direct API) → DB trigger rejects ✅
- [ ] Password under 6 chars → client error before request ✅

### State
- [ ] Double-click any submit → button disabled while pending, single request ✅
- [ ] Vote rapidly on the same review → counts stay consistent (optimistic + UNIQUE constraint) ✅
- [ ] Navigate away mid-fetch → no console errors (effects use cancelled flags) ✅
- [ ] Refresh while writing a review → form is empty again (accepted: no draft persistence; document if users complain)
- [ ] Sign out in another tab → this tab flips to visitor mode on focus (Supabase auth event) ✅
- [ ] Back button after submitting a review → Browse shows updated rating after its refetch ✅

### Data
- [ ] Entity with no reviews → "No reviews yet" empty state + em-dash badge ✅
- [ ] Entity with no image → patterned placeholder, no broken-image icon ✅
- [ ] Entity with null description/address → row simply omitted ✅
- [ ] Reviewer with no profile name → "Student" fallback ✅
- [ ] Visit `/rating/<deleted-or-garbage-uuid>` → "could not be found" panel (not an error, not a hang) ✅
- [ ] Visit a malformed UUID (`/rating/abc`) → same not-found panel (Postgres uuid parse error is caught) — **verify**
- [ ] Unknown URL `/whatever` → 404 page ✅

### Network
- [ ] Kill the network, load Browse/detail/map/profile → error panel with working Retry on every page ✅
- [ ] Slow 3G throttle → skeletons everywhere, no layout shift when content lands ✅
- [ ] Vote with network down → count snaps back (rollback) ✅

### Sessions & authorization (also part of the Phase 4 security review)
- [ ] Signed-out: write UI hidden, log-in prompts shown; direct API writes rejected by RLS ✅
- [ ] Edit another user's review id via the API → 0 rows affected (RLS owner check) ✅
- [ ] Non-admin calls entity insert/update/delete → RLS rejects; UI surfaces the no-rows hint ✅
