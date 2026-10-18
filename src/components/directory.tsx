"use client";
import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { categories, type Place } from "@/lib/types";
import { filterPlaces } from "@/lib/catalog";
import { PlaceCard, categoryIcons } from "./place-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@/components/ui/input-group";
import { cn } from "@/lib/utils";

export function Directory({
  places,
  initialQuery = "",
  initialCategory = "All places",
}: {
  places: Place[];
  initialQuery?: string;
  initialCategory?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(
    categories.includes(initialCategory as (typeof categories)[number])
      ? initialCategory
      : "All places",
  );
  const [sort, setSort] = useState("relevance");
  const filtered = useMemo(
    () => filterPlaces(places, query, category, sort),
    [places, query, category, sort],
  );
  function update(nextQuery: string, nextCategory: string) {
    setQuery(nextQuery);
    setCategory(nextCategory);
  }
  return (
    <section
      id="explore"
      aria-labelledby="directory-title"
      className="scroll-mt-6 py-10 sm:py-14"
    >
      <div className="page-shell">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Find your way</p>
            <h2 id="directory-title" className="section-title">
              Explore campus
            </h2>
          </div>
          <Link
            href="/map"
            className="flex items-center gap-2 text-sm font-medium text-primary"
          >
            See the campus map <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mb-7 flex flex-col gap-3 sm:flex-row">
          <InputGroup className="h-12 flex-1 bg-card">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              aria-label="Search campus places"
              placeholder="Search places, services, or what you need…"
              value={query}
              onChange={(e) => update(e.target.value, category)}
            />
            {query && (
              <InputGroupAddon align="inline-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Clear search"
                  onClick={() => update("", category)}
                >
                  <X />
                </Button>
              </InputGroupAddon>
            )}
          </InputGroup>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger
              aria-label="Sort places"
              className="h-12 w-full sm:w-52"
            >
              <ArrowDownUp />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="relevance">Recommended</SelectItem>
                <SelectItem value="name">Name A–Z</SelectItem>
                <SelectItem value="reviews">Most reviewed</SelectItem>
                <SelectItem value="rating">
                  Rating, adjusted for count
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-0 grid-cols-1 gap-7 lg:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="min-w-0">
            <p className="mb-3 hidden items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground lg:flex">
              <SlidersHorizontal className="size-3.5" />
              Categories
            </p>
            <div
              className="flex gap-1.5 overflow-x-auto pb-2 lg:flex-col"
              role="group"
              aria-label="Filter by category"
            >
              {categories.map((c) => {
                const Icon = categoryIcons[c];
                return (
                  <button
                    key={c}
                    aria-pressed={category === c}
                    onClick={() => update(query, c)}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-3 text-left text-sm transition-colors",
                      category === c
                        ? "bg-primary font-medium text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary",
                    )}
                  >
                    {Icon ? (
                      <Icon className="size-4" />
                    ) : (
                      <span className="flex size-4 items-center justify-center text-base">
                        ✳
                      </span>
                    )}
                    {c}
                    {c === "All places" && (
                      <span className="ml-auto text-xs opacity-70">
                        {places.filter((p) => !p.archived_at).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-7 hidden border-t pt-5 lg:block">
              <p className="text-sm font-semibold">Something missing?</p>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                Good campus knowledge starts with someone sharing it.
              </p>
              <Button variant="link" className="mt-2 px-0" asChild>
                <Link href="/suggest">
                  Suggest a place <ArrowRight data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </aside>
          <div className="min-w-0">
            <p
              className="mb-4 text-xs text-muted-foreground"
              role="status"
              aria-live="polite"
            >
              {filtered.length} {filtered.length === 1 ? "place" : "places"}
              {query ? ` matching “${query}”` : " to get to know"}{" "}
              <span className="ml-1">· Miagao campus pilot</span>
            </p>
            {filtered.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((place) => (
                  <PlaceCard key={place.id} place={place} />
                ))}
              </div>
            ) : (
              <Empty className="min-h-80 border bg-card">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Search />
                  </EmptyMedia>
                  <EmptyTitle>No places found</EmptyTitle>
                  <EmptyDescription>
                    Try another name or category. Our pilot directory is still
                    growing.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button
                    variant="outline"
                    onClick={() => update("", "All places")}
                  >
                    Clear filters
                  </Button>
                  <Button variant="link" asChild>
                    <Link href="/suggest">Suggest the missing place</Link>
                  </Button>
                </EmptyContent>
              </Empty>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
