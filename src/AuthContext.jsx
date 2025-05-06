import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Handle password recovery
      if (event === "PASSWORD_RECOVERY") {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    session,
    user,
    isLoading: loading,

    // Sign in with email/password
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );
      if (error) {
        if (error.message === 'Email not confirmed') {
          return { 
            error: {
              message: 'Please verify your email first.',
              needsVerification: true,
              email
            }
          };
        }
        throw error;
      }
      return data;
    },

    // Resend verification email
    resendVerification: async (email) => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email,
          options: {
            redirectTo: window.location.origin + "/login",
          },
        });
    
        if (error) {
          throw new Error(error.message); // Convert to regular Error
        }
        return { success: true };
      } catch (error) {
        console.error('Resend error:', error);
        return { error: error.message }; // Return plain error message
      } finally {
        setLoading(false);
      }
    },

    // Register new User
    signUp: async (email, password, metadata = {}) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata, // Include additional user data
        },
      });
      if (error) throw error;
      return data;
    },

    // SignIn with google
    signInWithGoogle: async () => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/chat",
        },
      });
      if (error) throw error;
      return data;
    },

    // SignOut
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },

    // Reset Password
    resetPassword: async (email) => {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/update-password",
      });
      if (error) throw error;
      return data;
    },

    // Update password
    updatePassword: async (newPassword) => {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return data;
    },

    // Update profile
    updateUserProfile: async (updates) => {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });
      if (error) throw error;
      return data;
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
