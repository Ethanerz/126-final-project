"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  LogOut,
  ShieldCheck,
  LoaderCircle,
} from "lucide-react";
import { browserClient, isConfigured } from "@/lib/supabase";
import { isUpEmail } from "@/lib/validation";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
} from "@/components/ui/field";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { SubmissionForm } from "./submission-form";
import type { Submission } from "@/lib/types";

export function Account({
  initialMode,
  next,
}: {
  initialMode: string;
  next: string;
}) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [requests, setRequests] = useState<Submission[]>([]);
  const { session, loading, role, signOut } = useAuth();
  const router = useRouter();
  const destination =
    next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
      ? next
      : "/account";
  useEffect(() => {
    if (session)
      browserClient()
        .from("submissions")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20)
        .then(({ data }) => setRequests((data || []) as Submission[]));
  }, [session]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!isConfigured()) {
      setError("Account services aren’t configured yet.");
      return;
    }
    if (!isUpEmail(email)) {
      setError("Use your @up.edu.ph email address.");
      return;
    }
    setBusy(true);
    try {
      const db = browserClient();
      if (mode === "signup") {
        const { error } = await db.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/account` },
        });
        if (error) throw error;
        setMessage(
          "Check your UP email to confirm your account, then sign in here. No email? Check spam before requesting another.",
        );
      } else if (mode === "reset") {
        const { error } = await db.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/account?mode=recovery` },
        );
        if (error) throw error;
        setMessage(
          "If an account exists, you’ll receive a password reset link. Check your email.",
        );
      } else {
        const { error } = await db.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        router.push(destination === "/account" ? "/account" : destination);
        router.refresh();
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Sign-in failed. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (loading)
    return (
      <p role="status" className="body-copy">
        Checking your session…
      </p>
    );
  if (session)
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <p className="eyebrow mb-3">Your corner of campus</p>
          <h1 className="section-title">Good to have you here.</h1>
          <p className="body-copy mt-4">{session.user.email}</p>
          <p className="body-copy mt-2">
            Your email stays private. Each review shows the public display name
            you choose when posting.
          </p>
          {destination !== "/account" && (
            <Button asChild className="mt-5">
              <Link href={destination}>
                Continue to your place <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {role === "admin" && (
              <Button asChild>
                <Link href="/manage">Manage campus guide</Link>
              </Button>
            )}
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await signOut();
                  setRequests([]);
                } catch {
                  setError("We couldn’t sign you out. Please try again.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <LogOut data-icon="inline-start" />
              Sign out
            </Button>
          </div>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="mt-10">
            <h2 className="font-heading text-lg font-semibold">
              Your contributions
            </h2>
            <p className="body-copy mt-2">
              Edit or delete your reviews on their place page. Account deletion
              requests go privately to the site moderator.
            </p>
            <SubmissionForm
              kind="deletion"
              trigger="Request account deletion"
            />
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Your suggestions & reports</CardTitle>
            <CardDescription>
              Only you and moderators can see these submissions.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {requests.length ? (
              requests.map((r) => (
                <article key={r.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex justify-between gap-3 text-xs">
                    <strong className="capitalize">
                      {r.kind.replace("_", " ")}
                    </strong>
                    <span className="text-primary">{r.status}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">
                    {r.details}
                  </p>
                  {r.moderator_note && (
                    <p className="mt-3 text-xs leading-6 text-muted-foreground">
                      Moderator: {r.moderator_note}
                    </p>
                  )}
                </article>
              ))
            ) : (
              <p className="body-copy">
                No suggestions or reports yet. Help improve a place page by
                suggesting a correction.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  return (
    <div className="mx-auto grid max-w-4xl items-start gap-10 md:grid-cols-2">
      <div>
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to exploring
        </Link>
        <p className="eyebrow mb-4">
          A little campus knowledge goes a long way
        </p>
        <h1 className="font-display text-5xl leading-none">
          HELP THE NEXT
          <br />
          <span className="text-primary">PERSON FIND THEIR WAY.</span>
        </h1>
        <p className="body-copy mt-5">
          Browse freely. Use your UP email when you’re ready to share a
          firsthand experience or suggest a correction.
        </p>
        <div className="mt-6 flex items-start gap-3 text-xs leading-6 text-muted-foreground">
          <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
          Email confirmation verifies access to a UP mailbox. It does not
          certify current enrollment or UPV affiliation.
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "signup"
              ? "Join RateUPV"
              : mode === "reset"
                ? "Reset your password"
                : "Welcome back"}
          </CardTitle>
          <CardDescription>
            {mode === "signup"
              ? "A UP email, a useful experience, a better campus guide."
              : "Your campus guide is right where you left it."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="email">UP email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@up.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              {mode !== "reset" && (
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={mode === "signup" ? 8 : 6}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {mode === "signup" && (
                    <FieldDescription>
                      Use at least 8 characters. Confirm your email before
                      contributing.
                    </FieldDescription>
                  )}
                </Field>
              )}
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {message && (
                <Alert>
                  <AlertTitle>Check your email</AlertTitle>
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={busy}>
                {busy && (
                  <LoaderCircle
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                )}
                {mode === "signup"
                  ? "Create account"
                  : mode === "reset"
                    ? "Send reset link"
                    : "Sign in"}
                <ArrowRight data-icon="inline-end" />
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex flex-wrap justify-between gap-2">
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setMode(mode === "signup" ? "signin" : "signup");
              setError("");
              setMessage("");
            }}
          >
            {mode === "signup"
              ? "Already have an account?"
              : "Create an account"}
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setMode("reset");
              setError("");
              setMessage("");
            }}
          >
            Forgot password?
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
