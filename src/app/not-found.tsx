import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main
      id="main"
      className="page-shell flex min-h-[65vh] flex-col items-start justify-center gap-5"
    >
      <p className="eyebrow">404 / off the beaten path</p>
      <h1 className="section-title">This place isn’t in our guide.</h1>
      <p className="body-copy">
        The link may be old, or the place may have moved.
      </p>
      <Button asChild>
        <Link href="/">Back to campus</Link>
      </Button>
    </main>
  );
}
