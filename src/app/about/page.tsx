import Link from "next/link";
import { ArrowRight, BookOpen, MapPin, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
export const metadata = { title: "The idea & community rules" };
export default function About() {
  return (
    <main id="main" className="page-shell py-14">
      <div className="max-w-3xl">
        <p className="eyebrow mb-4">The idea behind RateUPV</p>
        <h1 className="font-display text-5xl leading-none sm:text-6xl">
          LESS GUESSING.
          <br />
          <span className="text-primary">MORE CAMPUS KNOW-HOW.</span>
        </h1>
        <p className="mt-6 text-lg leading-9 text-muted-foreground">
          Finding a building is one thing. Knowing what to expect when you get
          there is another. RateUPV brings campus places, preparation, and
          student experience into one shareable guide.
        </p>
        <p className="body-copy mt-4">
          We’re starting small in Miagao. This is an independent student
          project, not an official UPV service or an emergency channel. Some
          entries still need source checks, and we show those gaps.
        </p>
      </div>
      <div className="my-10 grid gap-5 md:grid-cols-3">
        {[
          {
            Icon: MapPin,
            title: "Find your place",
            text: "Search by a place name, service, or task. Use maps for orientation and directions.",
          },
          {
            Icon: BookOpen,
            title: "Arrive prepared",
            text: "Check the source, the date, and what is still unknown. Official instructions belong to the university.",
          },
          {
            Icon: MessageSquareText,
            title: "Pass it on",
            text: "Share a recent firsthand experience. Give someone the context you wish you’d had.",
          },
        ].map(({ Icon, title, text }) => (
          <Card key={title}>
            <CardHeader>
              <Icon className="mb-3 size-5 text-primary" />
              <CardTitle>{title}</CardTitle>
              <CardDescription>Campus knowledge, made useful.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="body-copy">{text}</p>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-muted-foreground">
                Built around the next visit.
              </span>
            </CardFooter>
          </Card>
        ))}
      </div>
      <Separator />
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="section-title">A few ground rules.</h2>
          <ul className="mt-5 flex list-disc flex-col gap-4 pl-5 text-sm leading-7 text-muted-foreground">
            <li>
              Review your own experience of the place or service. Add the month
              you visited.
            </li>
            <li>
              Be specific and fair. Explain what worked and what could improve
              without targeting individuals.
            </li>
            <li>
              No harassment, discrimination, spam, invented experiences, or
              someone else’s private information.
            </li>
            <li>
              Use one current review per place. Update it when your experience
              changes.
            </li>
            <li>
              Choose a display name you’re comfortable making public. Operators
              can connect a review to its account.
            </li>
            <li>
              Report content problems privately. Moderators can hide reviews
              that breach these rules.
            </li>
          </ul>
        </section>
        <section>
          <h2 className="section-title">The right kind of feedback.</h2>
          <p className="body-copy mt-5">
            A correction helps maintain this guide. A content report alerts
            RateUPV moderators. Neither files a complaint with UPV or promises
            an office response.
          </p>
          <p className="body-copy mt-4">
            For an institutional concern, follow the official university
            channel. For urgent health or safety concerns, contact emergency
            services or campus authorities directly.
          </p>
          <Button
            variant="link"
            className="mt-4 h-auto max-w-full justify-start whitespace-normal px-0 py-2 text-left"
            asChild
          >
            <a
              href="https://www.upv.edu.ph/files/upv-citizens-charter-2025.pdf"
              target="_blank"
              rel="noreferrer"
            >
              <span>UPV Citizen’s Charter & feedback channels</span>
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
          <p className="body-copy mt-4">
            Hours and procedures may change. A source check is a reading of a
            linked source, not an on-site inspection. Small review samples
            should be read as individual perspectives.
          </p>
        </section>
      </div>
      <Button asChild className="mt-10">
        <Link href="/#explore">
          Get to know your campus <ArrowRight data-icon="inline-end" />
        </Link>
      </Button>
    </main>
  );
}
