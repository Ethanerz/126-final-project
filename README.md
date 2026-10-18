# RateUPV

**Find the right campus place. Arrive prepared. Pass on what you learned.**

RateUPV is an independent student-built guide to UP Visayas facilities and services. The MVP starts with Miagao and combines task-based discovery, sourced preparation and firsthand student experience. Its maroon/cream palette and Agency FB, Raleway and Inter fonts are retained.

[Product assessment](docs/PRODUCT_RESEARCH.md) · [MVP status](docs/MVP_STATUS.md) · [Launch runbook](docs/LAUNCH_RUNBOOK.md)

## What works

- Public search, aliases, categories, useful ordering and shareable place pages.
- Preparation, location, contacts, hours and source/check dates, with explicit unknown states.
- A searchable campus map loaded on demand, plus keyless Google Maps walking directions.
- UP-email accounts, confirmed-mailbox contributions, public display names and visit month.
- Review create/edit/delete, sign-in draft retention, discussion and honest small-sample ratings.
- Private corrections, missing-place suggestions, content reports and account-deletion requests.
- A moderator inbox and catalog editor with response/status, hide/restore and archive/restore.
- Preserved accounts/content and redirects from the original rating/map/profile URLs.

UP email confirmation establishes mailbox access, not current enrollment or UPV affiliation. Reviews are independent experiences; a RateUPV report does not file a university complaint.

## Run locally

Use Node.js 24 and npm. Connect to the existing upgraded RateUPV schema or an isolated copy of it.

```powershell
npm ci
Copy-Item .env.example .env.local
# Fill .env.local with the public Supabase URL and publishable key.
npm run dev
```

Open `http://127.0.0.1:3000`. Both required variables are public configuration; database Row Level Security protects access. Never use a service-role/secret key in `NEXT_PUBLIC_*` variables.

| Variable                               | Purpose              |
| -------------------------------------- | -------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public client key    |

No map key is needed. The OpenStreetMap embed loads only when requested. Its public service is suitable for this small pilot without an availability guarantee; evaluate a hosted provider before wider usage.

## Stack and structure

Next.js App Router + TypeScript, Tailwind 4, CLI-installed shadcn/Radix components, Supabase Postgres/Auth/RLS. Inter and Raleway are locally served with their OFL licenses.

```text
src/app/           Routes, public server rendering and global brand tokens
src/components/    Discovery, account, review, moderation and map workflows
src/components/ui/ Editable shadcn primitives
src/lib/           Catalog rules, validation, generated database types and clients
supabase/migrations/  Upgrade to the existing schema
scripts/           Isolated/live transactional database verification
tests/e2e/         Desktop/mobile public and intercepted-write journeys
legacy/vite/       Original source and preserved regression tests
```

Public server reads use an anonymous client without session cookies. Private operations happen through the authenticated browser client and database policies. No separate API server or privileged browser key is introduced.

## Checks

```powershell
npx playwright install chromium  # Once per machine
npm run typecheck
npm run lint
npm test
npm run test:db
npm run test:e2e
npm run build
```

`npm run test:all` runs the complete set. Browser public tests require the populated pilot catalog; write tests intercept requests and never publish fixtures. See [testing notes](docs/TESTING.md) for evidence and limits.

## Database and rollout

The applied MVP migration extends the existing schema; it is not a fresh-install baseline. Existing 15 places, 5 reviews and 7 profiles were preserved, with original content fingerprints unchanged. Three entries have new sourced preparation notes; most catalog facts still need checking. No fabricated reviews were added.

Vercel needs the Next.js preset, the two `NEXT_PUBLIC_*` variables, and no Vite `dist` output override. Supabase auth redirects must allow the actual deployed/local account and recovery destinations. Follow [the launch runbook](docs/LAUNCH_RUNBOOK.md); live email delivery and on-campus accuracy require real verification.

Production builds stop if either public Supabase variable is missing or blank. If a deployed guide cannot load after migrating from Vite, configure the new variable names in Vercel and create a new deployment; the old `VITE_*` variables do not configure Next.js. See [deployment troubleshooting](docs/LAUNCH_RUNBOOK.md#deployed-guide-says-it-could-not-load).

The current views intentionally have pilot-sized limits. Account deletion is a private request and operator procedure, not automated deletion. The MVP does not promise university endorsement, resolution of campus complaints, or a moderation SLA.

## Product viability

Google Maps, UPV's own handbook/office resources and Room TBA are meaningful alternatives. RateUPV's proposed advantage is a focused campus preparation workflow with clear sources, uncertainty and recent experience. Validate it through real student tasks and maintain the catalog; a framework migration alone does not prove demand. The research note includes competitors, map options, cold start, proposed pilot gates and funding hypotheses.

## Team

CMSC 126 final project — **Team JJEM Alert**

- Ethan Sean Gapulan
- John Dave Valentin
- Marc Raven Sian
- Joseph Patrick Salomeo

The original course-submission README remains in [README.old.md](README.old.md).
