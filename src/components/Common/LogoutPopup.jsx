import React from 'react';
import styles from './LogoutPopup.module.css';
import { FaSignOutAlt, FaTimes } from 'react-icons/fa';

const LogoutPopup = ({ isVisible, onConfirm, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className={styles.popupOverlay}>
      <div className={styles.popupContent}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        <div className={styles.popupBody}>
          <div className={styles.popupIcon}>
            <FaSignOutAlt />
          </div>
          <h3>Confirm Logout</h3>
          <p>Are you sure you want to log out of your account?</p>
          <div className={styles.popupButtons}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.confirmButton} onClick={onConfirm}>
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutPopup;