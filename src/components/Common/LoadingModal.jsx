import React from 'react';
import styles from './LoadingModal.module.css';
import { FaSpinner } from 'react-icons/fa';

const LoadingModal = ({ message = "Processing..." }) => {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.spinnerContainer}>
          <FaSpinner className={styles.spinner} />
        </div>
        <p className={styles.message}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingModal;