import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Building2,
  Coffee,
  MapPin,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { getPlaces } from "@/lib/catalog";
import { Directory } from "@/components/directory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
export const dynamic = "force-dynamic";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const [places, params] = await Promise.all([getPlaces(), searchParams]);
  const tasks = [
    {
      icon: BookOpen,
      label: "Find a study space",
      category: "Study & research",
    },
    {
      icon: Building2,
      label: "Payments & documents",
      category: "Documents & payments",
    },
    {
      icon: Coffee,
      label: "Everyday essentials",
      category: "Everyday essentials",
    },
  ];
  return (
    <main id="main">
      <section className="relative overflow-hidden border-b">
        <div className="page-shell grid gap-10 py-12 sm:py-16 lg:grid-cols-[1.25fr_1fr] lg:gap-20 lg:py-20">
          <div>
            <Badge variant="outline" className="mb-6">
              <span className="mr-1 size-1.5 rounded-full bg-primary" />
              Made for life at UP Visayas
            </Badge>
            <h1 className="font-display text-[clamp(3.5rem,7vw,6.6rem)] font-bold leading-[.98] tracking-normal">
              KNOW YOUR CAMPUS.
              <br />
              <span className="text-primary">MAKE IT YOURS.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">
              The right place. A little preparation. Advice from someone who’s
              been there. Get to know UPV, one place at a time.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Button size="lg" asChild>
                <a href="#explore">
                  Explore places <ArrowDown data-icon="inline-end" />
                </a>
              </Button>
              <Link
                href="/about"
                className="text-sm text-muted-foreground underline decoration-border underline-offset-4"
              >
                What is RateUPV?
              </Link>
            </div>
            <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5" />
              Starting with Miagao. Built by students, for students.
            </p>
          </div>
          <div className="paper-grid flex flex-col justify-center rounded-2xl border bg-secondary/40 p-6 sm:p-8">
            <div className="mb-7 flex items-center justify-between">
              <p className="eyebrow">Where do you need to go?</p>
              <span className="font-display text-3xl text-primary/30">
                01—03
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {tasks.map(({ icon: Icon, label, category }, i) => (
                <Link
                  key={label}
                  href={`/?category=${encodeURIComponent(category)}#explore`}
                  className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-transform hover:translate-x-1"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
                    <Icon className="size-5" />
                  </span>
                  <div className="flex-1">
                    <span className="text-[10px] font-semibold tracking-widest text-muted-foreground">
                      0{i + 1} / CAMPUS LIFE
                    </span>
                    <p className="mt-1 text-sm font-semibold">{label}</p>
                  </div>
                  <ArrowRight className="size-4 text-primary" />
                </Link>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs leading-5 text-muted-foreground">
              <MessageSquareText className="size-4 shrink-0" />A better next
              visit starts with a shared experience.
            </div>
          </div>
        </div>
      </section>
      <div className="border-b bg-card">
        <div className="page-shell grid gap-5 py-5 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <MapPin className="size-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              <strong className="font-medium text-foreground">
                Find the right place.
              </strong>{" "}
              Search before you set off.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <BookOpen className="size-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              <strong className="font-medium text-foreground">
                Arrive prepared.
              </strong>{" "}
              Know what’s confirmed.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-4 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">
              <strong className="font-medium text-foreground">
                Keep it useful.
              </strong>{" "}
              Share firsthand experiences.
            </p>
          </div>
        </div>
      </div>
      <Directory
        key={`${params.q || ""}:${params.category || ""}`}
        places={places}
        initialQuery={params.q}
        initialCategory={params.category}
      />
    </main>
  );
}
