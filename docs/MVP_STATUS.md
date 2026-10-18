# RateUPV MVP status

Updated 2026-10-18. Implemented on `feat/campus-guide-mvp`.

## Product decision

RateUPV helps a UPV student **find the right campus place or service and arrive prepared**, with recent firsthand experience supplying context. Start with Miagao. Preserve the original maroon/cream palette and Agency FB, Raleway, and Inter fonts.

The competitor assessment is in [PRODUCT_RESEARCH.md](PRODUCT_RESEARCH.md). Google Maps, official university resources and Room TBA are meaningful alternatives. The proposed distinction is campus task vocabulary, sourced preparation, explicit uncertainty and useful student experience. A map or star leaderboard alone is weak differentiation.

This is a working technical MVP and a product hypothesis. Student task completion, repeat use, stewardship, willingness to contribute and funding have not been validated. A pilot needs an accountable catalog steward and moderator; software does not establish a university partnership or promise office responses.

## Implemented

- Next.js App Router, TypeScript, Tailwind 4 and CLI-installed shadcn/Radix components. Public place pages render on the server; authenticated operations use a browser Supabase client with database authorization.
- Search by names, categories and aliases; task shortcuts; category filters; relevant/name/review-count/adjusted-rating sorting; explicit unreviewed and empty states.
- Place guides with preparation, campus, contact, hours, source/check date, unknown states and directions.
- On-demand OpenStreetMap embed with a searchable place list and selected pin. No map SDK, geolocation request or API key. Google Maps walking-direction handoff. The embed is a small-pilot choice, not a guaranteed production tile service.
- Confirmed UP-mailbox contributions; explicit public review display names; visit month; create/edit/delete; draft retention through sign-in and errors; original discussion routes/replies retained.
- Private corrections, missing-place suggestions, content reports and deletion requests; submitter status/history view; admin moderation inbox with reported-review context, replies to submitters, hide/restore; catalog create/edit/archive/restore.
- Community rules and privacy notice. No student-ID collection in the MVP. University complaint channels remain distinct from RateUPV content reports.
- Legacy route redirects and a preserved Vite source snapshot in `legacy/vite`.

The ranking option uses a provisional Bayesian prior of 3.5 with weight 5. It is described as adjusted for sample count, not a statistically validated quality score. Default discovery prioritizes useful services and study places rather than raw stars.

## Data upgrade

Connected project: `pfdxjuruayiekxfzkdmc` (RateUPV). Applied migrations: `20261018043101_campus_guide_mvp` and `20261018045545_reply_owner_permissions`.

Before and after: **15 places, 5 reviews, 7 profiles**. Place identifiers/names/descriptions and review identifiers/authorship/rating/title/text fingerprints were unchanged. Existing review text and discussion content were not rewritten or seeded with fabricated contributions. Transactional test fixtures were rolled back.

Three existing entries received newly sourced preparation/contact information: Cash Office, RRC and RRC 3D Printing. Other details remain explicitly unconfirmed. Cash Office source: [OUR payment options](https://our.upv.edu.ph/index.php/payment-options). RRC source: [OVCRE makerspace announcement](https://ovcre.upv.edu.ph/rrc-launches-more-spaces-and-services-for-ideas-and-innovations/). A checked date records reading the source, not an on-site visit or a guarantee that procedures remain current.

The migration adds metadata, review visit/display/visibility fields and RLS-protected submissions. Public full-name attribution is removed; owners keep access to their own profile. Moderation changes require an admin even when an author updates a hidden review. Private helper functions are outside the exposed public schema, guard on the current authenticated user and have explicit execution grants.

This is an **upgrade for the existing schema**, not a fresh-install baseline. Earlier applied migrations remain in the remote history. Do not run a database reset or assume this single local migration creates the original schema.

## Verification

- Type generation and strict TypeScript check pass.
- ESLint passes; production `next build` passes.
- 73 Vitest checks pass, including all 56 original regression tests.
- 27 isolated Postgres permission/integrity checks pass using the actual migration and a modeled legacy fixture.
- Live transactional checks pass for public reads, private profiles, own contribution, private submissions, cross-author denial and admin visibility. All fixtures are rolled back.
- 20 desktop/mobile browser cases cover discovery, shortcuts, empty states, responsive layouts, legacy redirects, map opt-in, drafts, write failure/retry, private corrections, moderation and hidden-author editing.
- Browser write-path tests intercept REST requests and use fake sessions; they do not send mail or publish test content. Database authorization is verified separately against real Postgres. Live email delivery/password recovery and field accuracy have not been verified with a real student mailbox or campus visit.
- Production dependency audit reports zero vulnerabilities. The complete audit still flags five development-only findings through the current Next ESLint plugin's `braces` dependency; npm's suggested forced fix downgrades the framework lint configuration and was not applied.

An actual mobile bug was found and fixed: an implicit grid track let the horizontal category list widen the document, which broke mobile hit testing/scrolling. Explicit zero-minimum columns and viewport-based assertions prevent recurrence. Screenshots were reviewed for desktop and mobile.

## Hosting and operations

Run locally with `npm ci`, configure `.env.local` from `.env.example`, then `npm run dev` at `http://127.0.0.1:3000`. No privileged database key is required.

The connected Vercel account returned no accessible RateUPV project or teams. Hosted rollout cannot be asserted through that connection. [LAUNCH_RUNBOOK.md](LAUNCH_RUNBOOK.md) describes the exact Next.js/environment/auth settings required by the existing hosting project. Pushing this feature branch does not promote it to the production branch.

The pilot deliberately has small limits: 200 catalog entries, 100 replies per discussion, 100 latest moderation submissions and 20 latest personal submissions in the current views. Implement pagination before those limits become relevant. Account deletion is a private request plus a documented operator procedure, not automatic deletion. No institutional response guarantee or moderation SLA is published.

## Next product gate

Use the proposed tests in the research note: maintain 15–25 useful entries for five student tasks, name a steward and backup, and test real tasks with new/continuing students. Compare against their usual methods. Suggested initial gate: 8 of 10 participants can find the correct service and enough information to proceed without coaching. This is a proposed pilot gate, not an achieved result.

Donations or an institutional/student-organization sponsor are more plausible starting funding hypotheses than student subscriptions. Track maintenance time alongside hosting costs. No willingness-to-pay research or sponsorship agreement exists, and paid ranking should not be introduced.
