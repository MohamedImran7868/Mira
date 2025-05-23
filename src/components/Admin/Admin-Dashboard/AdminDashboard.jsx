import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../AuthContext";
import Header from "../../Common/Header";
import styles from "./AdminDashboard.module.css";
import {
  FaUsers,
  FaCommentAlt,
  FaBook,
  FaChartLine,
  FaCalendarAlt,
  FaCog,
} from "react-icons/fa";
import { MdOutlineAdminPanelSettings } from "react-icons/md";

function AdminDashboard() {
  const navigate = useNavigate();
  const { getDashboardStats, updateStatsManually } = useAuth();
  const [dashboardStats, setDashboardStats] = useState([]);
  const [loading, setLoading] = useState(true);

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

  // Recent activities sample data
  const recentActivities = [
    {
      id: 1,
      action: "New feedback submitted",
      time: "5 mins ago",
      icon: <FaCommentAlt />,
    },
    {
      id: 2,
      action: "User account created",
      time: "25 mins ago",
      icon: <FaUsers />,
    },
    { id: 3, action: "Resource updated", time: "1 hour ago", icon: <FaBook /> },
    {
      id: 4,
      action: "System maintenance",
      time: "2 hours ago",
      icon: <FaCog />,
    },
  ];

  if (loading) {
    return <div>Loading dashboard...</div>;
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
            <span>Administrator</span>
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
            </div>
          </div>

          <div className={styles.recentActivity}>
            <h2>
              <FaCalendarAlt className={styles.sectionIcon} />
              Recent Activity (Sample)
            </h2>
            <div className={styles.activityList}>
              {recentActivities.map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={styles.activityIcon}>{activity.icon}</div>
                  <div className={styles.activityDetails}>
                    <p>{activity.action}</p>
                    <span>{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default AdminDashboard;