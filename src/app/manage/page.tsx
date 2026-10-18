import { Manage } from "@/components/manage";
export const metadata = {
  title: "Guide workspace",
  robots: { index: false, follow: false },
};
export default function ManagePage() {
  return (
    <main id="main" className="page-shell min-h-[65vh] py-12">
      <Manage />
    </main>
  );
}
