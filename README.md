<div align="center">

<img src="public/rate-upv-logo.svg" alt="Rate UPV logo" width="96" />

# Rate UPV

**Student-driven reviews of UP Visayas campus facilities and services.**

Think *Rate My Professors*, but for the places and services around campus — browse, review, reply, and vote on what's helpful.

[Live site](https://126-final-project-orpin.vercel.app/) · [Report an issue](../../issues)

</div>

---

## Features

- 🏛️ **Browse & search** — every campus facility and service with an aggregate decimal rating, type filters, minimum-rating filter, and sorting.
- ✍️ **Reviews, replies & votes** — students post one review per place, discuss in reply threads, and upvote/downvote reviews.
- 🗺️ **Campus map** — an interactive MapTiler map of every entity, with a filterable floating list and fly-to markers; each place also shows a mini-map on its detail page.
- 👀 **Anonymous browsing** — everything is readable without an account.
- 🎓 **UP-only accounts** — registration is restricted to `@up.edu.ph` emails, enforced at the database level, with email confirmation.
- 🛡️ **Roles** — visitors (read-only), students (review / reply / vote), and admins (manage entities).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | [React 19](https://react.dev) + [Vite 8](https://vite.dev) |
| Routing | [React Router 7](https://reactrouter.com) |
| Backend | [Supabase](https://supabase.com) — Postgres, Auth, Row Level Security |
| Maps | [MapTiler SDK](https://www.maptiler.com) |
| Styling | Hand-rolled design-token system (CSS custom properties) |
| Hosting | [Vercel](https://vercel.com) |

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [MapTiler](https://www.maptiler.com) API key

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
#    …then fill in the values (see below)

# 3. Run the dev server
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The project's publishable (client) API key |
| `VITE_MAPTILER_API_KEY` | MapTiler Cloud API key |

> These are client-side keys by design. Data access is protected by Postgres Row Level Security, not by key secrecy. Never put a `service_role` / secret key in this project.

### Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── components/        # Pages + feature components
│   ├── layout/        #   Header, Footer, Layout shell
│   └── ui/            #   Shared primitives (Button, Icon, Avatar, …)
├── context/           # AuthContext (session, roles, auth modal)
├── hooks/             # useEntityFilters (shared browse/map filtering)
├── styles/            # Per-page CSS (all values from design tokens)
├── index.css          # Design tokens + base styles (single source of truth)
└── router.jsx         # Route table
```

## Database

Five tables behind Row Level Security: `user_profiles`, `entities`, `reviews`, `review_replies`, `votes`. Integrity is enforced in Postgres — `CHECK` ratings 1–5, one review per user per entity, one vote per user per review, cascading deletes, a trigger-maintained vote count, and a trigger restricting signups to `@up.edu.ph`.

## Team

CMSC 126 final project — **Team JJEM Alert**

- Ethan Sean Gapulan
- John Dave Valentin
- Marc Raven Sian
- Joseph Patrick Salomeo

---

> 📜 The original course-submission README is preserved as [`README.old.md`](README.old.md).
