# MVP launch and maintenance

## Local setup

Use Node 24 (the current Supabase client requires Node 22+). `npm ci`, copy `.env.example` to `.env.local`, fill the public Supabase URL and publishable key, then `npm run dev`. The current workspace is already configured against the existing RateUPV project. Never put a service-role/secret key in browser configuration.

`npm run test:all` runs type generation/checks, lint, unit tests, isolated Postgres checks, browser tests and a production build. Install Chromium once with `npx playwright install chromium`. The browser public journeys require a populated RateUPV project with the preserved place IDs. Intercepted write-path tests never publish fixtures.

## Existing Vercel project

1. Use the existing RateUPV project, not a newly billed project. Verify the team/project and repo before changing settings.
2. Set the framework to Next.js, use `npm run build`, and remove any `dist`/Vite output-directory override. Keep the root at this repository. `vercel.json` declares Next.js and no SPA rewrite remains.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the intended environments. These replace the old `VITE_*` names. No map key is needed. A new build is required after changing public variables.
4. Preview the feature branch first. In Supabase Auth URL settings, allow the actual preview/local origins you intend to use, with `/account` and `/account?mode=recovery` destinations. Keep email confirmation enabled and the UP-domain trigger in place. Do not broaden redirect origins unnecessarily.
5. With a real UP mailbox, confirm signup delivery, confirmation, sign-in/out, password reset/recovery, review create/edit/delete, private correction and report status. Automated browser tests intentionally do not send auth mail.
6. Check source/directions/map links, actual map rendering/attribution, security headers, invalid routes, old links and mobile layouts on the deployed origin. No exact device location is requested. Test maps separately because third-party availability is not guaranteed.
7. Promote/merge to the production branch only after preview verification. A push to the MVP branch is not a production promotion. The existing production site was not promoted during this implementation.

The connected Vercel account currently has no accessible RateUPV project/team, so these hosting settings were not changed or claimed verified. Auth redirect configuration and actual email delivery remain rollout checks.

## Database migration and rollback

The upgrade is applied on project `pfdxjuruayiekxfzkdmc` as `20261018043101_campus_guide_mvp`. It preserves existing places, profiles and review content; all original counts/fingerprints matched after migration. It adds facts, review identity/recency/visibility and private submissions. It also removes public profile-name access, so old clients should fall back to a generic author label.

The local migration is not a baseline for an empty database. Preserve the remote migration history. Do not reset the live database, delete accounts to reseed it, or rerun an already-applied migration. Use a backup/isolated copy when creating a new environment.

For an application rollback, restore the previous deployment while retaining the additive schema and privacy rules. Existing reviews remain readable. A schema rollback would discard new submission data/metadata and needs a separately reviewed migration and backup. Do not automatically reverse privacy restrictions or drop new tables.

`scripts/verify-live-rls.sql` checks real authorization with fixtures that exist only inside `BEGIN`/`ROLLBACK`. Its final PASS result is reached only after assertions; never remove the rollback to create seed content. `npm run test:db` runs a modeled legacy fixture in embedded Postgres without any remote connection.

## Catalog stewardship

Choose a primary editor and backup. Admins use `/manage` to add/edit/archive entries and review private submissions. Source-check priority tasks before orientation and when a consequential correction arrives. Add current requirements/hours only when a source supports them; leave unknown facts empty. Check actual entrances/pins before claiming accuracy or accessibility.

The Cash Office/RRC starter notes are source readings, not field verification. The library and most existing facilities still need practical checks. Never fill sparse cards with fabricated reviews. Existing campus descriptions were preserved even where they need editorial improvement.

Archive retired places through the editor. The underlying legacy delete policy still exists for compatibility and can cascade through contributions; ordinary maintenance should use archival.

## Moderation and deletion

Assign an operator to the inbox; software does not appoint one. Review the reported text/context and record a concise response. Hide guideline violations, restore mistakes, and keep the submitter's status accurate. Resolving a report is distinct from changing a university service. Escalate institutional concerns through the official university channels with the person's consent; this MVP does not do that automatically.

For account deletion requests:

1. Verify the requester through the signed-in submission and its account ID. Do not ask for a password or student ID.
2. Review what will be removed and any applicable retention needs. Deletion is an operator action; a status change alone does not delete an account.
3. Remove the user's discussion replies and reviews before deleting the auth account. Legacy review/reply foreign keys do not cascade from profiles and otherwise block deletion. Review deletion also removes its discussion/votes.
4. Delete the auth account through the authorized Supabase administration interface, revoke sessions, and confirm related records are removed. Submissions cascade on account deletion. Do not paste credentials into an issue or public comment.

No automated hard-delete endpoint or guaranteed processing time is promised. The existing schema/identity behavior should be reviewed against the operator's real retention obligations before a broader public launch.

## Costs and limits

The OpenStreetMap embed is a deliberate small-pilot choice, loaded only after an explicit action with attribution intact. No bulk downloads/offline prefetch are implemented. OSM public services have no SLA; move to a contracted tile provider if usage/reliability needs grow. MapLibre/Leaflet are renderers, not free production tiles. See the comparison in `PRODUCT_RESEARCH.md`.

Track hosting/database usage and editor hours. Do not create paid projects, add metered Places search or sell rankings without an actual need and budget. Scale the current catalog/thread/inbox limits with pagination before expanding beyond the pilot.
