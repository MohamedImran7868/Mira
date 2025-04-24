import React, { useState } from 'react';
import Header from '../../Header';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';
import {auth, signInWithGooglePopup} from '../../../firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'

const Register = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
      e.preventDefault();
  
      //Firebase Authentication 
      await createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user
        navigate('/chat');
        console.log(user)
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage)
      });
    };

    const regGoogleUser = async () => {
        await signInWithGooglePopup()
        .then((userCredential) => {
          const user = userCredential.user;
          navigate("/chat");
          console.log(user);
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log(errorCode, errorMessage);
          document.getElementById("errorMessage").style.display = "block";
        });;
      };

  return (
    <>
    <Header />
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <h2>Create New Account</h2>
        <form className={styles.inputContainer} onSubmit={handleSubmit}>
          <label className={styles.label}>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            required
          />
          <label className={styles.label}>Age:</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className={styles.input}
            required
          />
          <label className={styles.label}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            required
          />
          <label className={styles.label}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />
        
        <button type='submit' className={styles.registerBtn}>Register</button>
        </form>
        
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