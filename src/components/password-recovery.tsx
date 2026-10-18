"use client";
import { useState } from "react";
import Link from "next/link";
import { browserClient } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Field, FieldGroup, FieldLabel } from "./ui/field";
import { Input } from "./ui/input";
export function PasswordRecovery() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mx-auto max-w-md">
      <h1 className="section-title mb-5">Choose a new password</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          try {
            const { error } = await browserClient().auth.updateUser({
              password,
            });
            if (error) throw error;
            setMessage("Password updated. You can return to your account.");
          } catch (e) {
            setMessage(
              e instanceof Error ? e.message : "Password could not be updated.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="new-password">New password</FieldLabel>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
          <Button disabled={busy}>Update password</Button>
          {message && (
            <p role="status" className="body-copy">
              {message}
            </p>
          )}
          <Button variant="link" asChild>
            <Link href="/account">Back to account</Link>
          </Button>
        </FieldGroup>
      </form>
    </div>
  );
}
