"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Lightbulb, MapPinned, UserRound } from "lucide-react";
import { useAuth } from "./auth-provider";
import { cn } from "@/lib/utils";
import { ThemeButton } from "./theme-button";

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
      <div className="page-shell grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
        <Link
          href="/"
          aria-label="RateUPV home"
          className="col-start-1 row-start-1 flex items-center gap-2.5 justify-self-start"
        >
          <img src="/rate-upv-logo.svg" alt="" width="37" height="37" />
          <span className="font-display text-[32px] leading-none tracking-wide">
            RATE<span className="text-primary">UPV</span>
            <span className="sr-only"> campus guide</span>
          </span>
        </Link>
        <nav
          aria-label="Main navigation"
          className="col-span-2 row-start-2 grid grid-cols-4 gap-1 lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:flex lg:gap-2 lg:justify-self-end"
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
        <ThemeButton className="col-start-2 row-start-1 justify-self-end lg:col-start-3" />
      </div>
    </header>
  );
}
