# Testing

MVP verification date: 2026-10-18. Run commands from the repository root with Node 24.

| Check             | Command             | Coverage                                                                                                                             |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Types             | `npm run typecheck` | Next route type generation and strict TypeScript                                                                                     |
| Lint              | `npm run lint`      | React/Next/TypeScript rules for the active app                                                                                       |
| Unit/regression   | `npm test`          | 81 checks: original 56 plus catalog, ranking, links, contribution validation, deployment configuration and fresh-data error recovery |
| Isolated Postgres | `npm run test:db`   | Actual migration applied to a modeled legacy fixture; 27 authorization/integrity assertions                                          |
| Browser           | `npm run test:e2e`  | 28 cases across desktop and Pixel 7 mobile profiles, including system themes and saved preferences                                   |
| Production        | `npm run build`     | Next.js compilation, types and static/dynamic route generation                                                                       |

Install Chromium once with `npx playwright install chromium`. `npm run test:all` runs the full set. Public browser tests need the real populated pilot catalog and local public Supabase configuration. They check anonymous pages, task shortcuts, filtering, empty recovery, old routes, map opt-in, external directions, sign-in draft persistence and actual viewport bounds. Screenshots are saved in ignored `test-results/` for visual review.

Theme cases cover system changes, keyboard switching, persistence across pages/reloads/tabs, light overrides on dark systems, initialization before React hydration and blocked storage. The full browser suite also passes against an existing production server started with `npm run build` and `npm start`.

On machines with limited memory, run checks sequentially and use `npm test -- --maxWorkers=1 --pool=threads` and `npm run test:e2e -- --workers=1`.

Authenticated browser cases use an explicitly fake session and intercept every browser Supabase request. They check review write failure/retry, ownership payloads, private corrections, moderator decisions and hidden-author edits. They do not send real auth mail or publish test contributions. These tests establish the UI/request/response behavior; real authorization is checked separately in Postgres.

`scripts/verify-database.mjs` uses embedded Postgres and never connects remotely. It checks public reads, private profiles, confirmed eligibility, one review per person/place, cross-author denial, counter protection, private report ownership/status, moderator visibility and author inability to unhide content. Its legacy fixture models the relevant schema and is not a substitute for the full live schema.

`scripts/verify-live-rls.sql` was run against the connected RateUPV project. It inserts disposable auth/catalog/review fixtures inside a transaction, exercises real roles/RLS, and rolls back every fixture. It verified public reads, private profiles, own review editing, private submissions, cross-author denial and admin hide behavior. No test accounts/content remain. Never remove the rollback or treat these fixtures as seed data.

The migration retained 15 places, 5 reviews and 7 profiles. Before/after hashes of original place names/descriptions and review content matched. Three existing entries received sourced preparation information through new fields.

The mobile navigation regression was a real layout issue: the category strip's minimum width widened an implicit grid track and corrupted mobile scroll/hit testing. Zero-minimum explicit columns fix it. Viewport assertions compare document width to the configured device viewport rather than `window.innerWidth`, which itself expanded during the bug.

## Limits of this evidence

- No real student's password, email confirmation delivery or recovery email was used. Verify those with a real UP mailbox and authorized deployed redirect settings before public launch.
- The browser tests validate that the OSM iframe loads on demand and has a correct selected-pin URL; they do not guarantee tile availability, map completeness, actual paths or accessible entrances.
- No on-campus field walk, student interview, usage analytics or product-outcome experiment has been completed.
- The migration is an upgrade to an existing project. There is no complete fresh-database baseline or Docker-based local Supabase stack in this workspace. Docker is not installed here.
- Production dependencies audit clean. Development-only Next ESLint `braces` findings remain documented in `SECURITY.md`.
- Moderation and deletion requests require an operating person. Status changes do not constitute actual account deletion or university issue resolution.

See `LAUNCH_RUNBOOK.md` for remaining hosting, auth-mail, source-check and operating checks.
