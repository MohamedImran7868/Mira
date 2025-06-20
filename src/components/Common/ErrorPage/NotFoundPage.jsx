import { useNavigate } from "react-router-dom";
import Header from "../Header";
import styles from "./ErrorPages.module.css";
import { FaCompass, FaArrowLeft, FaHome } from "react-icons/fa";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <div className={styles.notFoundContainer}>
        <div className={styles.content}>
          <div className={styles.iconContainer}>
            <FaCompass className={styles.errorIcon} />
          </div>
          <h1 className={styles.errorTitle}>Page Not Found</h1>
          <p className={styles.errorMessage}>
            The page you're looking for doesn't exist or has been moved.
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
        </div>
      </div>
    </>
  );
};

export default NotFound;