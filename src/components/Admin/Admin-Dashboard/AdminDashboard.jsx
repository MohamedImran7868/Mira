import React, {useState} from "react";
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../Common/Header';
import styles from './AdminDashboard.module.css';
import profilepic from '../../../assets/imran.jpg';

function AdminDashboard() {
    const navigate = useNavigate();

    return(
    <>
        <Header />
        <div className={styles.container}>
            <div className={styles.topContainer}>
                <h1>Welcome to your dashboard!</h1>
                <Link to="/profile" className={styles.profileLink}>
                    <img src={profilepic} alt='user profile picture' className={styles.profilePic}/>
                </Link>
            </div>
            <div className={styles.btnContainer}>
                <button className={styles.btn} onClick={() => navigate('/manage-user')}>Manage User</button>
                <button className={styles.btn} onClick={() => navigate('/view-feedback')}>View Feedback</button>
                <button className={styles.btn} onClick={() => navigate('/view-resources')}>View Resources</button>
            </div>
        </div>
    </>
    );
}

export default AdminDashboard;