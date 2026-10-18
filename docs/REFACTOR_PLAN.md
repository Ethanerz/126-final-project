# RateUPV assessment and refactoring proposal

Date: 2026-10-18. Status: draft for discussion. Recommendations below are proposals, not approved product or stack decisions.

## Recommendation

Define RateUPV around a student task: **find the campus facility or service you need, understand how to use it, and learn from recent student experiences.**

Use reviews to support that task. Practical information, coverage, freshness, and trustworthy contribution matter alongside ratings. Some services are required rather than interchangeable, so preparation can be more useful than a leaderboard.

Next.js App Router + TypeScript + Tailwind CSS + shadcn/ui is a reasonable target if we want public, shareable place pages and server-rendered content. Keep Supabase and initially keep MapTiler. This is a frontend/framework migration; it does not require replacing the database, resetting accounts, or discarding reviews. Vite + TypeScript + shadcn/ui remains a valid, smaller alternative.

## What was assessed

- Repository documentation, routes, user flows, auth, queries, shared logic, styles, tests, and deployment configuration.
- Read-only metadata from connected Supabase project `pfdxjuruayiekxfzkdmc`: tables, policies, grants, constraints, triggers, functions, and migration history. No user/content rows were inspected.
- Current official Next.js, shadcn/ui, and Supabase documentation.
- Existing checks: 6 test files / 56 tests pass; ESLint passes; production build passes with large-chunk warnings. The main JS chunk is approximately 535 kB and the separate MapTiler chunk approximately 1.29 MB before gzip. These are build sizes, not measured user load times.

Limitations: no student interviews, usage analytics, or interactive deployed-site usability test were performed. The connected Supabase project could not be linked conclusively to the deployed site's environment: the local example URL is a placeholder. Database findings describe the connected project; they do not prove production usage, lack of data, or deployed configuration. The existing modified `package.json` and `package-lock.json` were left untouched.

## Current product and the decision it needs

The README describes a student review directory for campus facilities and services. Visitors browse, search, filter, use a map, and read content. Accounts with a university email can contribute reviews, votes, and replies. Admin tooling maintains catalog entries. This is the implemented product, rather than evidence that the underlying student problem has been validated.

| Possible primary job | Current support | What committing to it would require |
| --- | --- | --- |
| Discover and prepare to use campus places/services | Directory, map, descriptions, ratings, reviews | Useful categories, maintained practical information, clear freshness, trustworthy experiences |
| Get a campus concern addressed | Reviews and ordinary replies | A participating office, responsible owner, issue routing, status, response expectations, and resolution evidence |
| Discuss campus experiences | Reviews, votes, replies | Strong moderation, conversation management, community operations, and participation incentives |

Proposed priority: student discovery and preparation. Treat institutional resolution and a broader discussion community as separate future product decisions. If office accountability is the primary goal, redesign the core workflow around cases and responsible offices before choosing screens or ratings.

## Product gaps worth resolving first

| Observation | Why it matters | Proposed response |
| --- | --- | --- |
| Browse defaults to highest average; sample size only breaks ties (`src/hooks/useEntityFilters.js:35`). | One five-star review can outrank substantial evidence from other places. | Always show sample size and freshness. Label sparse evidence clearly. Decide ranking and any minimum sample threshold from pilot data. |
| Reviews have creation/update timestamps but no experience date. | An edited old review and a recent visit convey different things. | Add experience month and display both relevant recency and edit context. Keep one current review per author/place initially. |
| UI categories are only facility/service (`src/components/AdminPanel.jsx:10`). | Students often start with a task rather than an entity type. | Validate a small task-based category set with students. |
| The database already has hours/contact fields, but inspected catalog editing and discovery do not make practical details a complete maintained workflow. | Facts can be missing or stale even when storage exists. | Surface the useful existing fields; add sources, last-checked dates, and an assigned catalog steward. Distinguish maintained facts from student observations. |
| Reviews and replies display `full_name`; profile editing labels it as a full name (`src/components/Rating.jsx:603`, `src/components/Profile.jsx:205`). | Contributors need to understand public attribution before posting candid feedback. | Decide the public identity policy. Proposed default: a public pseudonym with account verification kept private. This does not promise anonymity from operators. Protect identity in database reads as well as UI. |
| Signup checks `@up.edu.ph` and defaults to student role. | A domain check does not establish UPV affiliation or current enrollment. | Describe the actual verification accurately. Add a campus eligibility process only if the chosen audience requires it. |
| Optional student ID is collected without a visible verification workflow. | Sensitive information needs a concrete purpose and retention policy. | Stop collecting it in the proposed MVP unless a necessary use is agreed; decide treatment of existing values separately. |
| No report/moderation workflow is present in inspected routes or connected schema. | Public feedback needs an operator who can handle abuse and corrections. | Add reporting, a moderation queue, recorded decisions, community rules, and an account/data deletion path. Name the operating owner. |
| Entity deletion cascades to reviews; catalog editing is owner-restricted. | Routine catalog maintenance can erase contributions or depend on a single editor. | Prefer archival for retired places; define shared editorial responsibility and duplicate handling. Preserve existing authorship. |
| No correction or missing-place suggestion journey is visible. | Catalog quality currently depends on admins noticing problems. | Give students a small correction/suggestion flow with editor review. |

