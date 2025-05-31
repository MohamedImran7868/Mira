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
        .maybeSingle();

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

  // Global
  const signIn = async (email, password) => {
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
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/update-password",
    });
    if (error) throw error;
    return data;
  };

  //Student
  const registerStudent = async (email, password, studentData) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "register-student",
        {
          body: { email, password, studentData },
        }
      );
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  };

  const resendVerification = async (email) => {
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
  };

  const updatePassword = async (newPassword) => {
    // Update Auth table
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  const getImageUrl = (path) => {
    return `${supabase.supabaseUrl}/storage/v1/object/public/profile-picture/${path}`;
  };

  const updateProfile = async (updates) => {
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
          id: updates.id,
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
  };

  const uploadProfileImage = async (file) => {
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
  };

  const uploadFeedback = async (feedback) => {
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
  };

  const getChatSessions = async () => {
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
  };

  const getChatMessages = async (chatId) => {
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
  };

  const createChatSession = async () => {
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
  };

  const saveMessage = async (chatId, message, sender) => {
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
  };

  const updateChatName = async (chatId, newName) => {
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
  };

  const deleteChatSession = async (chatId) => {
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
  };

  const endChatSession = async (chatId) => {
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
  };

  // Admin
  const getDashboardStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "get-dashboard-stats",
        {
          method: "GET",
        }
      );

      if (error) throw error;
      return (
        data || [
          { title: "Total Users", value: 0, change: "+0%", trend: "neutral" },
          { title: "New Feedback", value: 0, change: "+0%", trend: "neutral" },
          { title: "Resources", value: 0, change: "+0", trend: "neutral" },
          { title: "Students", value: 0, change: "+0%", trend: "neutral" },
        ]
      );
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      return [
        { title: "Total Users", value: 0, change: "+0%", trend: "neutral" },
        { title: "New Feedback", value: 0, change: "+0%", trend: "neutral" },
        { title: "Resources", value: 0, change: "+0", trend: "neutral" },
        { title: "Students", value: 0, change: "+0%", trend: "neutral" },
      ];
    }
  };

  const updateStatsManually = async () => {
    try {
      // Update the statistics
      const { data, error } = await supabase.rpc("update_daily_statistics");
      if (error) throw error;

      // Return fresh stats after update
      const stats = await getDashboardStats();
      return stats;
    } catch (error) {
      console.error("Error updating stats:", error);
      throw error;
    }
  };

  const inviteAdmin = async (email) => {
    try {
      const { data, error } = await supabase.functions.invoke("invite-admin", {
        body: { email },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error inviting admin:", error);
      return { error: error.message };
    }
  };

  const getStudents = async (page = 1, searchTerm = "") => {
    try {
      const { data, error } = await supabase.functions.invoke("get-students", {
        body: { page, searchTerm },
      });

      if (error) throw error;
      return data || { students: [], totalCount: 0, totalPages: 1 };
    } catch (error) {
      console.error("Error fetching students:", error);
      return { students: [], totalCount: 0, totalPages: 1 };
    }
  };

  const deleteStudent = async (userId) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-students",
        {
          body: { userId },
        }
      );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting student:", error);
      throw error;
    }
  };

  const getFeedback = async (
    page = 1,
    filters = {},
    sortField = "timestamp",
    sortOrder = "desc",
    searchQuery = ""
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke("get-feedbacks", {
        body: {
          page,
          filters,
          sortField,
          sortOrder,
          searchQuery,
        },
      });

      if (error) throw error;
      return (
        data || {
          feedback: [],
          totalCount: 0,
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return {
        feedback: [],
        totalCount: 0,
        totalPages: 1,
      };
    }
  };

  const deleteFeedback = async (feedbackId) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-feedback",
        {
          body: { feedbackId },
        }
      );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting feedback:", error);
      throw error;
    }
  };

  const getResources = async (page = 1, type = undefined, searchQuery = "") => {
    const itemsPerPage = 9;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    try {
      const { data, error } = await supabase.functions.invoke("get-resources", {
        body: {
          page,
          type,
          searchQuery,
        },
      });

      if (error) throw error;
      return (
        data || {
          data: [],
          totalPages: 1,
        }
      );
    } catch (error) {
      console.error("Error fetching resources:", error);
      throw error;
    }
  };

  const getResourceById = async (resourceId) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "get-resourcebyid",
        {
          body: { resourceId },
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching resource:", error);
      throw error;
    }
  };

  const updateResource = async (resourceId, updatedData) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "update-resource",
        {
          body: { resourceId, updatedData },
        }
      );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating resource:", error);
      throw error;
    }
  };

  const addResource = async (resourceData) => {
    try {
      const { data, error } = await supabase.functions.invoke("add-resource", {
        body: { resourceData },
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error adding resource:", error);
      throw error;
    }
  };

  const deleteResource = async (resourceId) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-resource",
        {
          body: { resourceId },
        }
      );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting resource:", error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    userProfile,
    isLoading: loading,

    // Global
    signIn, // Sign In
    signOut, // Sign Out
    resetPassword, // Reset Password

    //Student
    registerStudent, // Register Student
    resendVerification, // Resend verification email
    updatePassword, // Update password
    getImageUrl, // Generate the public path for the image
    updateProfile, // Update user profile
    uploadProfileImage, // Upload profile image
    uploadFeedback, // Upload feedback
    getChatSessions, // Chat-related functions
    getChatMessages, // Get Chat message
    createChatSession, // Get Chat session
    saveMessage, // Save message
    updateChatName, // Updated the chat name
    deleteChatSession, // Delete the Chat
    endChatSession, // End the chat session to count interval

    // Admin
    getDashboardStats, //For admin Dasboard
    updateStatsManually, // Function to manually trigger stats update (for testing) - Put a button in ViewFeedback and call this
    inviteAdmin, //Invite New Admin
    getStudents, // Search students
    deleteStudent, // Delete student account
    getFeedback, // Get all Feedback
    deleteFeedback, // Delete feedback
    getResources, // Get Resources
    getResourceById, // Get single resource by ID
    addResource, // Add new resource
    updateResource, // Update resource
    deleteResource, // Delete resource
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
