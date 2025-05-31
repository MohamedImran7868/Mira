import { useEffect, useState } from "react";
import Header from "../Common/Header";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.css";
import { useAuth } from "../../AuthContext";
import LoadingModal from "../Common/LoadingModal";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaLock,
  FaArrowLeft,
  FaIdCard,
} from "react-icons/fa";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    id: "",
    email: "",
    password: "",
    confirmPassword: "",
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.id && formData.id.length === 10) {
      setFormData((prev) => ({
        ...prev,
        email: `${prev.id}@student.mmu.edu.my`,
      }));
    }
  }, [formData.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate ID field to only accept digits and limit to 10 characters
    if (name === "id") {
      if (value === "" || (/^\d+$/.test(value) && value.length <= 10)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "password") {
      setPasswordRequirements({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate ID length
    if (formData.id.length !== 10) {
      setError("ID must be exactly 10 digits");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await registerStudent(formData.email, formData.password, {
        name: formData.name,
        id: formData.id,
      });
      navigate("/login", { state: { registrationSuccess: true } });
    } catch (err) {
      setError(
        "This email is already registered. Please use another email or sign in."
      );
    } finally {
      setLoading(false);
    }

    setFormData({
      name: "",
      id: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  };

  if (loading) {
    return <LoadingModal message="Registering account..." />;
  }

  return (
    <>
      <Header />
      <div className={styles.container}>
        <div className={styles.card}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            <FaArrowLeft /> Back
          </button>

          <div className={styles.header}>
            <h2>Create Your Account</h2>
            <p>Join our community of learners</p>
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

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <FaUser className={styles.inputIcon} />
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
                className={styles.inputField}
                placeholder="Enter your full name"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <FaIdCard className={styles.inputIcon} />
                ID Number
              </label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                required
                disabled={loading}
                className={styles.inputField}
                placeholder="Enter your 10-digit ID"
                maxLength="10"
                pattern="\d{10}"
                inputMode="numeric"
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                <FaEnvelope className={styles.inputIcon} />
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly
                className={styles.inputField}
                placeholder="Enter your ID to autocomplete this row"
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
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  minLength="8"
                  className={styles.inputField}
                  placeholder="Create a password"
                  autoComplete="new-password"
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

            {formData.password && (
              <div className={styles.passwordRequirements}>
                <h4>Password Requirements:</h4>
                <ul>
                  <li
                    className={passwordRequirements.length ? styles.valid : ""}
                  >
                    {passwordRequirements.length ? "✓" : "✗"} Minimum 8
                    characters
                  </li>
                  <li
                    className={
                      passwordRequirements.uppercase ? styles.valid : ""
                    }
                  >
                    {passwordRequirements.uppercase ? "✓" : "✗"} At least one
                    uppercase letter
                  </li>
                  <li
                    className={
                      passwordRequirements.lowercase ? styles.valid : ""
                    }
                  >
                    {passwordRequirements.lowercase ? "✓" : "✗"} At least one
                    lowercase letter
                  </li>
                  <li
                    className={passwordRequirements.number ? styles.valid : ""}
                  >
                    {passwordRequirements.number ? "✓" : "✗"} At least one
                    number
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
              <label className={styles.inputLabel}>
                <FaLock className={styles.inputIcon} />
                Confirm Password
              </label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  minLength="8"
                  className={`${styles.inputField} ${
                    formData.confirmPassword &&
                    formData.password !== formData.confirmPassword
                      ? styles.invalid
                      : ""
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className={styles.passwordToggle}
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
              {loading ? "Creating Account..." : "Register Now"}
            </button>
          </form>

          <div className={styles.footer}>
            <span>Already have an account?</span>
            <button
              onClick={() => navigate("/login")}
              className={styles.loginLink}
              disabled={loading}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;
