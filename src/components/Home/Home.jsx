import React from 'react';
import Header from '../Common/Header';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { FaArrowRight, FaCommentAlt } from 'react-icons/fa';

const Home = () => {
  const navigate = useNavigate();
  
  return (
    <>
      <Header />
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.textContent}>
            <h1 className={styles.title}>
              Welcome to <span className={styles.highlight}>MIRA</span>
            </h1>
            <p className={styles.subtitle}>
              Your personal emotional assistant chatbot is ready to serve
            </p>
            <div className={styles.sloganContainer}>
              <FaCommentAlt className={styles.sloganIcon} />
              <span className={styles.slogan}>Talk.Feel.Heal</span>
            </div>
          </div>
          
          <div className={styles.actionContainer}>
            <div className={styles.featureList}>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>✨</div>
                <p>24/7 emotional support</p>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>🤖</div>
                <p>AI-powered conversations</p>
              </div>
              <div className={styles.featureItem}>
                <div className={styles.featureIcon}>🔒</div>
                <p>Private & confidential</p>
              </div>
            </div>
            
            <div className={styles.buttonGroup}>
              <button 
                onClick={() => navigate('/register')}
                className={styles.primaryBtn}
              >
                Get Started
                <FaArrowRight className={styles.btnIcon} />
              </button>
              <button 
                onClick={() => navigate('/login')}
                className={styles.secondaryBtn}
              >
                Already a member? Login
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.waveBackground}></div>
      </div>
    </>
  );
};

export default Home;