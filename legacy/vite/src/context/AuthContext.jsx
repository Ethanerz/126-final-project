import { createContext, useEffect, useState, useContext, useCallback } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  // undefined = still resolving, null = signed-out visitor, object = session.
  const [session, setSession] = useState(undefined);
  const [userRole, setUserRole] = useState(null);

  // Signed-out visitors browse anonymously (RLS grants the `anon` role read
  // access). There is no shared guest account — writes require a real session
  // with the student role.
  const isVisitor = session === null;
  const canWrite = !!session && userRole !== 'guest';

  // Auth modal (login/signup overlay) state + controls.
  const [authModal, setAuthModal] = useState({ open: false, mode: 'signin' });
  const openAuth = useCallback((mode = 'signin') => setAuthModal({ open: true, mode }), []);
  const closeAuth = useCallback(() => setAuthModal((m) => ({ ...m, open: false })), []);

  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        // Where the confirmation link sends the user back to. Must be listed
        // under Authentication → URL Configuration → Redirect URLs in Supabase.
        emailRedirectTo: `${window.location.origin}/`
      }
    });
    if (error) {
      return { success: false, error };
    }
    return { success: true, data };
  };

  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Get session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Supabase re-checks and refreshes the token whenever the tab regains focus,
    // firing an event here. Replacing the session object on every such event would
    // re-run every [session] effect (refetch + loading skeleton). Keep the same
    // object while it's the same logged-in user; only update on real sign-in/out.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession((prev) =>
        prev?.user?.id && prev.user.id === newSession?.user?.id ? prev : newSession
      );
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch user role when session changes
  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!error && data) {
          setUserRole(data.role);
        } else {
          setUserRole('student');
        }
      } else {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [session]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, userRole, isVisitor, canWrite, signUpNewUser, signOut, signInUser, authModal, openAuth, closeAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
