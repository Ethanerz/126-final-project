"use client";
import { useState } from "react";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "./auth-provider";
import { browserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Submission } from "@/lib/types";

export function SubmissionForm({
  kind,
  entityId,
  reviewId,
  trigger,
}: {
  kind: Submission["kind"];
  entityId?: string;
  reviewId?: string;
  trigger?: string;
}) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const title =
    kind === "report"
      ? "Report this content"
      : kind === "correction"
        ? "Suggest a correction"
        : kind === "deletion"
          ? "Request account deletion"
          : "Suggest a campus place";
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="link" size="sm" className="px-0">
          {trigger || title}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {sent ? "Thanks for helping improve RateUPV" : title}
          </DialogTitle>
          <DialogDescription>
            {kind === "report"
              ? "Report privacy concerns, harassment, spam, or misleading content. This reaches RateUPV moderators, not a university office."
              : kind === "deletion"
                ? "A moderator will review your request to remove your account and associated contributions. Do not include your password or student ID."
                : "Share what should change and a source or landmark if possible. Your suggestion stays private until reviewed."}
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="flex flex-col gap-4">
            <p className="body-copy">
              Your submission is saved. You can follow its status in your
              account. It has not been marked resolved.
            </p>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!session) return;
              setError("");
              if (text.trim().length < 15) {
                setError("Please add at least 15 characters of detail.");
                return;
              }
              setBusy(true);
              try {
                const { error } = await browserClient()
                  .from("submissions")
                  .insert({
                    kind,
                    user_id: session.user.id,
                    entity_id: entityId || null,
                    review_id: reviewId || null,
                    details: text.trim(),
                  });
                if (error) throw error;
                setSent(true);
                setText("");
              } catch {
                setError(
                  "Your submission wasn’t saved. Please try again. If this persists, contact the project maintainer through the repository.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <FieldGroup>
              <Field data-invalid={!!error}>
                <FieldLabel
                  htmlFor={`submission-${reviewId || entityId || kind}`}
                >
                  Details
                </FieldLabel>
                <Textarea
                  id={`submission-${reviewId || entityId || kind}`}
                  rows={5}
                  minLength={15}
                  maxLength={2000}
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  aria-invalid={!!error}
                  placeholder={
                    kind === "missing_place"
                      ? "Place name, campus, what it’s for, and where to find official information…"
                      : "What should we know? Include a useful source if you have one."
                  }
                />
                <FieldDescription>
                  15–2,000 characters. Avoid sharing personal information.
                </FieldDescription>
              </Field>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {session ? (
                <Button disabled={busy} type="submit">
                  {busy && (
                    <LoaderCircle
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  )}
                  Submit privately
                </Button>
              ) : (
                <>
                  <p className="body-copy">
                    Sign in with your confirmed UP email to submit. Keep this
                    tab open to retain your text.
                  </p>
                  <Button asChild>
                    <Link href="/account" target="_blank">
                      Sign in in a new tab
                    </Link>
                  </Button>
                </>
              )}
            </FieldGroup>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
