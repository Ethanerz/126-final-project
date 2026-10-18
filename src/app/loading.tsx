import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <main
      id="main"
      className="page-shell flex min-h-[65vh] flex-col gap-6 py-16"
      aria-label="Loading campus guide"
    >
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-20 w-3/4" />
      <Skeleton className="h-10 w-1/2" />
      <div className="grid gap-5 sm:grid-cols-3">
        {[1, 2, 3].map((n) => (
          <Skeleton key={n} className="h-64" />
        ))}
      </div>
    </main>
  );
}
