import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const getUserProfile = async () => {
    try {
      // 1. Get auth user (client-side)
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) return null;

      // 2. Get profile data via edge function
      const { data, error } = await supabase.functions.invoke(
        "get-user-profile",
        {
          body: { user_id: authUser.id },
        }
      );

      if (error || !data) {
        console.error("Profile not found via edge function");
        return null;
      }

      // 3. Combine data
      const completeUser = {
        ...authUser,
        ...data.userData,
        ...data.roleData,
      };

      // 4. Update state
      setUser(completeUser);
      setUserProfile({
        ...data.userData,
        ...data.roleData,
      });

      return completeUser;
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
      return null;
    }
  };

  const initializeAuth = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await getUserProfile();
        if (!profile) await supabase.auth.signOut();
      } else {
        setUser(null);
        setUserProfile(null);
      }
    } catch (error) {
      console.error("Auth init error:", error);
      setUser(null);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) initializeAuth();
    }, 100); //small delay to prevent race condition

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        getUserProfile();
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

  const signIn = async (email, password) => {
    setLoading(true);
    try {
      // 1. Authenticate
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        if (authError.message === "Email not confirmed") {
          return {
            error: {
              message: "Please verify your email first.",
              needsVerification: true,
              email,
            },
          };
        }
        throw authError;
      }

      // 2. Get profile via edge function
      const profile = await getUserProfile();

      return {
        data: authData,
        profile,
      };
    } catch (error) {
      console.error("Sign in error:", error);
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
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + "/update-password",
      });
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Resend error:", error);
      return { error: error.message };
    }
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
      console.error("Register error:", error);
      throw error;
    }
  };

  const resendVerification = async (email) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "resend-verification",
        {
          body: {
            email,
            redirectTo: window.location.origin + "/login",
          },
        }
      );

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Resend Verification error:", error);
      return { error: error.message };
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
      const id = user.userID;

      const { data, error } = await supabase.functions.invoke(
        "update-profile",
        {
          body: { updates, id },
        }
      );
      if (error) throw error;

      // Update local state
      const updatedProfile = {
        ...userProfile,
        ...data,
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
      const id = user.userID;
      const fileName = `${id}-${Date.now()}.webp`;

      // Convert to WebP if needed
      let processedFile = file;
      if (file.type !== "image/webp") {
        processedFile = await convertToWebP(file);
      }

      const formData = new FormData();
      formData.append("file", processedFile);
      formData.append("userId", id);
      formData.append("fileName", fileName);

      const { data, error } = await supabase.functions.invoke("upload-image", {
        body: formData,
      });

      if (error) throw error;
      if (!data?.data?.fileName) {
        throw new Error("Invalid response structure");
      }

      return {
        fileName: data.data.fileName,
        imageUrl: data.data.imageUrl,
      };
    } catch (error) {
      console.error("Upload error details:", {
        message: error.message,
        response: error.response?.data,
        stack: error.stack,
      });
      throw error;
    }
  };
  // Helper function to convert image to WebP
  const convertToWebP = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            (blob) => {
              resolve(new File([blob], file.name, { type: "image/webp" }));
            },
            "image/webp",
            0.8
          ); // 0.8 is quality (0-1)
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const uploadFeedback = async (feedback) => {
    try {
      const studentid = userProfile.studentid;
      const name = user.user_name;
      // Insert feedback
      const { data, error } = await supabase.functions.invoke(
        "upload-feedback",
        {
          body: {
            feedback,
            studentid,
            name,
          },
        }
      );

      if (!error && data) {
        await logActivity(
          "Submitted",
          "feedback",
          data.feedbackId,
          data.feedbackName
        );
      }

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error uploading feedback:", error);
      throw error;
    }
  };

  const getChatSessions = async () => {
    try {
      if (!userProfile?.studentid) return [];
      const studentid = userProfile.studentid;
      const { data, error } = await supabase.functions.invoke(
        "get-chat-session",
        {
          body: {
            studentid,
          },
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching chat sessions:", error);
      return [];
    }
  };

  const getChatMessages = async (chatId) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "get-chat-messages",
        {
          body: {
            chatId,
          },
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      return [];
    }
  };

  const createChatSession = async () => {
    try {
      // Get studentid from userProfile
      if (!userProfile?.studentid) {
        throw new Error("Student profile not loaded");
      }

      const { data, error } = await supabase.functions.invoke(
        "create-chat-session",
        {
          body: {
            studentid: userProfile.studentid,
          },
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error creating chat session:", error);
      throw error;
    }
  };

  const saveMessage = async (chatId, message, sender) => {
    try {
      const { data, error } = await supabase.functions.invoke("save-message", {
        body: { chatId, message, sender },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving message:", error);
      throw error;
    }
  };

  const updateChatName = async (chatId, newName) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "update-chat-name",
        {
          body: { chatId, newName },
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error updating chat name:", error);
      throw error;
    }
  };

  const deleteChatSession = async (chatId) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "delete-chat-session",
        {
          body: { chatId },
        }
      );

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting chat session:", error);
      throw error;
    }
  };

  const endChatSession = async (chatId) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "end-chat-session",
        {
          body: { chatId },
        }
      );

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error ending chat session:", error);
      throw error;
    }
  };

  // Admin
  const completeProfile = async (data) => {
    try {
      setLoading(true);
      const id = user.userID;
      const { error } = await supabase.functions.invoke("complete-profile", {
        body: { data, id },
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error completing profile:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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

  const inviteAdmin = async (email) => {
    const inviterId = user.id;
    try {
      const { data, error } = await supabase.functions.invoke("invite-admin", {
        body: { email, inviterId },
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

      if (!error && data) {
        await logActivity("Deleted", "student", data.userId, data.userName);
      }

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

      if (!error && data) {
        await logActivity(
          "Deleted",
          "feedback",
          data.feedbackId,
          data.feedbackName
        );
      }

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

  const addResource = async (resourceData) => {
    try {
      const { data: resource, error } = await supabase.functions.invoke(
        "add-resource",
        {
          body: { resourceData },
        }
      );

      if (!error && resource) {
        await logActivity(
          "Added",
          "resource",
          resource.resourceId,
          resource.resourceName
        );
      }

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error adding resource:", error);
      throw error;
    }
  };

  const updateResource = async (resourceId, updatedData) => {
    try {
      const { data: resource, error } = await supabase.functions.invoke(
        "update-resource",
        {
          body: { resourceId, updatedData },
        }
      );

      if (!error && resource) {
        await logActivity(
          "Updated",
          "resource",
          resource.resourceId,
          resource.resourceName
        );
      }

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error updating resource:", error);
      throw error;
    }
  };

  const deleteResource = async (resourceId) => {
    try {
      const { data: resource, error } = await supabase.functions.invoke(
        "delete-resource",
        {
          body: { resourceId },
        }
      );

      if (!error && resource) {
        await logActivity(
          "Deleted",
          "resource",
          resource.resourceId,
          resource.resourceName
        );
      }

      if (error) throw error;
      return true;
    } catch (error) {
      console.error("Error deleting resource:", error);
      throw error;
    }
  };

  const logActivity = async (actionType, entityType, entityId, entityName) => {
    const role = user.role;
    const userID = user.userID;
    const id = user.id;

    try {
      const { data, error } = await supabase.functions.invoke("log-activity", {
        body: {
          actionType,
          entityType,
          entityId,
          entityName,
          role,
          userID,
          id,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  };

  const getRecentActivities = async (limit = 5) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "get-activities",
        {
          body: { limit },
        }
      );

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching resource:", error);
      throw error;
    }
  };

  const fetchInvitations = async (
    page = 1,
    sortField = "sent_at",
    sortOrder = "desc"
  ) => {
    const itemsPerPage = 10;
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;

    const { data, error } = await supabase.functions.invoke("get-invitations", {
      body: { sortField, sortOrder, from, to },
    });

    if (error) throw error;
    return {
      invitations: data.invitations,
      totalCount: data.totalCount,
    };
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
    completeProfile, // Complete Profile for new User
    getDashboardStats, //For admin Dasboard
    getRecentActivities, // Get the recent activities for admin
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
    fetchInvitations, // Fetch invitations
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
