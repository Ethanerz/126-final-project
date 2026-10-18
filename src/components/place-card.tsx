import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  Coffee,
  HeartHandshake,
  MapPin,
  Trees,
  Star,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { categoryOf, statsOf } from "@/lib/catalog";
import type { Place } from "@/lib/types";

export const categoryIcons: Record<string, typeof BookOpen> = {
  "Study & research": BookOpen,
  "Documents & payments": Building2,
  "Everyday essentials": Coffee,
  "Health & support": HeartHandshake,
  "Spaces & recreation": Trees,
};
export function PlaceCard({ place }: { place: Place }) {
  const category = categoryOf(place);
  const Icon = categoryIcons[category] || MapPin;
  const stats = statsOf(place.reviews);
  return (
    <Link
      href={`/places/${place.id}`}
      aria-label={place.name}
      className="block h-full rounded-xl"
    >
      <Card className="group flex h-full flex-col gap-0 overflow-hidden transition-shadow hover:shadow-md">
        <CardHeader className="pb-4">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg border border-primary/10 bg-secondary text-primary">
              <Icon className="size-5" />
            </div>
            <Badge variant="outline">
              {place.entity_type === "service" ? "Service" : "Facility"}
            </Badge>
          </div>
          <CardDescription className="mb-1">{category}</CardDescription>
          <CardTitle className="leading-snug">{place.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 pb-5">
          <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
            {place.description ||
              "Help the next student get to know this campus place."}
          </p>
          <span className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5" />
            {place.campus || "Miagao"} campus
          </span>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t py-4">
          <div className="flex items-center gap-1.5 text-sm">
            <Star
              className="size-4 text-primary"
              fill={stats.count ? "currentColor" : "none"}
            />
            {stats.average ? (
              <>
                <strong>{stats.average.toFixed(1)}</strong>
                <span className="text-xs text-muted-foreground">
                  ({stats.count} {stats.count === 1 ? "review" : "reviews"})
                </span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">
                No experiences yet
              </span>
            )}
          </div>
          <ArrowUpRight className="size-4 text-primary transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </CardFooter>
      </Card>
    </Link>
  );
}