Useful evidence: `README.md:7`, `src/components/Dashboard.jsx:169`, `src/router.jsx:15`, `src/components/Replies.jsx:307`, `src/components/Profile.jsx:222`, and `docs/TESTING.md:43`.

## Proposed first release

Start with one agreed campus and a small set of priority student tasks.

1. **Discover:** search and browse by useful category; support location/map access; clearly show unreviewed places.
2. **Prepare:** a place/service page explains purpose, location, relevant hours/contact/instructions, and when maintained facts were checked.
3. **Assess:** show recent firsthand experiences with rating, sample size, and sparse-data context. Avoid implying that a single precise average is authoritative.
4. **Contribute:** eligible verified accounts write or update their experience, understand their public identity, and can edit/delete their own contribution. Preserve drafts across an auth interruption where practical.
5. **Maintain trust:** report content or inaccurate place information; moderators/editors act through a manageable queue. Publish the scope and rules of the platform.

Retain existing discussion links and content during migration, but defer expanding threads, downvotes, gamification, feeds, and official-resolution promises. A helpfulness action can be evaluated separately from a general popularity vote. Add detailed category-specific rating criteria only if research demonstrates that students use them.

### Validate the proposal

- Interview a small mix of new and continuing students about their last actual campus task: where they looked, what was missing, and the consequences. Include tasks with and without a choice of provider.
- Identify who can keep factual information current and who will handle reports. A populated catalog and ongoing stewardship are part of the product.
- Test a lightweight mobile prototype with real tasks before rebuilding every screen.
- Measure task completion, whether students find enough information to proceed, priority catalog coverage/freshness, recent firsthand review coverage, and report handling time. Choose numerical targets after a baseline. Signups and review totals are supporting measures.

## Stack decision

| Option | Benefits for RateUPV | Costs/tradeoffs | When to choose |
| --- | --- | --- | --- |
| Keep Vite; adopt TypeScript and shadcn/ui | Smallest framework change; existing client flows remain familiar | Server rendering and server-owned workflows require additional decisions if later needed | Fastest route to improving the current campus application |
| Next.js App Router + TypeScript + shadcn/ui | Server-rendered public pages, route metadata, colocated server workflows, clear public/private rendering choices | Auth cookies, caching, client/server placement, deployment policy, and route migration add complexity | A longer-term public directory with shareable pages and moderated workflows |

