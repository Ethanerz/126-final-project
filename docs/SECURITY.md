# Security notes

Updated for the Next.js MVP, 2026-10-18. See `MVP_STATUS.md` for applied migration and verification evidence.

## Trust and identity

- The Supabase URL and publishable key are public browser configuration. There is no service-role/secret key in the app. Authorization is enforced in Postgres.
- Public server rendering uses an anonymous client with no persisted session or cookies. Private browser requests carry the user's Supabase token. Server output never serializes private submissions.
- UP-domain registration is enforced by the existing database trigger. New review/reply/submission eligibility also checks a confirmed UP mailbox and an allowed database role. This is not proof of current enrollment, UPV affiliation or an actual visit.
- New reviews use an explicitly public display name. Legal profile names are no longer exposed through the content-author policy. Owners retain their profile access. Operators can associate contributions with accounts, and account identifiers remain in review records; pseudonyms are not operator anonymity.
- No student ID is collected by the MVP. Existing stored IDs are not read by its pages. Older self-scoped identity RPCs remain for compatibility.

## Database authorization

Every exposed table has RLS. Private submissions have explicit grants: eligible users insert only their own records and read only their records; admins can read/respond. Clients cannot pre-resolve their own submission with an inserted status.

Reviews retain one-per-author/place constraints. Public reads exclude hidden content. Owners can read their own hidden review and edit its text or delete it; a trigger prevents author edits from restoring visibility. Moderators can hide/restore. Editable column grants exclude authorship and vote counters. Private permission helpers have fixed search paths, current-user checks, explicit execution grants and live outside the exposed public schema.

Private reports are not a university complaint channel. Catalog editors archive rather than delete through the UI. The legacy entity-delete policy remains and can cascade contributions if used directly; do not use it for ordinary maintenance.

## Browser and HTTP

React escapes contributed text. Source URLs are restricted to HTTPS before linking; direction parameters are encoded. No raw contributed HTML is rendered. The map is an isolated OpenStreetMap iframe loaded after an explicit action, with attribution retained. Precise device location, camera and microphone are disabled by Permissions Policy.

Next.js sets security headers in `next.config.ts`, including CSP, frame denial, MIME sniffing protection and referrer policy. The CSP permits framework inline hydration and inline component styles, and permits eval only during development. It is not a nonce-based strict CSP; introducing third-party scripts would require a fresh review. The only allowed frame origin is OpenStreetMap. Brand fonts are served locally.

Supabase sessions use browser local storage. Unpublished drafts use tab-scoped session storage. Protect against XSS, avoid sensitive draft content on shared devices, and sign out when finished. The app does not request location.

## Verification and residual work

The upgrade passes isolated Postgres checks and live transactional checks for public/private reads, owner writes, cross-author denial and moderation. Live fixtures are rolled back. Browser write tests use fake sessions with all requests intercepted, rather than publishing fake reviews or sending test mail.

The production dependency audit reports zero known vulnerabilities. The complete audit still reports development-only findings in the current Next ESLint dependency chain (`braces`); there is no patched current release in the checked dependency tree. npm's proposed forced downgrade of the lint stack was not applied. Treat untrusted glob patterns as outside the lint workflow and recheck upstream patches.

The Supabase security advisor still reports three existing public SECURITY DEFINER identity helpers (`get_my_student_id`, `is_student`, `my_user_role`) callable by signed-in users. They are scoped to the current user and retained for compatibility; this is intentional but remains an advisor warning. [Advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

Leaked-password protection is disabled in the connected Auth settings. Review availability and enable it in the operator's actual auth configuration when supported. This implementation does not change account billing or claim password-leak checking is enabled. [Supabase password guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Custom abuse throttling, account suspensions, a moderator audit log, automatic account deletion and institution-specific retention policies are future work. The MVP relies on Supabase limits and human moderation; name an operator and check the inbox before promoting public contributions. Live email confirmation/recovery and deployed-origin headers remain rollout checks.
