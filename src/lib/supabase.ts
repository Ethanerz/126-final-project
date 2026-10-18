import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}

// Public server reads never use cookies or a privileged key. User-specific writes
// come from the authenticated browser client and remain subject to database RLS.
export function publicClient() {
  if (!isConfigured())
    throw new Error("Supabase is not configured. See .env.example.");
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
let browser: SupabaseClient<Database> | undefined;
export function browserClient() {
  if (!isConfigured())
    throw new Error("Supabase is not configured. See .env.example.");
  browser ??= createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
  return browser;
}
