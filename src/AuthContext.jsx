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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message === "Email not confirmed") {
          return {
            error: {
              message: "Please verify your email first.",
              needsVerification: true,
              email,
            },
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
          type: "signup",
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
        console.error("Resend error:", error);
        return { error: error.message }; // Return plain error message
      } finally {
        setLoading(false);
      }
    },

    // Add this method to your existing AuthContext.js
    registerStudent: async (email, password, studentData) => {
      setLoading(true);
      try {
        // Step 1: Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: {
                full_name: studentData.name,
                age: studentData.age,
                birthday: studentData.birthday,
                role: "student", // Set default role
              },
              emailRedirectTo: `${window.location.origin}/login`,
            },
          }
        );

        if (authError) throw authError;

        // Step 2: Create User record in user table
        const { data: userRecord, error } = await supabase
          .from("user")
          .insert([
            {
              userID: authData.user.id,
              user_email: email,
              user_password: password,
              role: "student"
            },
          ])
          .select();

        // Step 2: Create student record in students table
        const { data: studentRecord, error: dbError } = await supabase
          .from("students")
          .insert([
            {
              student_name: studentData.name,
              student_birthday: studentData.birthday,
              student_age: studentData.age,
              status: "active", // Default status
              userID: authData.user.id,
            },
          ])
          .select();

        if (dbError) throw dbError;

        return {
          authData,
          studentData: studentRecord[0],
        };
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
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
