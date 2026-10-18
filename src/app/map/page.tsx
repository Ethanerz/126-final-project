import { getPlaces } from "@/lib/catalog";
import { CampusMap } from "@/components/campus-map";
export const dynamic = "force-dynamic";
export const metadata = { title: "Campus map" };
export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string }>;
}) {
  const [places, q] = await Promise.all([getPlaces(), searchParams]);
  return (
    <main id="main" className="page-shell py-10">
      <p className="eyebrow mb-3">Miagao / find your bearings</p>
      <h1 className="section-title">A campus worth getting to know.</h1>
      <p className="body-copy mb-7 mt-3">
        Find a place, check its guide, and plan your next visit.
      </p>
      <CampusMap
        places={places.filter((p) => !p.archived_at)}
        initialPlace={q.place}
      />
    </main>
  );
}
