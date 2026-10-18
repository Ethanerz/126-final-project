import { SubmissionForm } from "@/components/submission-form";
export const metadata = { title: "Suggest a place" };
export default function SuggestPage() {
  return (
    <main id="main" className="page-shell min-h-[65vh] py-16">
      <div className="max-w-xl">
        <p className="eyebrow mb-3">Build the guide with us</p>
        <h1 className="section-title">What should be on the map?</h1>
        <p className="body-copy mt-5">
          A useful service, a tucked-away study space, an everyday essential.
          Tell us what’s missing, where it is, and where we can verify the
          details.
        </p>
        <p className="body-copy mt-3">
          Suggestions go to a private editorial queue. We check them before
          adding anything to the public directory.
        </p>
        <div className="mt-5">
          <SubmissionForm kind="missing_place" />
        </div>
      </div>
    </main>
  );
}
