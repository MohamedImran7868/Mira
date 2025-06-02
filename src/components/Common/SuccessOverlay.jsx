import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SuccessOverlay.module.css";

const SuccessOverlay = ({ 
  message = "Operation completed successfully!",
  redirectTo,
  redirectDelay = 2000,
  onRedirect
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (redirectTo) {
        navigate(redirectTo);
      }
      if (onRedirect) {
        onRedirect();
      }
    }, redirectDelay);

    return () => clearTimeout(timer);
  }, [navigate, redirectTo, redirectDelay, onRedirect]);

  return (
    <div className={styles.overlay}>
      <div className={styles.content}>
        <svg
          className={styles.checkmark}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 52 52"
        >
          <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
          <path
            className={styles.checkmarkCheck}
            fill="none"
            d="M14.1 27.2l7.1 7.2 16.7-16.8"
          />
        </svg>
        <h2 className={styles.title}>Success!</h2>
        <p className={styles.message}>{message}</p>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ animationDuration: `${redirectDelay}ms` }} />
        </div>
      </div>
    </div>
  );
};

export default SuccessOverlay;