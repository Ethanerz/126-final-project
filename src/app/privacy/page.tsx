import Link from "next/link";
export const metadata = { title: "Privacy" };
export default function Privacy() {
  return (
    <main id="main" className="page-shell py-14">
      <article className="flex max-w-2xl flex-col gap-6">
        <p className="eyebrow">Your information / plain and simple</p>
        <h1 className="section-title">Privacy at RateUPV</h1>
        <p className="body-copy">
          RateUPV is an independent student project. This notice describes the
          MVP’s behavior. Last updated 18 October 2026.
        </p>
        <h2 className="font-heading text-xl font-semibold">What is public</h2>
        <p className="body-copy">
          Place information, review text, ratings, the display name you choose,
          visit month, posting dates, and discussion replies are publicly
          readable. New discussion replies are displayed as “UP community
          member.” Account identifiers are stored with contributions for
          ownership and moderation. A pseudonym does not make you anonymous to
          site operators.
        </p>
        <h2 className="font-heading text-xl font-semibold">
          What stays private
        </h2>
        <p className="body-copy">
          Your account email and authentication data are managed by Supabase.
          Corrections, suggestions, content reports, deletion requests, and
          moderator responses are visible only to their submitter and
          moderators. The MVP does not ask for a student ID number. Existing
          profile information from the previous version is retained for its
          owner and is no longer used as public review attribution after the
          migration.
        </p>
        <h2 className="font-heading text-xl font-semibold">On your device</h2>
        <p className="body-copy">
          Supabase stores session information in browser storage so you can stay
          signed in. Unpublished review drafts are stored in session storage for
          the current tab and removed after posting. Avoid putting sensitive
          personal information in a draft on a shared device. Closing the tab
          clears its session draft.
        </p>
        <p className="body-copy">
          The display theme follows your device settings until you choose light
          or dark mode. Your choice is saved in browser storage for future
          visits on this browser.
        </p>
        <h2 className="font-heading text-xl font-semibold">
          External services
        </h2>
        <p className="body-copy">
          The application uses Supabase for accounts and data. Brand fonts are
          served with the site. The campus map loads OpenStreetMap only when you
          choose to load it; that provider receives normal request information,
          including your IP address. Directions and official source links open
          their providers’ websites. No precise device location is requested.
        </p>
        <h2 className="font-heading text-xl font-semibold">Your choices</h2>
        <p className="body-copy">
          You can edit or delete your own reviews on their place page and delete
          your discussion replies. Deleting a review also removes its discussion
          and votes. Request account deletion through{" "}
          <Link href="/account" className="text-primary underline">
            your account
          </Link>
          ; a moderator must process that request. No automated deletion or
          response time is promised. Operators should remove account data and
          related contributions when a verified deletion request is completed.
        </p>
        <p className="body-copy">
          For privacy questions or a report that cannot be submitted in the app,{" "}
          <a
            href="https://github.com/ysxiaixsy/RateUPV/issues"
            className="text-primary underline"
            target="_blank"
            rel="noreferrer"
          >
            contact the project maintainers
          </a>
          . Don’t put private information in a public GitHub issue.
        </p>
      </article>
    </main>
  );
}
