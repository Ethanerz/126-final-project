import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export function SiteFooter() {
  return (
    <footer className="mt-20 border-t bg-secondary/35 py-9">
      <div className="page-shell flex flex-col justify-between gap-6 sm:flex-row">
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
          className="flex flex-wrap gap-5 text-xs text-muted-foreground"
        >
          <Link href="/about">About & community rules</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/suggest">Suggest a place</Link>
          <a
            href="https://www.upv.edu.ph/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1"
          >
            Official UPV site <ArrowUpRight className="size-3" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
