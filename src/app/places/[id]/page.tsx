import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Clock3,
  MapPin,
  Navigation,
  BookOpen,
  Info,
  Star,
  Phone,
} from "lucide-react";
import {
  getPlace,
  categoryOf,
  directionsUrl,
  statsOf,
  safeUrl,
} from "@/lib/catalog";
import { Reviews } from "@/components/reviews";
import { SubmissionForm } from "@/components/submission-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
export const dynamic = "force-dynamic";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPlace(id);
  return { title: p?.name || "Place not found" };
}
export default async function PlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const [{ id }, q] = await Promise.all([params, searchParams]);
  const p = await getPlace(id);
  if (!p) notFound();
  const s = statsOf(p.reviews);
  const source = safeUrl(p.source_url);
  return (
    <main id="main">
      <section className="border-b bg-secondary/20">
        <div className="page-shell py-9 sm:py-12">
          <Link
            href="/#explore"
            className="mb-7 flex items-center gap-2 text-xs text-muted-foreground"
          >
            <ArrowLeft className="size-3.5" />
            All campus places
          </Link>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{categoryOf(p)}</Badge>
            <Badge variant="outline">{p.entity_type}</Badge>
            {p.archived_at && <Badge variant="outline">Archived</Badge>}
          </div>
          <h1 className="mt-5 max-w-4xl font-heading text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            {p.name}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-muted-foreground">
            {p.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="size-4" />
              {p.campus || "Miagao"} campus
            </span>
            <a href="#experiences" className="flex items-center gap-1.5">
              <Star className="size-4 text-primary" />
              {s.average ? (
                <>
                  <strong>{s.average.toFixed(1)}</strong>
                  <span className="text-muted-foreground">
                    · {s.count} {s.count === 1 ? "experience" : "experiences"}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  No experiences yet
                </span>
              )}
            </a>
          </div>
        </div>
      </section>
      <div className="page-shell grid gap-10 py-9 lg:grid-cols-[1fr_330px] lg:gap-12">
        <div className="flex min-w-0 flex-col gap-10">
          <section>
            <p className="eyebrow mb-2">Before you go</p>
            <h2 className="section-title">A little preparation helps.</h2>
            <p className="body-copy mt-4 whitespace-pre-wrap">
              {p.preparation ||
                "Visit information hasn’t been checked for this entry yet. Before a time-sensitive trip, confirm current requirements and arrangements with the office or service. Student experiences below can offer context, but aren’t official instructions."}
            </p>
            <Alert className="mt-5">
              <Info />
              <AlertTitle>
                {p.source_checked_at
                  ? "Source-checked information"
                  : "Help us fill in the details"}
              </AlertTitle>
              <AlertDescription>
                {p.source_checked_at
                  ? `Source checked ${new Date(p.source_checked_at + "T12:00:00Z").toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}. Details can change; follow the official source for current instructions.`
                  : "Hours, requirements, and accessibility have not been independently confirmed by RateUPV. Suggest a correction with a reliable source."}
              </AlertDescription>
            </Alert>
            <SubmissionForm kind="correction" entityId={id} />
          </section>
          <Separator />
          <Reviews
            entityId={id}
            reviews={p.reviews}
            autoOpen={q.review === "1"}
          />
        </div>
        <aside className="flex flex-col gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Plan your visit</CardTitle>
              <CardDescription>
                Practical details, with uncertainty made clear.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <h3 className="text-xs font-semibold">Location</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {p.address || `${p.campus || "Miagao"} campus, UP Visayas`}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {p.latitude !== null && p.longitude !== null
                      ? "Catalog pin available. Confirm the entrance on arrival."
                      : "Exact pin not recorded."}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <h3 className="text-xs font-semibold">Opening hours</h3>
                  {p.operating_hours &&
                  Object.keys(p.operating_hours).length ? (
                    Object.entries(p.operating_hours).map(([day, hours]) => (
                      <p
                        key={day}
                        className="mt-1 text-sm leading-6 text-muted-foreground"
                      >
                        {day}:{" "}
                        {typeof hours === "string"
                          ? hours
                          : JSON.stringify(hours)}
                      </p>
                    ))
                  ) : (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Not confirmed. Check before a time-sensitive visit.
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <h3 className="text-xs font-semibold">Contact</h3>
                  {p.contact_info && Object.keys(p.contact_info).length ? (
                    Object.entries(p.contact_info).map(([label, value]) => (
                      <p
                        key={label}
                        className="mt-1 break-words text-sm leading-6 text-muted-foreground"
                      >
                        {label}:{" "}
                        {typeof value === "string"
                          ? value
                          : JSON.stringify(value)}
                      </p>
                    ))
                  ) : (
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Not listed in this guide yet.
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button asChild className="w-full">
                <a href={directionsUrl(p)} target="_blank" rel="noreferrer">
                  <Navigation data-icon="inline-start" />
                  Open walking directions
                  <ArrowUpRight data-icon="inline-end" />
                </a>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href={`/map?place=${id}`}>Locate on campus map</Link>
              </Button>
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Go to the source</CardTitle>
              <CardDescription>
                University procedures come from the university.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="link"
                asChild
                className="h-auto whitespace-normal p-0 text-left"
              >
                <a
                  href={source || "https://www.upv.edu.ph/"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <BookOpen data-icon="inline-start" />
                  {source ? "View this entry’s source" : "Official UPV website"}
                  <ArrowUpRight data-icon="inline-end" />
                </a>
              </Button>
            </CardContent>
            <CardFooter>
              <p className="text-xs leading-6 text-muted-foreground">
                RateUPV is independent. Reviews and content reports do not file
                an official university complaint.
              </p>
            </CardFooter>
          </Card>
        </aside>
      </div>
    </main>
  );
}
