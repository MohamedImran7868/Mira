import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../AuthContext";
import styles from "./CompleteProfile.module.css";
import LoadingModal from "../../Common/LoadingModal";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaPhone,
  FaLock,
  FaCheck,
} from "react-icons/fa";

const CompleteProfile = () => {
  const [editData, setEditData] = useState({
    name: "",
    contact: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  const { user, completeProfile, updatePassword } = useAuth();
  const navigate = useNavigate();

  // To prevent back navigation
  useEffect(() => {
    if (user?.isProfile_set === "not set") {
      window.history.pushState(null, null, window.location.pathname);

      const handlePopState = () => {
        window.history.pushState(null, null, window.location.pathname);
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [user?.isProfile_set]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact") {
      if (!/^\+?\d*$/.test(value)) return;
    }

    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!editData.name || !editData.contact) {
      throw new Error("All fields are required");
    }

    if (passwordData.password && !passwordsMatch) {
      throw new Error("Passwords do not match");
    }

    if (passwordData.password) {
      const { length, uppercase, lowercase, number, specialChar } =
        passwordRequirements;
      if (!(length && uppercase && lowercase && number && specialChar)) {
        throw new Error("Password does not meet requirements");
      }
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      setPasswordRequirements({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }

    if (
      name === "confirmPassword" ||
      (name === "password" && passwordData.confirmPassword)
    ) {
      setPasswordsMatch(value === passwordData.password);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      validateForm();
      await completeProfile(editData);

      if (passwordData.password) {
        await updatePassword(passwordData.password);
      }

      navigate("/admin-dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Complete Your Profile</h2>
          <p>
            Please provide some additional information to finish setting up your
            account
          </p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className={styles.form}
          autoComplete="off"
        >
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              <FaUser className={styles.inputIcon} />
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={editData.name}
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              <FaPhone className={styles.inputIcon} />
              Contact Number
            </label>
            <input
              type="tel"
              name="contact"
              value={editData.contact}
              onChange={handleInputChange}
              className={styles.inputField}
              placeholder="+60123456789"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              <FaLock className={styles.inputIcon} />
              Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
                className={styles.inputField}
                placeholder="Create a password"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className={styles.toggleBtn}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          {passwordData.password && (
            <div className={styles.passwordRequirements}>
              <h4>Password Requirements:</h4>
              <ul className={styles.requirementsList}>
                <li className={passwordRequirements.length ? styles.valid : ""}>
                  <span className={styles.checkmark}>
                    {passwordRequirements.length ? <FaCheck /> : "✗"}
                  </span>
                  Minimum 8 characters
                </li>
                <li
                  className={passwordRequirements.uppercase ? styles.valid : ""}
                >
                  <span className={styles.checkmark}>
                    {passwordRequirements.uppercase ? <FaCheck /> : "✗"}
                  </span>
                  At least one uppercase letter
                </li>
                <li
                  className={passwordRequirements.lowercase ? styles.valid : ""}
                >
                  <span className={styles.checkmark}>
                    {passwordRequirements.lowercase ? <FaCheck /> : "✗"}
                  </span>
                  At least one lowercase letter
                </li>
                <li className={passwordRequirements.number ? styles.valid : ""}>
                  <span className={styles.checkmark}>
                    {passwordRequirements.number ? <FaCheck /> : "✗"}
                  </span>
                  At least one number
                </li>
                <li
                  className={
                    passwordRequirements.specialChar ? styles.valid : ""
                  }
                >
                  <span className={styles.checkmark}>
                    {passwordRequirements.specialChar ? <FaCheck /> : "✗"}
                  </span>
                  At least one special character
                </li>
              </ul>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              <FaLock className={styles.inputIcon} />
              Confirm Password
            </label>
            <div className={styles.passwordWrapper}>
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`${styles.inputField} ${
                  passwordData.confirmPassword && !passwordsMatch
                    ? styles.invalid
                    : ""
                }`}
                placeholder="Confirm your password"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className={styles.toggleBtn}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "Completing Registration..." : "Complete Registration"}
          </button>
        </form>
      </div>

      {loading && <LoadingModal message="Completing your registration..." />}
    </div>
  );
};

export default CompleteProfile;
