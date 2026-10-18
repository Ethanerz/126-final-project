import { Account } from "@/components/account";
import { PasswordRecovery } from "@/components/password-recovery";
export const metadata = { title: "Your account" };
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; next?: string }>;
}) {
  const p = await searchParams;
  return (
    <main id="main" className="page-shell min-h-[65vh] py-12 sm:py-16">
      {p.mode === "recovery" ? (
        <PasswordRecovery />
      ) : (
        <Account
          initialMode={p.mode === "signup" ? "signup" : "signin"}
          next={p.next || "/account"}
        />
      )}
    </main>
  );
}
