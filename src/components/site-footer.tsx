import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-secondary/35 py-9">
      <div className="page-shell flex flex-col items-start justify-between gap-6 md:flex-row md:gap-10">
        <div className="flex flex-col gap-2">
          <Link href="/" className="font-display text-2xl tracking-wide">
            RATEUPV<span className="text-primary">.</span>
          </Link>
          <p className="max-w-sm text-xs leading-6 text-muted-foreground">
            A student-built guide to UP Visayas. Independent of the university.
            A place to prepare, share, and help the next person.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="grid w-full grid-cols-2 items-start gap-x-6 gap-y-3 text-xs text-muted-foreground sm:w-auto sm:shrink-0 sm:grid-cols-[max-content_max-content] sm:gap-x-8"
        >
          <Link
            href="/about"
            className="inline-flex min-h-6 items-center py-1 hover:text-foreground"
          >
            About & community rules
          </Link>
          <Link
            href="/privacy"
            className="inline-flex min-h-6 items-center py-1 hover:text-foreground"
          >
            Privacy
          </Link>
          <Link
            href="/suggest"
            className="inline-flex min-h-6 items-center py-1 hover:text-foreground"
          >
            Suggest a place
          </Link>
          <a
            href="https://www.upv.edu.ph/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-6 items-center gap-1 py-1 hover:text-foreground"
          >
            Official UPV site{" "}
            <ArrowUpRight aria-hidden="true" className="size-3 shrink-0" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
