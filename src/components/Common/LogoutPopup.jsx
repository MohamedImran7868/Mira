import React from 'react';
import styles from './LogoutPopup.module.css';

const LogoutPopup = ({ isVisible, onConfirm, onClose }) => {
  if (!isVisible) return null;

  return (
    <div className={styles.popup}>
      <div className={styles.popupContent}>
        <button className={styles.closelgout} onClick={onClose}>&times;</button>
        <div className={styles.contentpp}>
          <p>Are you sure you want to log out?</p>
          <div className={styles.popupButtons}>
            <button className={styles.yesBtn} onClick={onConfirm}>Yes</button>
            <button className={styles.noBtn} onClick={onClose}>No</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutPopup;
