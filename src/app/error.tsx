"use client";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <main id="main" className="page-shell min-h-[65vh] py-16">
      <Alert variant="destructive" className="max-w-xl">
        <AlertTitle>The campus guide couldn’t load</AlertTitle>
        <AlertDescription>
          Something went wrong while loading this page. Please try again.
        </AlertDescription>
      </Alert>
      <Button onClick={retry} className="mt-5">
        Try again
      </Button>
    </main>
  );
}
