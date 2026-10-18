export const categories = [
  "All places",
  "Study & research",
  "Documents & payments",
  "Everyday essentials",
  "Health & support",
  "Spaces & recreation",
] as const;
export type Category = (typeof categories)[number];
export type Review = {
  id: string;
  entity_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  review_text: string;
  created_at: string;
  updated_at: string;
  visited_on?: string | null;
  display_name?: string | null;
  moderation_status?: string;
  upvote_count: number | null;
  downvote_count: number | null;
};
export type Place = {
  id: string;
  name: string;
  entity_type: "facility" | "service";
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  image_link: string | null;
  operating_hours: Record<string, string> | null;
  contact_info: Record<string, string> | null;
  category?: string | null;
  campus?: string | null;
  aliases?: string[] | null;
  preparation?: string | null;
  source_url?: string | null;
  source_checked_at?: string | null;
  archived_at?: string | null;
  reviews: Review[];
};
export type Submission = {
  id: string;
  user_id: string;
  entity_id: string | null;
  review_id: string | null;
  kind: "correction" | "missing_place" | "report" | "deletion";
  details: string;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  moderator_note: string | null;
  created_at: string;
};
