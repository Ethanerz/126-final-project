"use client";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="page-shell min-h-[65vh] py-16">
      <Alert variant="destructive" className="max-w-xl">
        <AlertTitle>The campus guide couldn’t load</AlertTitle>
        <AlertDescription>
          We couldn’t reach the directory. Please check your connection and try
          again.
        </AlertDescription>
      </Alert>
      <Button onClick={reset} className="mt-5">
        Try again
      </Button>
    </main>
  );
}
