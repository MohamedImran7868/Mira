import React, { useState, useEffect } from 'react';
import Header from '../../Header';
import { useNavigate } from 'react-router-dom';
import styles from './Register.module.css';
import { useAuth } from "../../../AuthContext";

const Register = () => {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();

  const navigate = useNavigate();

  // Calculate age from birthday
  useEffect(() => {
    if (birthday) {
      const birthDate = new Date(birthday);
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      
      setAge(calculatedAge.toString());
    }
  }, [birthday]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate age (must be at least 13 years old)
    if (parseInt(age) < 13) {
      setError("You must be at least 13 years old to register");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await signUp(email, password, {
        full_name: name,
        age: parseInt(age),
        birthday: birthday 
      });
      setTimeout(() => navigate("/chat"), 1500);
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
            <label className={styles.label} htmlFor='name'>Name:</label>
            <input
              type="text"
              name='name'
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
            <div className={styles.rowContainer}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Birthday:</label>
                <input
                  type="date"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className={styles.input}
                  required
                  disabled={loading}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
              </div>
              
              <div className={styles.inputGroup}>
                <label className={styles.label}>Age:</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className={styles.input}
                  required
                  disabled={true} // Age is now read-only as it's calculated from birthday
                  min="13"
                />
              </div>
            </div>
            <label className={styles.label} htmlFor='email'>Email:</label>
            <input
              type="email"
              name='email'
              id='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              required
              disabled={loading}
            />
            <label className={styles.label} htmlFor='password'>Password:</label>
            <input
              type="password"
              name='password'
              id='password'
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