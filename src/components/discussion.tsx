"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "./auth-provider";
import { browserClient } from "@/lib/supabase";
import { monthLabel } from "@/lib/catalog";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Alert, AlertDescription } from "./ui/alert";
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
export type Reply = {
  id: string;
  review_id: string;
  user_id: string;
  reply_text: string;
  created_at: string;
  parent_reply_id: string | null;
};
export function Discussion({
  replies,
  reviewId,
}: {
  replies: Reply[];
  reviewId: string;
}) {
  const { session } = useAuth();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <section>
      <h2 className="section-title mb-6">Discussion</h2>
      <div className="mb-8 flex flex-col gap-3">
        {replies.length ? (
          replies.map((r) => (
            <article key={r.id} className="rounded-lg border bg-card p-5">
              <p className="text-xs text-muted-foreground">
                UP community member · {monthLabel(r.created_at)}
                {r.parent_reply_id ? " · Reply in thread" : ""}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
                {r.reply_text}
              </p>
              {session?.user.id === r.user_id && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" className="mt-3">
                      Delete your reply
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this reply?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently removes your reply.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep reply</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          const { error, data } = await browserClient()
                            .from("review_replies")
                            .delete()
                            .eq("id", r.id)
                            .eq("user_id", session.user.id)
                            .select("id");
                          if (error || !data?.length)
                            setError(
                              "Your reply wasn’t deleted. Please try again.",
                            );
                          else router.refresh();
                        }}
                      >
                        Delete reply
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </article>
          ))
        ) : (
          <p className="body-copy">
            No replies yet. Add helpful context or ask a respectful follow-up.
          </p>
        )}
      </div>
      {error && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {session ? (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (text.trim().length < 3) {
              setError("Please add a little more detail.");
              return;
            }
            setBusy(true);
            setError("");
            try {
              const { error } = await browserClient()
                .from("review_replies")
                .insert({
                  review_id: reviewId,
                  user_id: session.user.id,
                  reply_text: text.trim(),
                });
              if (error) throw error;
              setText("");
              router.refresh();
            } catch {
              setError(
                "Your reply wasn’t saved. Your text is still here; please try again.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reply">Add a reply</FieldLabel>
              <Textarea
                id="reply"
                required
                minLength={3}
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </Field>
            <Button type="submit" disabled={busy}>
              Post reply
            </Button>
          </FieldGroup>
        </form>
      ) : (
        <Button variant="outline" asChild>
          <Link href="/account">Sign in to join the discussion</Link>
        </Button>
      )}
    </section>
  );
}
