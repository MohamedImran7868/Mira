import { useNavigate } from "react-router-dom";
import Header from "../Header";
import styles from "./ErrorPages.module.css";
import { FaLock, FaArrowLeft, FaSignInAlt, FaHome } from "react-icons/fa";

const UnauthorizedPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className={styles.unauthorizedContainer}>
        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <FaLock className={styles.errorIcon} />
          </div>
          <h1 className={styles.errorTitle}>401 - Unauthorized Access</h1>
          <p className={styles.errorMessage}>
            You don't have permission to view this page.
          </p>
          <p className={styles.subMessage}>
            Please sign in with an authorized access account or return to a safe
            page.
          </p>
          <div className={styles.buttonGroup}>
            <button
              className={styles.primaryButton}
              onClick={() => navigate("/")}
            >
              <FaHome className={styles.buttonIcon} />
              Go Home
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className={styles.buttonIcon} />
              Go Back
            </button>
          </div>
          <div className={styles.contactSupport}>
            <p>Need access to this page?</p>
            <a href="mailto:team@mirahub.me" className={styles.supportLink}>
              Request access from your administrator
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default UnauthorizedPage;
