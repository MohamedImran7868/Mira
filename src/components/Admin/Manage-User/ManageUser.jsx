import React, {useState} from "react";
import { useNavigate, Link } from 'react-router-dom';
import Header from '../../Header';
import styles from './ManageUser.module.css';

function ManageUser() {
    return (
        <>
            <Header />
            <div className={styles.container}>
                <div className={styles.topContainer}>
                    <label className={styles.label}>User:</label>
                    <input type="text" className={styles.input} placeholder="Search by name or email" />
                    <button className={styles.searchBtn} type="submit">Search User</button>
                </div>
                <div className={styles.userList}>
                    <div className={styles.userItem}>
                        <span className={styles.user}>User 1</span>
                        <div className={styles.btnContainer}>
                            <button className={styles.suspendBtn}>Suspend</button>
                            <button className={styles.deleteBtn}>Delete</button>
                        </div>
                    </div>
                    <hr />
                    <div className={styles.userItem}>
                        <span className={styles.user}>User 1</span>
                        <div className={styles.btnContainer}>
                            <button className={styles.suspendBtn}>Suspend</button>
                            <button className={styles.deleteBtn}>Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ManageUser;