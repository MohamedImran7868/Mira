import React, {useState, useEffect} from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import logo from '../../../assets/Logo.png';
import profilepic from '../../../assets/imran.jpg';
import { IoSettings } from "react-icons/io5";
import { RiFeedbackFill } from "react-icons/ri";
import styles from './Chat.module.css';
import {auth} from '../../../firebase'
import {signOut } from 'firebase/auth'

const ChatScreen = () => {
  const navigate = useNavigate();

  const logout = async () =>{
    await signOut(auth)
    .then(() => {
      navigate('/login')
    })
  }

  return (
    <>
      <div className={styles.sideMenu}>
          <img src={logo} alt='mira logo' className={styles.logo}/>
        <div className={styles.btn}>
          <button className={styles.feedbackBtn} onClick={logout}>Logout</button>
          <button className={styles.feedbackBtn} onClick={() => navigate('/feedback')}><RiFeedbackFill />Feedback</button>
          <button className={styles.settingsBtn} onClick={() => navigate('/admin-dashboard')}><IoSettings />Setting</button>
        </div>
      </div>
      <div className={styles.container}>
        <div className={styles.topContainer}>
          <Link to="/profile" className={styles.profileLink}>
            <img src={profilepic} alt='user profile picture' className={styles.profilePic}/>
          </Link>
        </div>
        <div className={styles.chatContainer}>
          <h1>Hi Bestie!<br />How was your day?</h1>
        </div>
        <div className={styles.chatInput}>
          <input type="text" className={styles.input} placeholder="Type your message here..." />
          <button className={styles.sendBtn}>Send</button>
        </div>
      </div>
    </>
  );
};

export default ChatScreen;