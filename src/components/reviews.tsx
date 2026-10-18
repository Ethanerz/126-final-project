"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  MessageSquareText,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { useAuth } from "./auth-provider";
import { browserClient } from "@/lib/supabase";
import { monthLabel, statsOf } from "@/lib/catalog";
import { validateReview } from "@/lib/validation";
import type { Review } from "@/lib/types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "./ui/alert-dialog";
import { Field, FieldGroup, FieldLabel, FieldDescription } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "./ui/empty";
import { Alert, AlertDescription } from "./ui/alert";
import { SubmissionForm } from "./submission-form";

type Draft = {
  rating: number;
  title: string;
  review_text: string;
  display_name: string;
  visited_on: string;
};
function ReviewForm({
  entityId,
  initial,
  onSaved,
}: {
  entityId: string;
  initial?: Review;
  onSaved: () => void;
}) {
  const { session } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const draftKey = `rateupv:review:v1:${entityId}`;
  const [form, setForm] = useState<Draft>(() => {
    if (initial)
      return {
        rating: initial.rating,
        title: initial.title || "",
        review_text: initial.review_text,
        display_name: initial.display_name || "UP community member",
        visited_on: initial.visited_on?.slice(0, 7) || "",
      };
    try {
      const draft = JSON.parse(sessionStorage.getItem(draftKey) || "null");
      if (
        draft &&
        typeof draft.title === "string" &&
        typeof draft.review_text === "string"
      )
        return {
          rating: Number(draft.rating) || 0,
          title: draft.title,
          review_text: draft.review_text,
          display_name:
            typeof draft.display_name === "string" ? draft.display_name : "",
          visited_on:
            typeof draft.visited_on === "string" ? draft.visited_on : "",
        };
    } catch {}
    return {
      rating: 0,
      title: "",
      review_text: "",
      display_name: "",
      visited_on: "",
    };
  });
  function change(patch: Partial<Draft>) {
    const next = { ...form, ...patch };
    setForm(next);
    if (!initial)
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(next));
      } catch {}
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const message = validateReview(form);
    if (message) {
      setError(message);
      return;
    }
    if (!session) return;
    setBusy(true);
    try {
      const db = browserClient();
      const payload = {
        rating: form.rating,
        title: form.title.trim(),
        review_text: form.review_text.trim(),
        display_name: form.display_name.trim(),
        visited_on: form.visited_on + "-01",
      };
      const { error } = initial
        ? await db
            .from("reviews")
            .update(payload)
            .eq("id", initial.id)
            .eq("user_id", session.user.id)
            .select("id")
            .single()
        : await db
            .from("reviews")
            .insert({
              ...payload,
              entity_id: entityId,
              user_id: session.user.id,
            })
            .select("id")
            .single();
      if (error) {
        if (error.code === "23505")
          throw new Error(
            "You already have a review here. Close this form and edit your existing experience.",
          );
        throw error;
      }
      try {
        sessionStorage.removeItem(draftKey);
      } catch {}
      onSaved();
    } catch (e) {
      setError(
        e instanceof Error && e.message.startsWith("You already")
          ? e.message
          : "Your review wasn’t saved. Your text is still here; please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit}>
      <FieldGroup>
        <Field>
          <FieldLabel>Overall experience</FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            value={form.rating ? String(form.rating) : ""}
            onValueChange={(v) => change({ rating: Number(v) || 0 })}
            aria-label="Overall experience rating"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <ToggleGroupItem
                key={n}
                value={String(n)}
                aria-label={`${n} out of 5 stars`}
              >
                {n}
                <Star />
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldDescription>
            1 = difficult experience · 5 = excellent experience
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="review-visit">When did you visit?</FieldLabel>
          <Input
            id="review-visit"
            type="month"
            min="2000-01"
            max={new Date().toISOString().slice(0, 7)}
            required
            value={form.visited_on}
            onChange={(e) => change({ visited_on: e.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="review-name">Public display name</FieldLabel>
          <Input
            id="review-name"
            autoComplete="nickname"
            placeholder="A name you’re comfortable sharing"
            minLength={2}
            maxLength={40}
            required
            value={form.display_name}
            onChange={(e) => change({ display_name: e.target.value })}
          />
          <FieldDescription>
            This appears beside your review. Your UP email does not. Operators
            can associate your contribution with your account.
          </FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="review-title">One-line takeaway</FieldLabel>
          <Input
            id="review-title"
            maxLength={120}
            required
            value={form.title}
            onChange={(e) => change({ title: e.target.value })}
            placeholder="What would you tell a friend?"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="review-text">
            Your firsthand experience
          </FieldLabel>
          <Textarea
            id="review-text"
            rows={5}
            minLength={20}
            maxLength={2000}
            required
            value={form.review_text}
            onChange={(e) => change({ review_text: e.target.value })}
            placeholder="What worked? What should the next person know? Keep it about the place or service."
          />
          <FieldDescription>
            20–2,000 characters. Don’t post someone’s personal information.
          </FieldDescription>
        </Field>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {session ? (
          <Button type="submit" disabled={busy}>
            {busy && (
              <LoaderCircle data-icon="inline-start" className="animate-spin" />
            )}
            {initial ? "Save changes" : "Share experience"}
          </Button>
        ) : (
          <>
            <p className="body-copy">
              Your draft is saved in this tab while you sign in.
            </p>
            <Button asChild>
              <Link
                href={`/account?next=${encodeURIComponent(`/places/${entityId}?review=1`)}`}
              >
                Sign in to share
              </Link>
            </Button>
          </>
        )}
      </FieldGroup>
    </form>
  );
}

export function Reviews({
  reviews,
  entityId,
  autoOpen = false,
}: {
  reviews: Review[];
  entityId: string;
  autoOpen?: boolean;
}) {
  const { session } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(autoOpen);
  const [edit, setEdit] = useState<Review | undefined>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [privateOwnReview, setPrivateOwnReview] = useState<Review | null>(null);
  useEffect(() => {
    let active = true;
    setPrivateOwnReview(null);
    if (session?.user.id) {
      browserClient()
        .from("reviews")
        .select("*")
        .eq("entity_id", entityId)
        .eq("user_id", session.user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (active) setPrivateOwnReview(data as Review | null);
        });
    }
    return () => {
      active = false;
    };
  }, [session?.user.id, entityId, reviews]);
  const combined =
    privateOwnReview && !reviews.some((r) => r.id === privateOwnReview.id)
      ? [...reviews, privateOwnReview]
      : reviews;
  const visible = combined
    .filter(
      (r) => r.moderation_status !== "hidden" || r.user_id === session?.user.id,
    )
    .sort((a, b) =>
      (b.visited_on || b.created_at).localeCompare(
        a.visited_on || a.created_at,
      ),
    );
  const mine = combined.find((r) => r.user_id === session?.user.id);
  const stats = statsOf(reviews);
  return (
    <section id="experiences" className="scroll-mt-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">From people who’ve been there</p>
          <h2 className="section-title">Student experiences</h2>
        </div>
        <Button
          onClick={() => {
            setEdit(mine);
            setOpen(true);
          }}
        >
          <Pencil data-icon="inline-start" />
          {mine ? "Edit your experience" : "Share an experience"}
        </Button>
      </div>
      <p className="mb-6 text-sm leading-7 text-muted-foreground">
        {stats.count
          ? `${stats.average!.toFixed(1)} out of 5 from ${stats.count} ${stats.count === 1 ? "experience" : "experiences"}. ${stats.count < 5 ? "Early impressions — this is a small sample." : "Ratings reflect individual experiences."}`
          : "No ratings yet. The first honest experience can help the next visitor."}{" "}
        UP email confirmation verifies mailbox access; visits are self-reported.
      </p>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {visible.length ? (
        <div className="flex flex-col gap-4">
          {visible.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border bg-card p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-10 items-center justify-center rounded-full bg-secondary font-heading text-sm font-bold text-primary"
                    aria-hidden="true"
                  >
                    {(r.display_name || "UP").slice(0, 2).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {r.display_name || "UP community member"}
                      {r.user_id === session?.user.id && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          You
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.visited_on
                        ? `Visited ${monthLabel(r.visited_on)}`
                        : `Posted ${monthLabel(r.created_at)} · visit date not recorded`}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">
                  <Star fill="currentColor" />
                  {r.rating}/5
                </Badge>
              </div>
              {r.moderation_status === "hidden" && (
                <Badge variant="outline" className="mt-4">
                  Hidden by a moderator
                </Badge>
              )}
              <h3 className="mt-5 font-semibold">
                {r.title || "A campus experience"}
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {r.review_text}
              </p>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Link
                  href={`/places/${entityId}/reviews/${r.id}`}
                  className="flex items-center gap-1.5 text-xs text-primary"
                >
                  <MessageSquareText className="size-3.5" />
                  Discussion
                </Link>
                <div className="flex items-center gap-4">
                  {r.user_id === session?.user.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEdit(r);
                          setOpen(true);
                        }}
                      >
                        <Pencil data-icon="inline-start" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy === r.id}
                          >
                            <Trash2 data-icon="inline-start" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete your experience?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This also removes its discussion and votes. This
                              cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Keep it</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                setBusy(r.id);
                                setError("");
                                try {
                                  const { error, data } = await browserClient()
                                    .from("reviews")
                                    .delete()
                                    .eq("id", r.id)
                                    .eq("user_id", session!.user.id)
                                    .select("id");
                                  if (error || !data?.length) throw error;
                                  setPrivateOwnReview(null);
                                  router.refresh();
                                } catch {
                                  setError(
                                    "Your review wasn’t deleted. Please try again.",
                                  );
                                } finally {
                                  setBusy(null);
                                }
                              }}
                            >
                              Delete experience
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  ) : (
                    <SubmissionForm
                      kind="report"
                      entityId={entityId}
                      reviewId={r.id}
                      trigger="Report"
                    />
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty className="border bg-card py-14">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MessageSquareText />
            </EmptyMedia>
            <EmptyTitle>Be the first to share a little context.</EmptyTitle>
            <EmptyDescription>
              Tell the next student what to expect. Useful, balanced details
              matter more than a perfect rating.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {edit ? "Update your experience" : "Help the next visitor"}
            </DialogTitle>
            <DialogDescription>
              One current review per person, per place. Keep it firsthand, fair,
              and useful.
            </DialogDescription>
          </DialogHeader>
          <ReviewForm
            key={(edit || mine)?.id || "new"}
            entityId={entityId}
            initial={edit || mine}
            onSaved={() => {
              setOpen(false);
              setEdit(undefined);
              setPrivateOwnReview(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
