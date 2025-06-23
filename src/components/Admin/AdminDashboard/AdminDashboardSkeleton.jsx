import styles from "./AdminDashboard.module.css";
import Header from "../../Common/Header";

const AdminDashboardSkeleton = () => (
  <>
    <Header />
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.welcomeSection}>
          <div
            className="skeleton"
            style={{
              width: 200,
              height: 32,
              borderRadius: 8,
              marginBottom: 8,
            }}
          />
          <div
            className="skeleton"
            style={{
              width: 300,
              height: 16,
              borderRadius: 8,
            }}
          />
        </div>
        <div
          className={`${styles.adminBadge} skeleton`}
          style={{ width: 150, height: 32, borderRadius: 16 }}
        />
      </div>
      <div className={styles.statsGrid}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={styles.statCard}>
            <div
              className="skeleton"
              style={{
                width: 80,
                height: 16,
                borderRadius: 8,
                margin: "0 auto 12px",
              }}
            />
            <div
              className="skeleton"
              style={{
                width: 60,
                height: 32,
                borderRadius: 8,
                margin: "0 auto 12px",
              }}
            />
            <div
              className="skeleton"
              style={{
                width: 40,
                height: 16,
                borderRadius: 8,
                margin: "0 auto",
              }}
            />
          </div>
        ))}
      </div>
      <div className={styles.mainContent}>
        <div className={styles.quickActions}>
          <div
            className="skeleton"
            style={{
              width: 180,
              height: 24,
              borderRadius: 8,
              marginBottom: 24,
            }}
          />
          <div className={styles.actionButtons}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`${styles.actionButton} skeleton`}
                style={{ background: "#f3f3f3", color: "#ccc" }}
              >
                <div
                  className="skeleton"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    marginBottom: 8,
                  }}
                />
                <div
                  className="skeleton"
                  style={{
                    width: 80,
                    height: 16,
                    borderRadius: 8,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className={styles.recentActivity}>
          <div
            className="skeleton"
            style={{
              width: 180,
              height: 24,
              borderRadius: 8,
              marginBottom: 24,
            }}
          />
          <div className={styles.activityList}>
            {[1, 2, 3].map((i) => (
              <div key={i} className={styles.activityItem}>
                <div
                  className={`${styles.activityIcon} skeleton`}
                  style={{ background: "#eee", color: "#eee" }}
                />
                <div className={styles.activityDetails}>
                  <div
                    className="skeleton"
                    style={{
                      width: 120,
                      height: 16,
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  />
                  <div
                    className="skeleton"
                    style={{
                      width: 80,
                      height: 12,
                      borderRadius: 8,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </>
);

export default AdminDashboardSkeleton;
