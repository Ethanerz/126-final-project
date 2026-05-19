import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [userRole, setUserRole] = useState(null);  // ← ADD THIS

  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password
    });
    if (error) {
      console.error("there was a problem signing up: ", error);
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
        console.error("Sign-in error occurred: ", error);
        return { success: false, error: error.message };
      }
      console.log("Sign-in Success: ", data);
      return { success: true, data };
    } catch (error) {
      console.error("an error occurred: ", error);
      return { success: false, error: error.message };
    }
  };

  // Get session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ========== NEW: Fetch user role when session changes ==========
  useEffect(() => {
    const fetchUserRole = async () => {
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!error && data) {
          console.log('Fetched user role:', data.role);
          setUserRole(data.role);
        } else {
          console.log('No role found, defaulting to student');
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
      console.error("there was an error: ", error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, userRole, signUpNewUser, signOut, signInUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};