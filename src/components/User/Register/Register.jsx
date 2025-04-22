import React, { useState } from 'react';
import Header from '../../Header';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';

const Register = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  return (
    <>
    <Header />
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <h2>Create New Account</h2>
        
        <div className={styles.inputContainer}>
          <label className={styles.label}>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
        </div>
        
        <div className={styles.inputContainer}>
          <label className={styles.label}>Age:</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={styles.input}
          />
        </div>
        
        <div className={styles.inputContainer}>
          <label className={styles.label}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>
        
        <div className={styles.inputContainer}>
          <label className={styles.label}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>
        
        <button className={styles.registerBtn}>Register</button>
        
        <div className={styles.loginContainer}>
          <button 
            onClick={() => navigate('/login')}
            className={styles.loginBtn}
            style={{ fontFamily: 'Agrandir, sans-serif' }}
          >
            Already have an account? Login
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Register;