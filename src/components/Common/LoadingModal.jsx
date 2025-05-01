import React from 'react';
import styles from './LoadingModal.module.css';

const LoadingModal = ({ message = "Processing..." }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.spinner}></div>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingModal;