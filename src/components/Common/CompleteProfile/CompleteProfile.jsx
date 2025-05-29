import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../AuthContext";
import styles from "./CompleteProfile.module.css";
import LoadingModal from "../../Common/LoadingModal";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const CompleteProfile = () => {
  const [editData, setEditData] = useState({
    name: "",
    contact: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Password Change Handle
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

  const { user, CompleteAdminProfile, updatePassword } = useAuth();
  const navigate = useNavigate();

  // Add this useEffect to prevent back navigation
  useEffect(() => {
    if (user?.isProfile_set === "not set") {
      window.history.pushState(null, null, window.location.pathname);

      const handlePopState = () => {
        window.history.pushState(null, null, window.location.pathname);
      };

      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }
  }, [user?.isProfile_set]); // More specific dependency

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "contact") {
      // Only allow numbers and optional + at start
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

  // Sumbit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    //console.log(user.role);
    navigate("/admin-dashboard", { replace: true });

    // try {
    //   validateForm();

    //   if (user.role === "admin") {
    //     await CompleteAdminProfile(editData);

    //     if (passwordData.password) {
    //       await updatePassword(passwordData.password);
    //     }

    //     navigate("/admin-dashboard", { replace: true });
    //   }
    // } catch (err) {
    //   setError(err.message);
    // } finally {
    //   setLoading(false);
    // }
  };

  return (
    <div className={styles.container}>
      <div className={styles.innerContainer}>
        <h2>Complete Your Profile</h2>
        <p>
          Please provide some additional information to complete your
          registration
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit} autoComplete="off" >
          <div className={styles.inputGroup}>
            <label className={styles.label}>Full Name:</label>
            <input
              type="text"
              id="username"
              name="name"
              value={editData.name}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contact Number:</label>
            <input
              type="tel"
              name="contact"
              id="contact"
              value={editData.contact}
              onChange={handleInputChange}
              disabled={loading}
              autoComplete="tel"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password:</label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={passwordData.password}
              onChange={handlePasswordChange}
              disabled={loading}
              autoComplete="new-password"
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

          {passwordData.password && (
            <div className={styles.passwordRequirements}>
              <h4>Password Requirements:</h4>
              <ul>
                <li className={passwordRequirements.length ? styles.valid : ""}>
                  {passwordRequirements.length ? "✓" : "✗"} Minimum 8 characters
                </li>
                <li
                  className={passwordRequirements.uppercase ? styles.valid : ""}
                >
                  {passwordRequirements.uppercase ? "✓" : "✗"} At least one
                  uppercase letter
                </li>
                <li
                  className={passwordRequirements.lowercase ? styles.valid : ""}
                >
                  {passwordRequirements.lowercase ? "✓" : "✗"} At least one
                  lowercase letter
                </li>
                <li className={passwordRequirements.number ? styles.valid : ""}>
                  {passwordRequirements.number ? "✓" : "✗"} At least one number
                </li>
                <li
                  className={
                    passwordRequirements.specialChar ? styles.valid : ""
                  }
                >
                  {passwordRequirements.specialChar ? "✓" : "✗"} At least one
                  special character
                </li>
              </ul>
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Confirm Password:</label>
            <div></div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
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

          <button type="submit" disabled={loading}>
            {loading ? "Completing Registration..." : "Complete Registration"}
          </button>
        </form>
      </div>

      {loading && <LoadingModal message="Completing your registration..." />}
    </div>
  );
};

export default CompleteProfile;
