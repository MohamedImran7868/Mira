import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserProfile = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      // Fetch from your user table
      const { data: userData, error } = await supabase
        .from("user")
        .select("*")
        .eq("userID", authUser.id)
        .single();

      if (error) throw error;

      // Combine auth user with custom user data
      const completeUser = {
        ...authUser,
        ...userData,
        role: userData.role, // Ensure role is included
      };

      setUser(completeUser);
      setUserProfile(userData);

      // For student role, fetch additional data
      if (userData.role === "student") {
        const { data: studentData } = await supabase
          .from("students")
          .select("*")
          .eq("userID", authUser.id)
          .single();

        setUserProfile((prev) => ({ ...prev, ...studentData }));
      }

      return completeUser;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  };

  useEffect(() => {
    // Fetch initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // This updates the global user state
        getUserProfile();
      } else {
        setUser(null);
        setUserProfile(null);
      }

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
    userProfile,
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

    // Register a new Student
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
              user_name: studentData.name,
              user_email: email,
              user_password: password,
              role: "student",
            },
          ])
          .select();

        // Step 2: Create student record in students table
        const { data: studentRecord, error: dbError } = await supabase
          .from("students")
          .insert([
            {
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

    // Generate the public path for the image
    getImageUrl: (path) => {
      return `${supabase.supabaseUrl}/storage/v1/object/public/profile-picture/${path}`;
    },

    // Update user profile
    updateProfile: async (updates) => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // First, update the user table
        const { data: userData, error: userError } = await supabase
          .from("user")
          .update({
            user_name: updates.name,
            user_email: updates.email,
            updated_at: new Date().toISOString(),
          })
          .eq("userID", user.id)
          .select()
          .single();

        if (userError) throw userError;

        // Then, update the students table
        const { data: studentData, error: studentError } = await supabase
          .from("students")
          .update({
            student_birthday: updates.birthday,
            student_age: updates.age,
            updated_at: new Date().toISOString(),
          })
          .eq("userID", user.id)
          .select()
          .single();

        if (studentError) throw studentError;

        // Combine the updated data
        const updatedProfile = {
          ...userProfile,
          ...userData,
          ...studentData,
        };

        // Update the context state
        setUserProfile(updatedProfile);

        return updatedProfile;
      } catch (error) {
        console.error("Error updating profile:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    // Upload profile image
    uploadProfileImage: async (file) => {
      try {
        const fileName = `${user.id}-${Date.now()}.webp`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("profile-picture")
          .upload(fileName, file, {
            upsert: true, // Overwrite if file already exists
          });
        if (uploadError) throw uploadError;

        // Update database with filename only
        const { error: updateError } = await supabase
          .from("user")
          .update({ user_image: fileName })
          .eq("userID", user.id);

        if (updateError) throw updateError;

        return fileName;
      } catch (error) {
        console.error("Error uploading image:", error);
        throw error;
      }
    },

    // Upload feedback
    uploadFeedback: async (feedback) => {
      try {
        // Get user data
        const { data: userData, error: userError } = await supabase
          .from("user")
          .select(`*`)
          .eq("userID", user.id)
          .single();

        if (userError) throw userError;

        // Insert feedback
        const { data, error } = await supabase
          .from("feedback")
          .insert([
            {
              feedback_title: feedback.title,
              feedback_category: feedback.category,
              feedback_rating: feedback.rating,
              feedback_message: feedback.message,
              feedback_by: userData.user_name,
              user_Id: user.id,
            },
          ])
          .select();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error uploading feedback:", error);
        throw error;
      }
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
