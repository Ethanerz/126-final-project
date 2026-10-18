import type { Place, Review } from "./types";
import { publicClient } from "./supabase";

export function categoryOf(place: Pick<Place, "name" | "category">): string {
  if (place.category) return place.category;
  const n = place.name.toLowerCase();
  if (/library|rrc|research|print/.test(n)) return "Study & research";
  if (/admin|cash|registrar/.test(n) && !/atm/.test(n))
    return "Documents & payments";
  if (/comfort|atm|food|canteen/.test(n)) return "Everyday essentials";
  if (/health|clinic|support|osa|guidance/.test(n)) return "Health & support";
  return "Spaces & recreation";
}
export function statsOf(reviews: Review[]) {
  const visible = reviews.filter((r) => r.moderation_status !== "hidden");
  return {
    count: visible.length,
    average: visible.length
      ? visible.reduce((a, r) => a + r.rating, 0) / visible.length
      : null,
  };
}
export function filterPlaces(
  places: Place[],
  query: string,
  category: string,
  sort: string,
  campus = "all",
) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const result = places.filter(
    (p) =>
      !p.archived_at &&
      (category === "All places" || categoryOf(p) === category) &&
      (campus === "all" || (p.campus || "Miagao") === campus) &&
      words.every((w) =>
        [p.name, p.description, categoryOf(p), ...(p.aliases || [])]
          .join(" ")
          .toLowerCase()
          .includes(w),
      ),
  );
  return result.sort((a, b) => {
    if (sort === "reviews")
      return (
        statsOf(b.reviews).count - statsOf(a.reviews).count ||
        a.name.localeCompare(b.name)
      );
    if (sort === "rating") {
      // Bayesian prior prevents one 5-star review from winning by default.
      const score = (p: Place) => {
        const s = statsOf(p.reviews);
        return ((s.average || 0) * s.count + 3.5 * 5) / (s.count + 5);
      };
      return score(b) - score(a) || a.name.localeCompare(b.name);
    }
    if (sort === "relevance") {
      const priority = (p: Place) =>
        /library/.test(p.name.toLowerCase())
          ? 4
          : p.entity_type === "service"
            ? 3
            : /rrc|garden|park/.test(p.name.toLowerCase())
              ? 2
              : 1;
      return priority(b) - priority(a) || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name);
  });
}
export async function getPlaces(): Promise<Place[]> {
  const { data, error } = await publicClient()
    .from("entities")
    .select("*, reviews(*)")
    .order("name")
    .limit(200);
  if (error)
    throw new Error(
      "The campus directory could not be loaded. Please try again.",
    );
  return (data || []) as Place[];
}
export async function getPlace(id: string): Promise<Place | null> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
  )
    return null;
  const { data, error } = await publicClient()
    .from("entities")
    .select("*, reviews(*)")
    .eq("id", id)
    .maybeSingle();
  if (error)
    throw new Error("This place could not be loaded. Please try again.");
  return data as Place | null;
}
export function directionsUrl(
  place: Pick<Place, "latitude" | "longitude" | "name">,
) {
  const hasPin =
    place.latitude !== null &&
    place.longitude !== null &&
    Number.isFinite(place.latitude) &&
    Number.isFinite(place.longitude);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hasPin ? `${place.latitude},${place.longitude}` : `${place.name}, UP Visayas`)}&travelmode=walking`;
}
export function safeUrl(value: string | null | undefined) {
  if (!value) return undefined;
  try {
    const u = new URL(value);
    return u.protocol === "https:" ? u.href : undefined;
  } catch {
    return undefined;
  }
}
export function monthLabel(date: string) {
  return new Date(date.slice(0, 7) + "-15T12:00:00Z").toLocaleDateString(
    "en-PH",
    { month: "long", year: "numeric", timeZone: "Asia/Manila" },
  );
}
