# Security notes

## Trust model

- The `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and
  `VITE_MAPTILER_API_KEY` values ship in the client bundle **by design**.
  They grant no data access by themselves — every read and write is enforced
  by Postgres **Row Level Security** on the server.
- Never introduce a `service_role` / secret key into this codebase. Git
  history was audited (2026-06): no secret key has ever been committed.

## Enforcement (server-side, verified)

| Concern | Enforcement |
|---|---|
| Who can read | `anon` + `authenticated` may read entities, reviews, replies, and content-author names (never `student_id` — excluded by column grants) |
| Who can write | Owner-checked RLS on every table: `user_id = auth.uid()` (IDOR-safe); students write reviews/replies/votes; admins manage only entities they own |
| Signup domain | DB trigger `restrict_up_email_signups` — the client-side check is cosmetic |
| Input integrity | CHECK / UNIQUE / FK constraints (see docs/TESTING.md) |
| RPC surface | `is_student()`, `my_user_role()`, `get_my_student_id()` are not executable by `anon` |
| XSS | React auto-escaping everywhere; map popups (raw HTML) escape entity text explicitly (`escapeHtml` in `src/components/map.jsx`) |
| SQL injection | No SQL is built in the client — supabase-js parameterized filters only |

## HTTP headers (vercel.json)

CSP (`script-src 'self'`; connect limited to Supabase + MapTiler; frames
denied), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`,
HSTS. Notes:

- `img-src https:` is intentionally broad — entity images are arbitrary
  admin-supplied URLs (e.g. imgur).
- `style-src 'unsafe-inline'` is required by React inline styles and the
  MapTiler SDK's injected styles. Scripts remain strictly `'self'`.
- **After changing the CSP, smoke-test the deployed site** (map page +
  fonts + images) — CSP only takes effect on Vercel, not `npm run dev`.

## Accepted trade-offs

- Supabase session tokens live in localStorage (supabase-js default). XSS is
  the threat that matters there, mitigated by escaping + CSP.
- Rate limiting relies on Supabase's built-in auth/API limits; there is no
  custom server to add per-endpoint limits to.
- Error messages from Supabase (e.g. constraint violations in the admin
  panel) may name constraints. Acceptable: schema names are not secret and
  the panel is admin-only.

## Operational checklist (Supabase dashboard)

- [ ] **Auth → Settings → enable leaked-password protection** (HaveIBeenPwned)
- [ ] **Auth → Users → delete `guest@up.edu.ph`** (retired in Phase 2 —
      anonymous browsing replaced it; its password is in old git history)
- [ ] Keep **Authentication → URL Configuration → Redirect URLs** in sync
      with the deployed domain (email-confirmation links depend on it)
