"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Lightbulb, MapPinned, UserRound } from "lucide-react";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const path = usePathname();
  const { session } = useAuth();
  const navigation = [
    {
      href: "/",
      label: "Explore",
      icon: Compass,
      routes: ["/", "/places", "/suggest"],
    },
    {
      href: "/map",
      label: "Campus map",
      shortLabel: "Map",
      icon: MapPinned,
      routes: ["/map"],
    },
    {
      href: "/about",
      label: "The idea",
      icon: Lightbulb,
      routes: ["/about", "/privacy"],
    },
    {
      href: "/account",
      label: session ? "Your account" : "Sign in",
      shortLabel: session ? "Account" : "Sign in",
      icon: UserRound,
      routes: ["/account", "/manage"],
    },
  ];

  return (
    <header className="border-b bg-background">
      <div className="page-shell flex min-h-20 flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
        <Link
          href="/"
          aria-label="RateUPV home"
          className="flex shrink-0 items-center gap-2.5 self-start md:self-auto"
        >
          <img src="/rate-upv-logo.svg" alt="" width="37" height="37" />
          <span className="font-display text-[32px] leading-none tracking-wide">
            RATE<span className="text-primary">UPV</span>
            <span className="sr-only"> campus guide</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="grid grid-cols-4 gap-1 md:flex md:gap-2"
        >
          {navigation.map(({ href, label, shortLabel, icon: Icon, routes }) => {
            const active = routes.some(
              (route) =>
                path === route ||
                (route !== "/" && path.startsWith(`${route}/`)),
            );
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                aria-current={
                  active ? (path === href ? "page" : "location") : undefined
                }
                className={cn(
                  "flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-t-md border-b-2 px-2 py-2 text-xs transition-colors sm:flex-row sm:gap-2 sm:px-3 sm:text-sm",
                  active
                    ? "border-primary bg-secondary font-semibold text-primary"
                    : "border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                {shortLabel ? (
                  <>
                    <span className="sm:hidden">{shortLabel}</span>
                    <span className="hidden sm:inline">{label}</span>
                  </>
                ) : (
                  <span>{label}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
