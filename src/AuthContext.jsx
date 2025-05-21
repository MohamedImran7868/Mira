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
      console.log("User: ", completeUser);

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

  // Helper function to format category display
  function formatCategoryDisplay(category) {
    const categoryMap = {
      general: "General Feedback",
      bug: "Bug Report",
      feature: "Feature Request",
      improvement: "Improvement Suggestion",
      response: "Chatbot Response",
    };
    return categoryMap[category] || category;
  }

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
      await supabase.functions.invoke("register-student", {
        body: { email, password, studentData },
      });
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
          throw new Error(error.message);
        }
        return { success: true };
      } catch (error) {
        console.error("Resend error:", error);
        return { error: error.message };
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

    // Get Chat message
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

    // Get Chat session
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

    // Save message
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

    // Updated the chat name
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

    // Delete the Chat
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

    // End the chat session to count interval
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

    // Admin
    // Search students
    getStudents: async (page = 1, searchTerm = "") => {
      const itemsPerPage = 15;
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      try {
        let query = supabase
          .from("user")
          .select(
            `
          userID,
          user_name,
          user_email,
          students:students(status)
        `,
            { count: "exact" }
          ) // Get total count
          .eq("role", "student")
          .order("created_at", { ascending: false })
          .range(from, to);

        if (searchTerm) {
          query = query.or(
            `user_name.ilike.%${searchTerm}%,user_email.ilike.%${searchTerm}%`
          );
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return {
          students: data || [],
          totalCount: count || 0,
          totalPages: Math.ceil(count / itemsPerPage) || 1,
        };
      } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
    },

    // Delete student account
    deleteStudent: async (userId) => {
      try {
        const { error } = await supabase.rpc("delete_auth_user", {
          user_id: userId,
        });
        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Error deleting student:", error);
        throw error;
      }
    },

    getFeedback: async (
      page = 1,
      filters = {},
      sortField = "timestamp",
      sortOrder = "desc",
      searchQuery = ""
    ) => {
      const itemsPerPage = 15;
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      try {
        let query = supabase
          .from("feedback")
          .select(
            `
        feedback_id,
        feedback_title,
        feedback_message,
        feedback_rating,
        feedback_category,
        feedback_by,
        timestamp,
        created_at,
        user:students(
          user:user(user_name)
        )
      `,
            { count: "exact" }
          )
          .range(from, to);

        // Apply filters
        if (filters.category) {
          query = query.eq("feedback_category", filters.category);
        }
        if (filters.rating) {
          query = query.eq("feedback_rating", filters.rating);
        }
        if (filters.startDate && filters.endDate) {
          query = query
            .gte("timestamp", filters.startDate)
            .lte("timestamp", filters.endDate);
        }

        // Apply search - exact match when searching for user
        if (searchQuery) {
          query = query.ilike("feedback_by", `%${searchQuery}%`);
        }

        // Apply sorting
        if (sortField === "feedback_category") {
          query = query.order("feedback_category", {
            ascending: sortOrder === "asc",
          });
        } else if (sortField === "feedback_rating") {
          query = query.order("feedback_rating", {
            ascending: sortOrder === "asc",
          });
        } else if (sortField === "timestamp") {
          query = query.order("timestamp", {
            ascending: sortOrder === "asc",
          });
        } else {
          query = query.order(sortField, { ascending: sortOrder === "asc" });
        }

        const { data, error, count } = await query;

        if (error) throw error;

        // Format category display names
        const formattedData =
          data?.map((item) => ({
            ...item,
            displayCategory: formatCategoryDisplay(item.feedback_category),
          })) || [];

        return {
          feedback: formattedData,
          totalCount: count || 0,
          totalPages: Math.ceil(count / itemsPerPage) || 1,
        };
      } catch (error) {
        console.error("Error fetching feedback:", error);
        throw error;
      }
    },

    // Delete feedback
    deleteFeedback: async (feedbackId) => {
      try {
        const { error } = await supabase
          .from("feedback")
          .delete()
          .eq("feedback_id", feedbackId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Error deleting feedback:", error);
        throw error;
      }
    },

    // Get Resources
    getResources: async (page = 1, type = undefined, searchQuery = "") => {
      const itemsPerPage = 4;
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      try {
        let query = supabase
          .from("resources")
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .range(from, to);

        if (type) {
          query = query.eq("resource_type", type);
        }

        if (searchQuery) {
          query = query.ilike("resource_name", `%${searchQuery}%`);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        return {
          data: data || [],
          totalPages: Math.ceil(count / itemsPerPage) || 1,
        };
      } catch (error) {
        console.error("Error fetching resources:", error);
        throw error;
      }
    },

    // Get single resource by ID
    getResourceById: async (resourceId) => {
      try {
        const { data, error } = await supabase
          .from("resources")
          .select("*")
          .eq("resourceid", resourceId)
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching resource:", error);
        throw error;
      }
    },

    // Add new resource
    addResource: async (resourceData) => {
      try {
        const { error } = await supabase
          .from("resources")
          .insert([resourceData]);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Error adding resource:", error);
        throw error;
      }
    },

    // Update resource
    updateResource: async (resourceId, updatedData) => {
      try {
        const { error } = await supabase
          .from("resources")
          .update(updatedData)
          .eq("resourceid", resourceId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Error updating resource:", error);
        throw error;
      }
    },

    // Delete resource
    deleteResource: async (resourceId) => {
      try {
        const { error } = await supabase
          .from("resources")
          .delete()
          .eq("resourceid", resourceId);

        if (error) throw error;
        return true;
      } catch (error) {
        console.error("Error deleting resource:", error);
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
