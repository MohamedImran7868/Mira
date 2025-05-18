import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import styles from './CompleteProfile.module.css';
import LoadingModal from '../../Common/LoadingModal';

const CompleteProfile = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { completeGoogleRegistration } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate age (must be at least 13 years old)
    if (parseInt(age) < 18) {
      setError("You must be at least 18 years old to register");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await completeGoogleRegistration({
        name,
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
              <label>Age:</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                min="18"
                disabled={loading}
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

          <div className={styles.inputGroup}>
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Confirm Password:</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
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