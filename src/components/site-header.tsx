"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, MapPinned, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const path = usePathname();
  const { session } = useAuth();
  return (
    <header className="border-b bg-background">
      <div className="page-shell flex min-h-20 flex-wrap items-center justify-between gap-4 py-4">
        <Link
          href="/"
          aria-label="RateUPV home"
          className="flex items-center gap-2.5"
        >
          <img src="/rate-upv-logo.svg" alt="" width="37" height="37" />
          <span className="font-display text-[32px] leading-none tracking-wide">
            RATE<span className="text-primary">UPV</span>
            <span className="sr-only"> campus guide</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-5 text-sm sm:gap-7"
        >
          <Link
            href="/"
            aria-current={path === "/" ? "page" : undefined}
            className={cn(
              "hidden py-2 sm:block",
              path === "/"
                ? "font-semibold text-primary"
                : "text-muted-foreground",
            )}
          >
            Explore
          </Link>
          <Link
            href="/map"
            aria-current={path === "/map" ? "page" : undefined}
            className={cn(
              "flex items-center gap-2 py-2",
              path === "/map"
                ? "font-semibold text-primary"
                : "text-muted-foreground",
            )}
          >
            <MapPinned className="size-4" />
            <span>Campus map</span>
          </Link>
          <Link
            href="/about"
            className="hidden py-2 text-muted-foreground md:block"
          >
            The idea
          </Link>
          <Button variant="outline" size="sm" asChild>
            <Link href="/account">
              <UserRound data-icon="inline-start" />
              {session ? "Your account" : "Sign in"}
              <ArrowUpRight data-icon="inline-end" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
