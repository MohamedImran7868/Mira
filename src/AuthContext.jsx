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
        error: authError,
      } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser) return null;

      // Fetch from user table with timeout
      const { data: userData, error } = await supabase
        .from("user")
        .select("*")
        .eq("userID", authUser.id)
        .maybeSingle(); // Use maybeSingle instead of single

      if (error || !userData) {
        console.error("Profile not found");
        return null;
      }

      // Combine auth user with custom user data
      const completeUser = {
        ...authUser,
        ...userData,
      };

      setUser(completeUser);
      setUserProfile(userData);

      // Fetch role data only if needed
      if (userData.role === "student") {
        const { data: studentData } = await supabase
          .from("students")
          .select("*")
          .eq("userID", authUser.id)
          .maybeSingle();
        setUserProfile((prev) => ({ ...prev, ...studentData }));
      } else if (userData.role === "admin") {
        const { data: adminData } = await supabase
          .from("admin")
          .select("*")
          .eq("userID", authUser.id)
          .maybeSingle();
        setUserProfile((prev) => ({ ...prev, ...adminData }));
      }

      return completeUser;
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // First check local session to avoid flash
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          await getUserProfile(session.user);
        } else {
          setUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Auth init error:", error);
        if (isMounted) {
          setUser(null);
          setUserProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Add small delay to allow session restoration
    const timer = setTimeout(() => {
      initializeAuth();
    }, 100); // 100ms delay helps prevent race conditions

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        getUserProfile(session.user);
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    userProfile,
    isLoading: loading,

    signIn: async (email, password) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        const profile = await getUserProfile();
        return { data, profile };
      } catch (error) {
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
      } finally {
        setLoading(false);
      }
    },

    registerStudent: async (email, password, studentData) => {
      setLoading(true);
      try {
        // 1. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: {
                full_name: studentData.name,
                role: "student",
              },
              emailRedirectTo: `${window.location.origin}/login`,
            },
          }
        );
        if (authError) throw authError;

        // 2. Create user record
        const { error: userError } = await supabase.from("user").insert([
          {
            userID: authData.user.id,
            user_name: studentData.name,
            user_email: email,
            role: "student",
          },
        ]);
        if (userError) throw userError;

        // 3. Create student record
        const { error: studentError } = await supabase.from("students").insert([
          {
            userID: authData.user.id,
            student_birthday: studentData.birthday,
            student_age: studentData.age,
            status: "active",
          },
        ]);
        if (studentError) throw studentError;

        return authData;
      } catch (error) {
        console.error("Registration error:", error);
        throw error;
      } finally {
        setLoading(false);
      }
    },

    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        console.error("Sign out error:", error);
        throw error;
      }
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
      // Update Auth table
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      // Update user table password
      const { data: userData, error: userError } = await supabase
        .from("user")
        .update({
          user_password: newPassword,
        })
        .eq("userID", user.id)
        .select()
        .single();

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
        // Insert feedback
        const { data, error } = await supabase
          .from("feedback")
          .insert([
            {
              feedback_title: feedback.title,
              feedback_category: feedback.category,
              feedback_rating: feedback.rating,
              feedback_message: feedback.message,
              feedback_by: user.user_name,
              user_Id: userProfile?.studentid,
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

    // Chat-related functions
    getChatSessions: async () => {
      try {
        if (!userProfile?.studentid) return [];

        const { data, error } = await supabase
          .from("chatsession")
          .select("*")
          .eq("studentid", userProfile.studentid)
          .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching chat sessions:", error);
        return [];
      }
    },

    getChatMessages: async (chatId) => {
      try {
        const { data, error } = await supabase
          .from("message")
          .select("*")
          .eq("chatid", chatId)
          .order("message_timestamp", { ascending: true });

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching chat messages:", error);
        return [];
      }
    },

    createChatSession: async () => {
      try {
        if (!userProfile?.studentid) throw new Error("User not authenticated");

        const { data, error } = await supabase
          .from("chatsession")
          .insert([{ studentid: userProfile.studentid }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error creating chat session:", error);
        throw error;
      }
    },

    saveMessage: async (chatId, message, sender) => {
      try {
        const { data, error } = await supabase
          .from("message")
          .insert([
            {
              chatid: chatId,
              message_content: message,
              sender: sender,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error saving message:", error);
        throw error;
      }
    },

    updateChatName: async (chatId, newName) => {
      try {
        const { data, error } = await supabase
          .from("chatsession")
          .update({ chat_name: newName })
          .eq("chatid", chatId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error updating chat name:", error);
        throw error;
      }
    },

    deleteChatSession: async (chatId) => {
      try {
        // Messages will be automatically deleted due to CASCADE
        const { error } = await supabase
          .from("chatsession")
          .delete()
          .eq("chatid", chatId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Error deleting chat session:", error);
        throw error;
      }
    },

    endChatSession: async (chatId) => {
      try {
        const { data, error } = await supabase
          .from("chatsession")
          .update({ end_date: new Date().toISOString() })
          .eq("chatid", chatId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error ending chat session:", error);
        throw error;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

/* Sample User ID


*/
