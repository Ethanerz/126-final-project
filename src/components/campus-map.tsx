"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import type { Place } from "@/lib/types";
import { filterPlaces, directionsUrl } from "@/lib/catalog";
import { Button } from "./ui/button";
import { InputGroup, InputGroupInput, InputGroupAddon } from "./ui/input-group";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
export function CampusMap({
  places,
  initialPlace,
}: {
  places: Place[];
  initialPlace?: string;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(
    initialPlace ||
      places.find((p) => /library/i.test(p.name))?.id ||
      places[0]?.id,
  );
  const [loadMap, setLoadMap] = useState(false);
  const filtered = useMemo(
    () => filterPlaces(places, query, "All places", "relevance"),
    [places, query],
  );
  const place = filtered.find((p) => p.id === selected) || filtered[0];
  const hasPin =
    place &&
    place.latitude !== null &&
    place.longitude !== null &&
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude);
  const lat = hasPin ? place.latitude! : 10.642;
  const lng = hasPin ? place.longitude! : 122.228;
  const embed = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.006}%2C${lat - 0.0035}%2C${lng + 0.006}%2C${lat + 0.0035}&layer=mapnik${hasPin ? `&marker=${lat}%2C${lng}` : ""}`;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <section aria-label="Places on the map" className="flex flex-col gap-3">
        <InputGroup className="bg-card">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Search map places"
            placeholder="Find a campus place…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </InputGroup>
        <p role="status" className="text-xs text-muted-foreground">
          {filtered.length} places · Select a place to locate it
        </p>
        <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pr-1 lg:max-h-[520px]">
          {filtered.map((p) => (
            <button
              key={p.id}
              aria-pressed={place?.id === p.id}
              onClick={() => {
                setSelected(p.id);
                const url = new URL(window.location.href);
                url.searchParams.set("place", p.id);
                window.history.replaceState(
                  null,
                  "",
                  url.pathname + url.search,
                );
              }}
              className={cn(
                "flex items-center gap-3 rounded-lg border px-4 py-4 text-left transition-colors",
                place?.id === p.id
                  ? "border-primary/30 bg-secondary"
                  : "bg-card hover:bg-secondary/50",
              )}
            >
              <MapPin className="size-4 shrink-0 text-primary" />
              <span className="flex-1">
                <span className="block text-sm font-medium">{p.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {p.campus || "Miagao"} · {p.entity_type}
                </span>
              </span>
              <ArrowRight className="size-3.5 text-primary" />
            </button>
          ))}
          {!filtered.length && (
            <p className="body-copy rounded-lg border bg-card p-5">
              No matching places. Try “library”, “cash”, or “CAS”.
            </p>
          )}
        </div>
      </section>
      <section
        aria-label="Interactive campus map"
        className="flex min-w-0 flex-col gap-4"
      >
        <div className="relative h-[380px] overflow-hidden rounded-xl border bg-secondary sm:h-[480px] lg:h-[560px]">
          {loadMap ? (
            <iframe
              key={embed}
              title={
                place ? `Map location of ${place.name}` : "Miagao campus map"
              }
              src={embed}
              className="size-full border-0"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <div className="paper-grid flex size-full flex-col items-center justify-center gap-5 p-8 text-center">
              <MapPin className="size-10 text-primary" />
              <div>
                <h2 className="font-heading text-xl font-bold">
                  A little orientation.
                </h2>
                <p className="body-copy mt-3 max-w-sm">
                  Load the interactive OpenStreetMap to locate campus places.
                  The map provider receives your IP address when loaded.
                </p>
              </div>
              <Button onClick={() => setLoadMap(true)}>
                Load campus map <ExternalLink data-icon="inline-end" />
              </Button>
              <p className="max-w-xs text-xs leading-6 text-muted-foreground">
                You can browse the list and open directions without loading the
                embedded map.
              </p>
            </div>
          )}
        </div>
        {place && (
          <div className="flex flex-col justify-between gap-4 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
            <div>
              <Badge variant="outline" className="mb-2">
                {hasPin
                  ? "Catalog pin · entrance not verified"
                  : "Exact pin unavailable"}
              </Badge>
              <h2 className="font-heading font-semibold">{place.name}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" asChild>
                <a href={directionsUrl(place)} target="_blank" rel="noreferrer">
                  <Navigation data-icon="inline-start" />
                  Directions
                </a>
              </Button>
              <Button asChild>
                <Link href={`/places/${place.id}`}>
                  Place guide <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </div>
        )}
        <p className="text-xs leading-6 text-muted-foreground">
          Map data ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            OpenStreetMap contributors
          </a>
          . Pins come from the RateUPV catalog and may need correction. The
          directory remains available if the external map cannot load.
        </p>
      </section>
    </div>
  );
}
