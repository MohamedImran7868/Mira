import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
//import styles from './CompleteProfile.module.css';
import LoadingModal from '../../Common/LoadingModal';

const CompleteProfile = () => {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [age, setAge] = useState('');
  const [contact, setContact] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { completeGoogleRegistration } = useAuth();
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
      await completeGoogleRegistration({
        name,
        birthday,
        age,
        contact
      });
      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <h2>Complete Your Profile</h2>
        <p>Please provide some additional information to complete your registration</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.inputGroup}>
            <label>Full Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.rowContainer}>
            <div className={styles.inputGroup}>
              <label>Birthday:</label>
              <input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                required
                disabled={loading}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Age:</label>
              <input
                type="number"
                value={age}
                readOnly
                className={styles.readOnlyInput}
                min="13"
              />
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label>Contact Number:</label>
            <input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Completing Registration...' : 'Complete Registration'}
          </button>
        </form>
      </div>
      
      {loading && <LoadingModal message="Completing your registration..." />}
    </div>
  );
};

export default CompleteProfile;