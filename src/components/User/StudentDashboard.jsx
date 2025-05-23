import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import Header from '../Common/Header';
import LoadingModal from '../Common/LoadingModal';
import { 
  FaComments, 
  FaChartLine, 
  FaBook, 
  FaUserGraduate,
  FaCalendarAlt,
  FaBell,
  FaSearch
} from 'react-icons/fa';
import styles from './StudentDashboard.module.css';

const StudentDashboard = () => {
  const { userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [performanceData, setPerformanceData] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Simulate data loading
    const fetchData = async () => {
      try {
        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setNotifications([
          { id: 1, message: 'New feedback response from your counselor', time: '2 hours ago', read: false },
          { id: 2, message: 'Upcoming session reminder: Tomorrow at 3 PM', time: '1 day ago', read: true },
          { id: 3, message: 'New mental health resource available', time: '3 days ago', read: true }
        ]);

        setUpcomingSessions([
          { id: 1, title: 'Weekly Check-in', date: '2023-06-15', time: '3:00 PM', counselor: 'Dr. Smith' },
          { id: 2, title: 'Progress Review', date: '2023-06-20', time: '10:30 AM', counselor: 'Dr. Johnson' }
        ]);

        setRecentActivities([
          { id: 1, type: 'chat', content: 'Conversation with counselor', time: '2 hours ago' },
          { id: 2, type: 'resource', content: 'Viewed stress management guide', time: '1 day ago' },
          { id: 3, type: 'feedback', content: 'Submitted session feedback', time: '2 days ago' }
        ]);

        setPerformanceData({
          moodTrend: [65, 59, 80, 81, 56, 55, 40],
          engagement: [70, 45, 60, 75, 65, 80, 90],
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        });

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading || !userProfile) {
    return <LoadingModal message="Loading your dashboard..." />;
  }

  const handleNotificationClick = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? {...n, read: true} : n
    ));
  };

  const filteredActivities = recentActivities.filter(activity =>
    activity.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header />
      <div className={styles.dashboard}>
        <div className={styles.sidebar}>
          <div className={styles.profileSummary}>
            <div className={styles.avatar}>
              {userProfile.user_name.charAt(0).toUpperCase()}
            </div>
            <div className={styles.profileInfo}>
              <h3>{userProfile.user_name}</h3>
              <p>Student</p>
            </div>
          </div>

          <nav className={styles.navMenu}>
            <button 
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <FaChartLine className={styles.navIcon} />
              Overview
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'chat' ? styles.active : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <FaComments className={styles.navIcon} />
              Chat Sessions
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'resources' ? styles.active : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              <FaBook className={styles.navIcon} />
              Resources
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <FaUserGraduate className={styles.navIcon} />
              My Profile
            </button>
          </nav>

          <div className={styles.upcomingSessions}>
            <h4><FaCalendarAlt className={styles.sectionIcon} /> Upcoming</h4>
            {upcomingSessions.map(session => (
              <div key={session.id} className={styles.sessionCard}>
                <div className={styles.sessionDate}>
                  <span className={styles.sessionDay}>
                    {new Date(session.date).toLocaleDateString('en-US', { day: 'numeric' })}
                  </span>
                  <span className={styles.sessionMonth}>
                    {new Date(session.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                </div>
                <div className={styles.sessionInfo}>
                  <h5>{session.title}</h5>
                  <p>{session.time} with {session.counselor}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.topBar}>
            <h2>
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'chat' && 'Chat Sessions'}
              {activeTab === 'resources' && 'Resources'}
              {activeTab === 'profile' && 'My Profile'}
            </h2>
            <div className={styles.searchBar}>
              <FaSearch className={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className={styles.overviewGrid}>
              <div className={`${styles.card} ${styles.welcomeCard}`}>
                <h3>Welcome back, {userProfile.user_name.split(' ')[0]}!</h3>
                <p>How are you feeling today?</p>
                <div className={styles.moodSelector}>
                  {['😢', '😞', '😐', '🙂', '😁'].map((emoji, index) => (
                    <button key={index} className={styles.moodOption}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${styles.card} ${styles.performanceCard}`}>
                <h3>Your Weekly Mood Trend</h3>
                <div className={styles.chartContainer}>
                  {/* In a real app, you would use a charting library like Chart.js here */}
                  <div className={styles.chartPlaceholder}>
                    {performanceData.moodTrend.map((value, index) => (
                      <div 
                        key={index} 
                        className={styles.chartBar} 
                        style={{ height: `${value}%` }}
                        title={`${performanceData.labels[index]}: ${value}`}
                      ></div>
                    ))}
                  </div>
                  <div className={styles.chartLabels}>
                    {performanceData.labels.map((label, index) => (
                      <span key={index}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`${styles.card} ${styles.notificationsCard}`}>
                <div className={styles.cardHeader}>
                  <h3><FaBell className={styles.sectionIcon} /> Notifications</h3>
                  <span className={styles.badge}>{notifications.filter(n => !n.read).length}</span>
                </div>
                <ul className={styles.notificationsList}>
                  {notifications.map(notification => (
                    <li 
                      key={notification.id} 
                      className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <p>{notification.message}</p>
                      <span className={styles.notificationTime}>{notification.time}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={`${styles.card} ${styles.activityCard}`}>
                <h3>Recent Activity</h3>
                {filteredActivities.length > 0 ? (
                  <ul className={styles.activityList}>
                    {filteredActivities.map(activity => (
                      <li key={activity.id} className={styles.activityItem}>
                        <div className={styles.activityIcon}>
                          {activity.type === 'chat' && <FaComments />}
                          {activity.type === 'resource' && <FaBook />}
                          {activity.type === 'feedback' && <FaChartLine />}
                        </div>
                        <div className={styles.activityContent}>
                          <p>{activity.content}</p>
                          <span className={styles.activityTime}>{activity.time}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.noResults}>No activities found matching your search.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className={styles.chatTab}>
              <div className={styles.chatList}>
                {/* Chat list would go here */}
                <p className={styles.comingSoon}>Chat feature coming soon!</p>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className={styles.resourcesTab}>
              {/* Resources would go here */}
              <p className={styles.comingSoon}>Resources feature coming soon!</p>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className={styles.profileTab}>
              {/* Profile would go here */}
              <p className={styles.comingSoon}>Profile management coming soon!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;