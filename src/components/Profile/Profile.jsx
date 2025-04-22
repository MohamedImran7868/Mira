import React from 'react';
import Header from '../Header';
import styles from './Profile.module.css';
import profilepic from '../../assets/imran.jpg';

const Profile = () => {
  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <img src={profilepic} alt="Profile" className={styles.profileImage} />
            <h2 className={styles.profileName}>Mohamed Imran</h2>
          </div>
          
          <div className={styles.profileInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Age:</span>
              <span className={styles.infoValue}>22</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email:</span>
              <span className={styles.infoValue}>1211101935@student.mmu.edu.my</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Phone:</span>
              <span className={styles.infoValue}>01121072006</span>
            </div>
          </div>
          
          <button className={styles.editBtn}>
            Edit Profile
          </button>
        </div>
      </div>
    </>
  );
};

export default Profile;