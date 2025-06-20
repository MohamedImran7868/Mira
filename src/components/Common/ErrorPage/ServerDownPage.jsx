import { useNavigate } from "react-router-dom";
import Header from "../Header";
import styles from "./ErrorPages.module.css";
import { FaServer, FaArrowLeft } from "react-icons/fa";

const ServerError = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className={styles.serverErrorContainer}>
        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <FaServer className={styles.errorIcon} />
          </div>
          <h1 className={styles.errorTitle}>Server Unavailable</h1>
          <p className={styles.creativeMessage}>
            MIRA is sleeping right now. <br />
            It will get back to you in full energy!
          </p>
          <div className={styles.buttonGroup}>
            <button
              className={styles.primaryButton}
              onClick={() => window.location.reload()}
            >
              Try Again
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
            <p>Need immediate help?</p>
            <a href="mailto:team@mirahub.me" className={styles.supportLink}>
              Contact our support team
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServerError;