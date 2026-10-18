"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { browserClient, isConfigured } from "@/lib/supabase";

type AuthState = {
  session: Session | null;
  loading: boolean;
  role: string | null;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthState>({
  session: null,
  loading: true,
  role: null,
  signOut: async () => {},
});
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      return;
    }
    const db = browserClient();
    let active = true;
    db.auth
      .getSession()
      .then(({ data, error }) => {
        if (active) {
          setSession(error ? null : data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, next) => {
      if (active) {
        setSession(next);
        setLoading(false);
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    setRole(null);
    if (session?.user.id)
      browserClient()
        .from("user_profiles")
        .select("role")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (active) setRole(data?.role || "unknown");
        });
    return () => {
      active = false;
    };
  }, [session?.user.id]);
  const signOut = useCallback(async () => {
    const { error } = await browserClient().auth.signOut();
    if (error) throw error;
    setSession(null);
    setRole(null);
  }, []);
  return (
    <AuthContext.Provider value={{ session, loading, role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
