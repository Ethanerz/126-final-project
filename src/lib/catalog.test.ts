import { describe, it, expect } from "vitest";
import {
  categoryOf,
  directionsUrl,
  filterPlaces,
  safeUrl,
  statsOf,
} from "./catalog";
import { validateReview, isUpEmail } from "./validation";
import type { Place, Review } from "./types";
const review = (rating: number): Review => ({
  id: crypto.randomUUID(),
  entity_id: "place",
  user_id: "author",
  rating,
  title: "Helpful",
  review_text: "A firsthand campus experience.",
  created_at: "2026-09-01",
  updated_at: "2026-09-01",
  upvote_count: 0,
  downvote_count: 0,
});
const place = (name: string, reviews: Review[] = []): Place => ({
  id: name,
  name,
  entity_type: "facility",
  description: null,
  latitude: 10.64,
  longitude: 122.22,
  address: null,
  image_link: null,
  operating_hours: null,
  contact_info: null,
  reviews,
});
describe("discovery and evidence", () => {
  it("finds aliases, category and multiple query terms without changing the catalog", () => {
    const places = [
      {
        ...place("Cash Office"),
        category: "Documents & payments",
        aliases: ["cashier"],
      },
      place("Garden"),
    ];
    expect(
      filterPlaces(places, "cashier payments", "All places", "name").map(
        (p) => p.name,
      ),
    ).toEqual(["Cash Office"]);
    expect(places[0].name).toBe("Cash Office");
  });
  it("includes unreviewed places and excludes archived places", () => {
    expect(
      filterPlaces(
        [place("Library"), { ...place("Closed"), archived_at: "2026-01-01" }],
        "",
        "All places",
        "name",
      ),
    ).toHaveLength(1);
  });
  it("does not equate a missing rating to a bad rating", () => {
    expect(statsOf([])).toEqual({ count: 0, average: null });
  });
  it("does not count hidden reviews", () => {
    expect(
      statsOf([review(4), { ...review(1), moderation_status: "hidden" }]),
    ).toEqual({ count: 1, average: 4 });
  });
  it("tempers a lone five-star review when ranking against a well-reviewed place", () => {
    const r = filterPlaces(
      [
        place("One", [review(5)]),
        place(
          "Many",
          Array.from({ length: 15 }, () => review(4)),
        ),
      ],
      "",
      "All places",
      "rating",
    );
    expect(r[0].name).toBe("Many");
  });
  it("finds study places before incidental campus facilities by default", () => {
    expect(
      filterPlaces(
        [place("CAS Comfort Rooms"), place("UPV New Library")],
        "",
        "All places",
        "relevance",
      )[0].name,
    ).toContain("Library");
  });
  it("filters campuses and inferred categories", () => {
    expect(categoryOf(place("CAS Comfort Rooms"))).toBe("Everyday essentials");
    expect(
      filterPlaces(
        [{ ...place("Office"), campus: "Iloilo City" }],
        "",
        "All places",
        "name",
        "Miagao",
      ),
    ).toEqual([]);
  });
});
describe("safe external links", () => {
  it("does not invent a pin from missing coordinates", () => {
    const url = directionsUrl({
      ...place("Library"),
      latitude: null,
      longitude: null,
    });
    expect(url).toContain("Library%2C%20UP%20Visayas");
    expect(url).not.toContain("null");
  });
  it("encodes coordinates into a keyless directions URL", () => {
    expect(directionsUrl(place("Library"))).toContain("10.64%2C122.22");
  });
  it("accepts HTTPS sources and rejects script or malformed schemes", () => {
    expect(safeUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeUrl("http://example.org")).toBeUndefined();
    expect(safeUrl("https://upv.edu.ph/")).toBe("https://upv.edu.ph/");
  });
});
describe("contribution validation", () => {
  const good = {
    rating: 4,
    title: "A useful visit",
    review_text: "I used the service and this is my firsthand experience.",
    display_name: "Campus reader",
    visited_on: "2026-09",
  };
  const now = new Date("2026-10-18T00:00:00Z");
  it("allows a complete firsthand experience", () =>
    expect(validateReview(good, now)).toBeNull());
  it.each(["2026-13", "2027-01", "1999-01", "2026-00"])(
    "rejects invalid or future visit month %s",
    (visited_on) =>
      expect(validateReview({ ...good, visited_on }, now)).not.toBeNull(),
  );
  it("requires real detail and a valid rating", () => {
    expect(validateReview({ ...good, review_text: "   " }, now)).not.toBeNull();
    expect(validateReview({ ...good, rating: 0 }, now)).not.toBeNull();
  });
  it("does not accept lookalike university domains", () => {
    expect(isUpEmail("student@up.edu.ph.evil.com")).toBe(false);
    expect(isUpEmail("student@up.edu.ph")).toBe(true);
  });
});
