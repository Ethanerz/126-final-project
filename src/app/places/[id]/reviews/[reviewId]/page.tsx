import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPlace } from "@/lib/catalog";
import { publicClient } from "@/lib/supabase";
import { Discussion, type Reply } from "@/components/discussion";
import { SubmissionForm } from "@/components/submission-form";
export const dynamic = "force-dynamic";
export const metadata = { title: "Student discussion" };
export default async function Thread({
  params,
}: {
  params: Promise<{ id: string; reviewId: string }>;
}) {
  const { id, reviewId } = await params;
  const p = await getPlace(id);
  const review = p?.reviews.find((r) => r.id === reviewId);
  if (!p || !review) notFound();
  const { data, error } = await publicClient()
    .from("review_replies")
    .select("id,review_id,user_id,reply_text,created_at,parent_reply_id")
    .eq("review_id", reviewId)
    .order("created_at")
    .limit(100);
  if (error) throw new Error("Discussion could not be loaded.");
  return (
    <main id="main" className="page-shell max-w-3xl py-12">
      <Link
        href={`/places/${id}#experiences`}
        className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to {p.name}
      </Link>
      <p className="eyebrow mb-3">
        Student experience / {review.rating} out of 5
      </p>
      <h1 className="section-title">{review.title || "A campus experience"}</h1>
      <p className="body-copy mt-5 whitespace-pre-wrap">{review.review_text}</p>
      <p className="mt-4 text-xs text-muted-foreground">
        Shared by {review.display_name || "UP community member"}
      </p>
      <SubmissionForm
        kind="report"
        entityId={id}
        reviewId={reviewId}
        trigger="Report this experience or discussion"
      />
      <div className="mt-10">
        <Discussion reviewId={reviewId} replies={(data || []) as Reply[]} />
      </div>
    </main>
  );
}