shadcn/ui and Next.js are independent choices: shadcn supports [Vite](https://ui.shadcn.com/docs/installation/vite) as well as other frameworks. It supplies editable UI source, so the project retains responsibility for customization and updates. Preserve RateUPV's maroon/cream identity through semantic design tokens rather than accepting an unrelated default appearance. See the [shadcn/ui introduction](https://ui.shadcn.com/docs).

My provisional preference is Next.js for the proposed public directory. Server rendering can improve the initial content response and support public page presentation; it does not guarantee search ranking or compensate for an incomplete catalog. Keep interactive maps, filters, and contribution forms in appropriately scoped client components. See [Next.js server/client composition](https://nextjs.org/docs/app/getting-started/server-and-client-components).

No new ORM, separate backend framework, global state library, or additional infrastructure is required by the proposed scope. Add dependencies only for demonstrated needs.

## Technical changes that earn their place

### Keep and improve

- Supabase Postgres, Auth, existing identifiers, authorship, constraints, and RLS; verify the actual deployment/project mapping before changing anything remotely.
- Existing vote/validation tests and useful filter behavior. Shared presentation tests may need adaptation to new UI primitives.
- Brand assets and CSS token concepts, mobile layouts, empty/error states, and map lazy loading.
- Existing public links, through preserved paths or redirects.

### Restructure around feature modules

`Rating.jsx` and `Replies.jsx` mix rendering, queries, validation, optimistic updates, and voting persistence. Put these workflows behind small feature interfaces so pages do not each need to know the database sequence or error mapping.

| Module | Responsibility |
| --- | --- |
| Catalog | Search/filter input, place summaries, practical details, archival/corrections |
| Reviews | Validated create/edit/delete, public presentation, pagination, rating summaries |
| Voting | One vote transition contract and consistent persisted/optimistic results |
| Identity | Verified session, explicit permission states, public profile versus private account details |
| Moderation | Reports, reviewable actions, content visibility and audit history |

Keep framework routing thin. Use Supabase as the concrete adapter where data access is needed; avoid building generic repository layers for hypothetical backend replacements.

### Fix scaling and integrity at the data seam

- Listings currently fetch nested review ratings (`Dashboard.jsx:20`) and calculate summaries in the browser; detail/discussion queries are unpaginated. Introduce bounded queries, pagination, and database summaries shared by list/map/detail. Any exposed view must respect caller permissions, including RLS.
- Voting is duplicated and uses separate delete/insert requests (`Rating.jsx:280`, `Replies.jsx:158`). Define a single transactional operation and the expected behavior under retry/concurrent tabs. Preserve or deliberately migrate the existing vote model.
- Client permission state falls back to student after a failed role lookup (`AuthContext.jsx:85`). Make loading/error/allowed/denied explicit and fail closed for privileged UI; keep authorization enforced by database policies and every server mutation.
- Metadata inspection suggests client-writable vote counters/timestamps need stronger server guarantees. Validate this with controlled integration tests before making a specific exploit claim. Treat counters and creation dates as server-managed data.
- Six security migrations exist remotely, but the repository has no versioned Supabase baseline. Capture schema, migrations, grants, functions, auth triggers, and deterministic nonpersonal seed data before schema changes. Verify the baseline recreates a development database.
- Account deletion currently conflicts with retained author references. Agree on content deletion versus anonymization, including moderator records and retained content, before implementing it.

### Next.js-specific migration work

- Use separate browser/server Supabase clients with cookie session refresh, verified identity, and proper confirmation/recovery callbacks. Keep shared public caching separate from personalized/session-changing responses. The existing localStorage session flow cannot simply be copied into server rendering. Follow [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs).
- Preserve `/rating/:entityId`, review discussion URLs, and `/mappreview` or redirect them deliberately. Next.js provides an [incremental Vite migration guide](https://nextjs.org/docs/app/guides/migrating/from-vite).
- Keep MapTiler browser-only, lazy loaded, and lifecycle-safe. Reassess the map vendor only after measuring actual loading, mobile usability, and cost needs.
- Replace Vite environment access and the Vercel SPA catch-all rewrite. Rework/test CSP against Next-generated scripts, callbacks, images, and map workers.
- Select a supported Node runtime and pin tested package versions. README's Node 20 prerequisite needs revisiting: Supabase documents [Node 20 support ending June 30, 2026](https://supabase.com/changelog/45715-deprecation-notice-dropping-support-for-node-js-20).
- Include explicit grants alongside RLS in new-table migrations. Supabase documents [new-table Data API exposure changes](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically); existing table grants are retained.

## Delivery sequence and completion criteria

| Phase | Concrete output | Ready to move on when |
| --- | --- | --- |
| 1. Product definition | Primary job, audience/campus, identity policy, moderation owner, first-release scope, success measures | A small set of real student tasks and a maintenance model are agreed |
| 2. Baseline | Confirmed environment/project mapping, reproducible schema, seed catalog, current journey inventory | A development environment can reproduce the relevant behavior without production data |
| 3. Experience design | Mobile browse, place detail, contribution, report and editor flows | Representative students can complete pilot tasks in a prototype |
| 4. First complete journey | Chosen stack, themed primitives, browse -> place detail -> verified contribution -> updated summary | The full journey works with ownership rules, errors, empty states and mobile input |
| 5. Trust and maintenance | Moderation, corrections, archival, deletion policy, remaining preserved routes/map | Operators can maintain the pilot catalog and handle reports without manual database edits |
| 6. Release | Migration/redirect plan, tested preview, data-preserving rollout and rollback plan | Old links, auth emails, permissions, caching isolation, accessibility and deployed CSP pass checks |

Prefer a small complete journey in a separate migration branch/preview over changing the framework, data model, identity policy, and every screen at once. Keep the existing deployment available until the replacement meets the criteria. Do not reset the database based on metadata row estimates.

Verification should concentrate on behavior: anonymous reads; confirmed eligible contribution; direct attempts to edit another author's content; moderator permissions; report visibility; vote concurrency; summary freshness; pagination; auth email callbacks; account deletion policy; and public/private data separation. Existing helper tests are valuable but do not prove these workflows.

## Decisions still open

1. Is the primary outcome student decision support, accountable office action, or community discussion?
2. Which campus and audience are in the first pilot? Does university-email eligibility suffice?
3. What identity appears publicly, and what remains private?
4. Who maintains catalog facts, moderates reports, and owns the project's operation?
5. Is public search/share discovery valuable enough to take on Next.js's migration and runtime complexity now?

These decisions shape the implementation. Next.js and shadcn/ui are feasible tools for the proposed direction; choosing the product promise comes first.
