import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import useActivitiesSubscription from "../../../realtime/activities";

// Components
import Header from "../../Common/Header";
import AdminDashboardSkeleton from "./AdminDashboardSkeleton";
import styles from "./AdminDashboard.module.css";

// Icons
import {
  FaUsers,
  FaCommentAlt,
  FaBook,
  FaChartLine,
  FaCalendarAlt,
  FaCog,
  FaRegCalendarTimes,
  FaTrash,
  FaEdit,
  FaUserPlus,
  FaUserTimes,
  FaCommentSlash,
} from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";

function AdminDashboard() {
  const navigate = useNavigate();
  const { getDashboardStats, getRecentActivities, user } = useAuth();
  const [dashboardStats, setDashboardStats] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchactivities, setFetchactivities] = useState(true);

  // Fetch stats when component mounts
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await getDashboardStats();
        setDashboardStats(stats);
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Fallback to sample data
        setDashboardStats([
          { title: "Total Users", value: 248, change: "+12%", trend: "up" },
          { title: "New Feedback", value: 32, change: "+5%", trend: "up" },
          { title: "Resources", value: 18, change: "+2", trend: "up" },
          { title: "Students", value: 56, change: "-3%", trend: "down" },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [getDashboardStats]);

  // Helper: Format time ago
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Helper: Get activity icon
  const getActivityIcon = (entityType, actionType) => {
    switch (entityType) {
      case "resource":
        if (actionType === "Deleted") return <FaTrash />;
        if (actionType === "Updated") return <FaEdit />;
        return <FaBook />;
      case "student":
        if (actionType === "Registered") return <FaUserPlus />;
        return <FaUserTimes />;
      case "feedback":
        if (actionType === "Submitted") return <FaCommentAlt />;
        return <FaCommentSlash />;
      default:
        return <FaCog />;
    }
  };

  // Fetch recent activities
  const fetchActivities = async () => {
    try {
      setFetchactivities(true);
      const activities = await getRecentActivities(5); // Get last 5 activities
      setRecentActivities(
        activities.map((activity) => ({
          id: activity.id,
          action: activity.message,
          time: formatTimeAgo(activity.created_at),
          icon: getActivityIcon(activity.entity_type, activity.action_type),
        }))
      );
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setFetchactivities(false);
    }
  };

  // Subscribe to real-time updates for activities
  useActivitiesSubscription(fetchActivities);

  // Fetch activities when component mounts or when getRecentActivities changes
  useEffect(() => {
    fetchActivities();
  }, [getRecentActivities]);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.welcomeSection}>
            <h1>Admin Dashboard</h1>
            <p>
              Welcome back! Here's what's happening with your platform today.
            </p>
          </div>
          <div className={styles.adminBadge}>
            <MdOutlineAdminPanelSettings className={styles.adminIcon} />
            <span>
              {user?.super_admin === "yes"
                ? "Super Administrator"
                : "Administrator"}
            </span>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {dashboardStats.map((stat, index) => (
            <div key={index} className={styles.statCard}>
              <h3>{stat.title}</h3>
              <div className={styles.statValue}>{stat.value}</div>
              <div className={`${styles.statChange} ${styles[stat.trend]}`}>
                {stat.change}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.mainContent}>
          <div className={styles.quickActions}>
            <h2>
              <FaChartLine className={styles.sectionIcon} />
              Quick Actions
            </h2>
            <div className={styles.actionButtons}>
              <button
                className={styles.actionButton}
                onClick={() => navigate("/manage-user")}
              >
                <FaUsers className={styles.buttonIcon} />
                Manage Users
              </button>
              <button
                className={styles.actionButton}
                onClick={() => navigate("/view-feedback")}
              >
                <FaCommentAlt className={styles.buttonIcon} />
                View Feedback
              </button>
              <button
                className={styles.actionButton}
                onClick={() => navigate("/view-resources")}
              >
                <FaBook className={styles.buttonIcon} />
                Manage Resources
              </button>
              {user?.super_admin === "yes" && (
                <button
                  className={styles.actionButton}
                  onClick={() => navigate("/invite-admin")}
                >
                  <FaUserPlus className={styles.buttonIcon} />
                  Invite Admin
                </button>
              )}
            </div>
          </div>

          <div className={styles.recentActivity}>
            <h2>
              <FaCalendarAlt className={styles.sectionIcon} />
              Recent Activity
            </h2>
            <div className={styles.activityList}>
              {recentActivities.length > 0 ? (
                recentActivities.map((activity) => (
                  <div key={activity.id} className={styles.activityItem}>
                    <div className={styles.activityIcon}>{activity.icon}</div>
                    <div className={styles.activityDetails}>
                      <p>{activity.action}</p>
                      <span>{activity.time}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.noActivities}>
                  {fetchactivities ? (
                    <p>Fetching recent activities...</p>
                  ) : (
                    <>
                      <FaRegCalendarTimes className={styles.noActivityIcon} />
                      <p>No recent activities</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default AdminDashboard;
