import React, { useState } from 'react';
import Header from '../../Header';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';
import { useAuth } from "../../../AuthContext";

const Register = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signUp(email, password, {
        full_name: name,
        age: parseInt(age),
      });
      navigate("/chat");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.innerContainer}>
          <h2>Create New Account</h2>
          {error && <div className={styles.error}>{error}</div>}
          <form className={styles.inputContainer} onSubmit={handleSubmit}>
            <label className={styles.label}>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
            <label className={styles.label}>Age:</label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
            <label className={styles.label}>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
            <label className={styles.label}>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
          
            <button 
              type='submit' 
              className={styles.registerBtn}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          
          <div className={styles.loginContainer}>
            <button 
              onClick={() => !loading && navigate('/login')}
              className={styles.loginBtn}
              disabled={loading}
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