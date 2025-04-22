import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import Header from '../../Header';
import styles from './Login.module.css';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock authentication (replace with real API call)
    login({ email });
    navigate('/chat'); // Redirect to chat after login
  };

  return (
    <>
    <Header />
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2>Enter Your Information</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p>
          Don't have an account?{' '}
          <span onClick={() => navigate('/register')}>Register</span>
        </p>
      </form>
    </div>
    </>
  );
};

export default LoginScreen;