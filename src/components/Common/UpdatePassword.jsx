import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import styles from './UpdatePassword.module.css';
import { FaLock, FaCheckCircle, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa';

function UpdatePassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updatePassword, userProfile } = useAuth();

  const validatePassword = (value) => {
    setPasswordRequirements({
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      number: /[0-9]/.test(value),
      specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
    });
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    validatePassword(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await updatePassword(password);
      setMessage("Password updated successfully!");
      setTimeout(() => navigate(userProfile?.role === "student"
            ? "/chat"
            : "/admin-dashboard"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <FaArrowLeft /> Back
        </button>

        <div className={styles.header}>
          <FaLock className={styles.headerIcon} />
          <h2>Update Password</h2>
          <p>Create a new secure password for your account</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        {message && (
          <div className={styles.successMessage}>
            <FaCheckCircle className={styles.successIcon} />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>New Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={loading}
                className={styles.inputField}
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={styles.passwordToggle}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {password && (
            <div className={styles.passwordRequirements}>
              <h4>Password Requirements:</h4>
              <ul>
                <li className={passwordRequirements.length ? styles.valid : ""}>
                  {passwordRequirements.length ? "✓" : "✗"} Minimum 8 characters
                </li>
                <li className={passwordRequirements.uppercase ? styles.valid : ""}>
                  {passwordRequirements.uppercase ? "✓" : "✗"} At least one uppercase letter
                </li>
                <li className={passwordRequirements.lowercase ? styles.valid : ""}>
                  {passwordRequirements.lowercase ? "✓" : "✗"} At least one lowercase letter
                </li>
                <li className={passwordRequirements.number ? styles.valid : ""}>
                  {passwordRequirements.number ? "✓" : "✗"} At least one number
                </li>
                <li className={passwordRequirements.specialChar ? styles.valid : ""}>
                  {passwordRequirements.specialChar ? "✓" : "✗"} At least one special character
                </li>
              </ul>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Confirm Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className={`${styles.inputField} ${
                  confirmPassword && password !== confirmPassword ? styles.invalid : ""
                }`}
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className={styles.passwordToggle}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className={styles.submitButton}>
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default UpdatePassword;
