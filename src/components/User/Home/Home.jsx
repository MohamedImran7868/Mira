import React from 'react';
import Header from '../../Common/Header';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';

const Home = () => {
  const navigate = useNavigate();
  return (
    <>
    <Header />
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to MIRA.<br />Your personal emotional assistant<br /> chatbot is ready to serve</h1>
      
      <div className={styles.innerContainer}>
        <p className={styles.slogan}>Talk.Feel.Heal</p>
        
        <div className={styles.btnContainer}>
          <button 
            onClick={() => navigate('/register')}
            className={styles.registerBtn}
            style={{ fontFamily: 'Agrandir, sans-serif' }}
          >
            Register
          </button>
          <button 
            onClick={() => navigate('/login')}
            className={styles.loginBtn}
            style={{ fontFamily: 'Agrandir, sans-serif' }}
          >
            Login
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Home;